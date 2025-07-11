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

# Set MongoDB URI environment variable
os.environ["MONGO_URI"] = "mongodb+srv://smitvaghasiya11280:resume_analyzer%40123@cluster0.u9fpxqt.mongodb.net/"
os.environ["MONGODB_URL"] = "mongodb+srv://smitvaghasiya11280:resume_analyzer%40123@cluster0.u9fpxqt.mongodb.net/"

from app.models import ResumeAnalysisResponse, ErrorResponse
from app.file_processor import FileProcessor
from app.groq_service import GroqService
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection

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


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Resume Analyzer API",
        "status": "running",
        "version": "1.0.0"
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


@app.post("/analyze-resume", response_model=Union[ResumeAnalysisResponse, ErrorResponse])
async def analyze_resume(
    resume_file: UploadFile = File(...),
    job_description_file: Optional[UploadFile] = File(None),
    job_description_text: Optional[str] = Form(None)
):
    """
    Analyze resume against job description
    
    - **resume_file**: Resume file (PDF, DOCX, or TXT)
    - **job_description_file**: Job description file (PDF, DOCX, or TXT) - optional if job_description_text is provided
    - **job_description_text**: Job description as plain text - optional if job_description_file is provided
    """
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
        
        # Perform resume analysis (includes job description validation)
        logger.info("Starting resume analysis with AI (includes job description validation)")
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
        
        # Final Pydantic model creation
        try:
            response = ResumeAnalysisResponse(**analysis_result)
            logger.info("✅ Resume analysis completed successfully with valid schema")
            return response
        
        except Exception as e:
            logger.error(f"Unexpected error creating response model: {str(e)}")
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="response_model_creation_failed",
                    message="Failed to create response model",
                    details=str(e)
                ).dict()
            )
        
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