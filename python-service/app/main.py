import uuid
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys

from .config import settings
from .database import connect_to_mongo, close_mongo_connection, save_analysis, get_analysis_by_id, check_mongo_health
from .file_processor import process_files, extract_text_from_file
from .ai_analyzer import ai_analyzer
from .models import AnalysisResult, AnalysisDocument, AnalysisResponse, HealthResponse


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.log_level
)


# Create FastAPI app
app = FastAPI(
    title="Resume Analyzer API",
    description="AI-powered resume analysis service using Groq and MongoDB",
    version="1.0.0"
)


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting FastAPI Resume Analyzer Service")
    try:
        await connect_to_mongo()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down FastAPI Resume Analyzer Service")
    await close_mongo_connection()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "Resume Analyzer API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check MongoDB
        mongo_health = await check_mongo_health()
        
        # Check AI service
        ai_health = await ai_analyzer.check_ai_health()
        
        # Overall status
        overall_status = "healthy"
        if mongo_health.get("status") != "connected" or ai_health.get("status") != "healthy":
            overall_status = "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.utcnow(),
            services={
                "mongodb": mongo_health,
                "groq_ai": ai_health,
                "file_processor": {"status": "healthy"}
            }
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="error",
            timestamp=datetime.utcnow(),
            services={
                "error": str(e)
            }
        )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(..., description="Resume file (PDF, DOC, DOCX, TXT)"),
    job_description: UploadFile = File(None, description="Job description file (PDF, DOC, DOCX, TXT)"),
    job_description_text: str = Form(None, description="Job description as text")
):
    """Analyze resume against job description"""
    analysis_id = str(uuid.uuid4())
    
    try:
        # Determine input method for job description
        has_job_file = job_description is not None
        has_job_text = job_description_text is not None and job_description_text.strip()
        
        logger.info(f"Starting analysis {analysis_id} for resume: {resume.filename}, job description: {'file' if has_job_file else 'text' if has_job_text else 'none'}")
        
        # Process resume file
        resume_text = await extract_text_from_file(resume)
        
        # Process job description
        if has_job_file:
            job_description_text_final = await extract_text_from_file(job_description)
            logger.info(f"Job description extracted from file: {job_description.filename}")
        elif has_job_text:
            job_description_text_final = job_description_text.strip()
            logger.info(f"Job description provided as text: {len(job_description_text_final)} characters")
        else:
            # Use a default job description
            job_description_text_final = "General professional position requiring relevant skills and experience."
            logger.warning("No job description provided, using default")
        
        logger.info(f"Files processed successfully for analysis {analysis_id}")
        
        # Perform AI analysis
        analysis_result = await ai_analyzer.analyze_resume(resume_text, job_description_text_final)
        
        logger.info(f"AI analysis completed for {analysis_id} with score: {analysis_result.score}")
        
        # Save to database
        analysis_doc = AnalysisDocument(
            analysis_id=analysis_id,
            resume_filename=resume.filename or "unknown",
            job_description_filename=job_description.filename if has_job_file else "text_input",
            resume_text=resume_text,
            job_description_text=job_description_text_final,
            result=analysis_result,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await save_analysis(analysis_doc)
        
        logger.info(f"Analysis {analysis_id} saved to database")
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status="completed",
            message="Analysis completed successfully",
            result=analysis_result
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Analysis failed for {analysis_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    """Get analysis result by ID"""
    try:
        # Get analysis from database
        analysis_doc = await get_analysis_by_id(analysis_id)
        
        if not analysis_doc:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found"
            )
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status="completed",
            message="Analysis retrieved successfully",
            result=analysis_doc.result
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Failed to get analysis {analysis_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve analysis: {str(e)}"
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    logger.error(f"HTTP error {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    ) 