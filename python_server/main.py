import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Optional, Union
import uvicorn
import time
from uuid import uuid4
from datetime import datetime

# Ensure MONGODB_URL is set in the environment; add a retry mechanism for MongoDB connection in the app startup.
# (No need to set credentials or fallback to local MongoDB here.)

from app.models import ResumeAnalysisResponse, ErrorResponse, AnalysisDocument
from app.file_processor import FileProcessor
from app.groq_service import GroqService
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, save_analysis, get_analysis_by_id

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app"""
    # Startup
    try:
        await connect_to_mongo()
        logger.info("✅ MongoDB connected successfully")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        # Continue without database for now
    
    yield
    
    # Shutdown
    try:
        await close_mongo_connection()
        logger.info("✅ MongoDB connection closed")
    except Exception as e:
        logger.error(f"❌ Error closing MongoDB connection: {e}")


# Initialize FastAPI app
app = FastAPI(
    title="AI Resume Analyzer",
    description="Advanced AI-powered resume analysis using Groq's LLaMA model",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this based on your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    groq_service = GroqService()
    file_processor = FileProcessor()
    logger.info("Services initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize services: {str(e)}")
    raise

# Include routes
from routes.analysis_routes import router as analysis_router
from routes.health_routes import router as health_router

app.include_router(analysis_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Resume Analyzer API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/test-upload")
async def test_upload(
    resume_file: UploadFile = File(...),
    job_description_text: Optional[str] = Form(None)
):
    """Test endpoint to verify file upload and form data handling"""
    logger.info("=== TEST UPLOAD REQUEST RECEIVED ===")
    logger.info(f"Resume file: {resume_file.filename}")
    logger.info(f"Job description text length: {len(job_description_text) if job_description_text else 0}")
    
    return {
        "message": "Test upload successful",
        "resume_filename": resume_file.filename,
        "job_description_length": len(job_description_text) if job_description_text else 0,
        "resume_size": len(await resume_file.read())
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test Groq connection
        api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY not configured")
        
        return {
            "status": "healthy",
            "services": {
                "groq_api": "connected",
                "file_processor": "ready"
            },
            "model": settings.groq_model or os.getenv("GROQ_MODEL", "llama3-70b-8192")
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.get("/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    """Get analysis status by analysis ID"""
    try:
        logger.info(f"Checking analysis status for ID: {analysis_id}")
        
        # Get analysis from database
        analysis_doc = await get_analysis_by_id(analysis_id)
        
        if not analysis_doc:
            return JSONResponse(
                status_code=404,
                content=ErrorResponse(
                    error="analysis_not_found",
                    message=f"Analysis with ID {analysis_id} not found"
                ).dict()
            )
        
        # Return the analysis status
        return {
            "success": True,
            "analysis_id": analysis_id,
            "status": analysis_doc.status,
            "has_result": analysis_doc.analysis_result is not None
        }
        
    except Exception as e:
        logger.error(f"Error checking analysis status: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="internal_server_error",
                message="Failed to check analysis status",
                details=str(e)
            ).dict()
        )


@app.get("/analysis/{analysis_id}/result")
async def get_analysis_result(analysis_id: str):
    """Get complete analysis result by analysis ID"""
    try:
        logger.info(f"Fetching analysis result for ID: {analysis_id}")
        
        # Get analysis from database
        analysis_doc = await get_analysis_by_id(analysis_id)
        
        if not analysis_doc:
            return JSONResponse(
                status_code=404,
                content=ErrorResponse(
                    error="analysis_not_found",
                    message=f"Analysis with ID {analysis_id} not found"
                ).dict()
            )
        
        if analysis_doc.status != "completed":
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="analysis_not_completed",
                    message=f"Analysis with ID {analysis_id} is not completed (status: {analysis_doc.status})"
                ).dict()
            )
        
        # Return the complete analysis result
        return {
            "success": True,
            "analysis_id": analysis_id,
            "status": analysis_doc.status,
            "analysis_result": analysis_doc.analysis_result.dict() if analysis_doc.analysis_result else None,
            "resume_filename": analysis_doc.resume_filename,
            "job_description_filename": analysis_doc.job_description_filename,
            "created_at": analysis_doc.created_at.isoformat(),
            "processing_time": analysis_doc.processing_time
        }
        
    except Exception as e:
        logger.error(f"Error fetching analysis result: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="internal_server_error",
                message="Failed to fetch analysis result",
                details=str(e)
            ).dict()
        )


@app.post("/analyze-resume")
async def analyze_resume(
    resume_file: UploadFile = File(...),
    job_description_file: Optional[UploadFile] = File(None),
    job_description_text: Optional[str] = Form(None)
):
    """
    Analyze resume against job description and save to database
    
    - **resume_file**: Resume file (PDF, DOCX, or TXT)
    - **job_description_file**: Job description file (PDF, DOCX, or TXT) - optional if job_description_text is provided
    - **job_description_text**: Job description as plain text - optional if job_description_file is provided
    
    Returns analysis ID for tracking progress
    """
    start_time = time.time()
    
    # Add detailed logging at the very beginning
    logger.info("=== RESUME ANALYSIS REQUEST RECEIVED ===")
    logger.info(f"Resume file: {resume_file.filename if resume_file else 'None'}")
    logger.info(f"Job description file: {job_description_file.filename if job_description_file else 'None'}")
    logger.info(f"Job description text length: {len(job_description_text) if job_description_text else 0}")
    logger.info(f"Job description text preview: {job_description_text[:100] if job_description_text else 'None'}...")
    
    try:
        # Validate inputs
        if not job_description_file and not job_description_text:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="missing_job_description",
                    message="Either job_description_file or job_description_text must be provided"
                ).dict()
            )
        
        if job_description_file and job_description_text:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="multiple_job_descriptions",
                    message="Please provide either job_description_file OR job_description_text, not both"
                ).dict()
            )
        
        # Process resume file
        logger.info(f"Processing resume file: {resume_file.filename}")
        resume_content = await resume_file.read()
        
        if not resume_content:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="empty_resume_file",
                    message="Resume file is empty"
                ).dict()
            )
        
        # Extract text from resume
        resume_text, resume_success, resume_file_type = file_processor.process_file(
            resume_content, resume_file.filename or "resume"
        )
        
        if not resume_success:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="resume_processing_failed",
                    message="Failed to extract text from resume",
                    details=resume_text
                ).dict()
            )
        
        # Validate resume content
        resume_valid, resume_validation_msg = file_processor.validate_content(resume_text, "resume")
        if not resume_valid:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="invalid_resume_content",
                    message=resume_validation_msg
                ).dict()
            )
        
        # Process job description
        job_description_text_final = ""
        job_description_filename = None
        
        if job_description_file:
            logger.info(f"Processing job description file: {job_description_file.filename}")
            job_desc_content = await job_description_file.read()
            
            if not job_desc_content:
                return JSONResponse(
                    status_code=400,
                    content=ErrorResponse(
                        error="empty_job_description_file",
                        message="Job description file is empty"
                    ).dict()
                )
            
            job_desc_text, job_desc_success, job_desc_file_type = file_processor.process_file(
                job_desc_content, job_description_file.filename or "job_description"
            )
            
            if not job_desc_success:
                return JSONResponse(
                    status_code=400,
                    content=ErrorResponse(
                        error="job_description_processing_failed",
                        message="Failed to extract text from job description file",
                        details=job_desc_text
                    ).dict()
                )
            
            job_description_text_final = job_desc_text
            job_description_filename = job_description_file.filename
        else:
            job_description_text_final = job_description_text.strip()
        
        # Validate job description content
        job_desc_valid, job_desc_validation_msg = file_processor.validate_content(
            job_description_text_final, "job description"
        )
        if not job_desc_valid:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="invalid_job_description_content",
                    message=job_desc_validation_msg
                ).dict()
            )
        
        # Generate analysis ID
        analysis_id = str(uuid4())
        
        # Perform resume analysis (includes job description validation)
        logger.info(f"Starting resume analysis with AI (analysis_id: {analysis_id})")
        analysis_result = groq_service.analyze_resume(resume_text, job_description_text_final)
        
        # Check if job description validation failed
        if analysis_result.get("job_description_validity") == "Invalid":
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="invalid_job_description",
                    message="Job description validation failed",
                    details=analysis_result.get("validation_error", "Invalid job description format")
                ).dict()
            )
        
        if not analysis_result:
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="analysis_failed",
                    message="Failed to analyze resume with AI",
                    details="AI service returned no result"
                ).dict()
            )
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Create analysis document for database
        analysis_doc = AnalysisDocument(
            analysis_id=analysis_id,
            resume_filename=resume_file.filename or "resume",
            job_description_filename=job_description_filename,
            job_description_text=job_description_text if not job_description_file else None,
            analysis_result=ResumeAnalysisResponse(**analysis_result),
            status="completed",
            processing_time=processing_time,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to database
        try:
            await save_analysis(analysis_doc)
            logger.info(f"✅ Analysis saved to database with ID: {analysis_id}")
        except Exception as e:
            logger.error(f"❌ Failed to save analysis to database: {e}")
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="database_save_failed",
                    message="Analysis completed but failed to save to database",
                    details=str(e)
                ).dict()
            )
        
        # Return success response with analysis ID for tracking
        logger.info(f"✅ Resume analysis completed and saved successfully (analysis_id: {analysis_id})")
        return {
            "success": True,
            "message": "Analysis completed successfully",
            "analysis_id": analysis_id,
            "status": "completed",
            "processing_time": round(processing_time, 2),
            "resume_filename": resume_file.filename,
            "job_description_filename": job_description_filename or "Text Input"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_resume: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="internal_server_error",
                message="An unexpected error occurred",
                details=str(e)
            ).dict()
        )





# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            error="not_found",
            message="Endpoint not found"
        ).dict()
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="internal_server_error",
            message="An internal server error occurred"
        ).dict()
    )


def check_virtual_environment():
    """Check if we're in a virtual environment"""
    return hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import groq
        import uvicorn
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("💡 Please install dependencies with: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("❌ .env file not found")
        print("💡 Please create a .env file with your Groq API key:")
        print("   GROQ_API_KEY=your_groq_api_key_here")
        print("   GROQ_MODEL=llama3-70b-8192")
        return False
    
    # Check for required variables
    with open(env_file, 'r') as f:
        content = f.read()
        
    if "GROQ_API_KEY" not in content:
        print("❌ GROQ_API_KEY not found in .env file")
        return False
    
    if "your_groq_api_key_here" in content:
        print("❌ Please update .env file with your actual Groq API key")
        return False
    
    return True





if __name__ == "__main__":
    print("🚀 Starting AI Resume Analyzer API...")
    print("=" * 50)
    
    # Check virtual environment
    if not check_virtual_environment():
        print("⚠️  Warning: Not running in a virtual environment")
        print("💡 Consider activating your virtual environment:")
        print("   Windows: venv\\Scripts\\activate")
        print("   Linux/Mac: source venv/bin/activate")
        print()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check environment file
    if not check_env_file():
        sys.exit(1)
    
    # Final check for API key in environment
    if not os.getenv("GROQ_API_KEY"):
        logger.error("❌ GROQ_API_KEY environment variable is required")
        sys.exit(1)
    
    print("✅ All checks passed!")
    print("🌐 Starting FastAPI server...")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "main:app",
            host=settings.host,
            port=settings.port,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1) 