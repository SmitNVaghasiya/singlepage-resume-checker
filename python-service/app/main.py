import uuid
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys
from typing import Optional, Union

from .config import settings
from .database import connect_to_mongo, close_mongo_connection, save_analysis, get_analysis_by_id, check_mongo_health
from .file_processor import process_files, extract_text_from_file, FileProcessor
from .ai_analyzer import ai_analyzer
from .groq_service import GroqService
from .response_validator import ResponseValidator
from .models import (
    AnalysisResult, AnalysisDocument, AnalysisResponse, HealthResponse,
    ResumeAnalysisResponse, ErrorResponse
)


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
        
        # Check AI service (legacy)
        ai_health = await ai_analyzer.check_ai_health()
        
        # Check GroqService
        groq_health = {"status": "unavailable"}
        if groq_service:
            try:
                groq_health = await groq_service.check_health()
            except Exception as e:
                groq_health = {"status": "error", "error": str(e)}
        
        # Overall status
        overall_status = "healthy"
        if (mongo_health.get("status") != "connected" or 
            ai_health.get("status") != "healthy" or
            groq_health.get("status") not in ["healthy", "unavailable"]):
            overall_status = "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.utcnow(),
            services={
                "mongodb": mongo_health,
                "groq_ai_legacy": ai_health,
                "groq_service": groq_health,
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


# Initialize services
try:
    groq_service = GroqService()
    logger.info("GroqService initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize GroqService: {str(e)}")
    groq_service = None


@app.post("/analyze-resume", response_model=Union[ResumeAnalysisResponse, ErrorResponse])
async def analyze_resume_comprehensive(
    resume_file: UploadFile = File(...),
    job_description_file: Optional[UploadFile] = File(None),
    job_description_text: Optional[str] = Form(None)
):
    """
    Comprehensive AI-powered resume analysis with detailed JSON output
    
    - **resume_file**: Resume file (PDF, DOCX, or TXT)
    - **job_description_file**: Job description file (PDF, DOCX, or TXT) - optional if job_description_text is provided
    - **job_description_text**: Job description as plain text - optional if job_description_file is provided
    """
    analysis_id = str(uuid.uuid4())
    
    try:
        # Check if GroqService is available
        if not groq_service:
            return JSONResponse(
                status_code=503,
                content=ErrorResponse(
                    error="service_unavailable",
                    message="AI analysis service is not available",
                    details="GroqService could not be initialized"
                ).dict()
            )
        
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
        logger.info(f"Starting comprehensive analysis {analysis_id} for resume: {resume_file.filename}")
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
        resume_text, resume_success, resume_file_type = FileProcessor.process_file(
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
        resume_valid, resume_validation_msg = FileProcessor.validate_content(resume_text, "resume")
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
        job_desc_filename = ""
        
        if job_description_file:
            logger.info(f"Processing job description file: {job_description_file.filename}")
            job_desc_content = await job_description_file.read()
            job_desc_filename = job_description_file.filename or "job_description"
            
            if not job_desc_content:
                return JSONResponse(
                    status_code=400,
                    content=ErrorResponse(
                        error="empty_job_description_file",
                        message="Job description file is empty"
                    ).dict()
                )
            
            job_desc_text, job_desc_success, job_desc_file_type = FileProcessor.process_file(
                job_desc_content, job_desc_filename
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
            job_desc_filename = "text_input"
        
        # Validate job description content
        job_desc_valid, job_desc_validation_msg = FileProcessor.validate_content(
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
        
        # Validate job description with AI
        logger.info("Validating job description with AI")
        validation_result = groq_service.validate_job_description(job_description_text_final)
        
        if not validation_result.get("is_valid", False):
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="invalid_job_description",
                    message="Job description validation failed",
                    details=validation_result.get("reason", "Invalid job description format")
                ).dict()
            )
        
        # Perform resume analysis
        logger.info("Starting resume analysis with AI")
        analysis_result = groq_service.analyze_resume(resume_text, job_description_text_final)
        
        if not analysis_result:
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="analysis_failed",
                    message="Failed to analyze resume with AI",
                    details="AI service returned no result"
                ).dict()
            )
        
        # Comprehensive response validation
        logger.info("Validating AI response against schema")
        is_valid, validation_report = ResponseValidator.comprehensive_validate(analysis_result)
        
        if not is_valid:
            # Log detailed validation errors
            logger.error("AI response validation failed:")
            logger.error(f"Validation report: {validation_report}")
            
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="invalid_ai_response_structure",
                    message="AI response does not match required schema format",
                    details=f"Validation errors: {'; '.join(validation_report['errors'])}"
                ).dict()
            )
        
        # Log validation success with warnings if any
        if validation_report.get("warnings"):
            logger.warning(f"Response validation passed with warnings: {validation_report['warnings']}")
        
        # Final Pydantic model creation (this should now always succeed)
        try:
            response = ResumeAnalysisResponse(**analysis_result)
            logger.info("✅ Resume analysis completed successfully with valid schema")
            
            # **CRITICAL FIX: Save comprehensive analysis to database**
            # Create legacy format analysis result for database storage compatibility
            legacy_analysis_result = AnalysisResult(
                score=analysis_result.get("score_out_of_100", 0),
                strengths=analysis_result.get("resume_improvement_priority", [])[:3],  # Top 3 as strengths
                weaknesses=analysis_result.get("resume_analysis_report", {}).get("weaknesses_analysis", {}).get("critical_gaps_against_job_description", [])[:3],
                suggestions=analysis_result.get("resume_improvement_priority", []),
                keyword_match={
                    "matched": analysis_result.get("resume_analysis_report", {}).get("strengths_analysis", {}).get("technical_skills", []),
                    "missing": analysis_result.get("resume_analysis_report", {}).get("weaknesses_analysis", {}).get("technical_deficiencies", [])[:5],
                    "percentage": float(analysis_result.get("chance_of_selection_percentage", 0)),
                    "total_found": len(analysis_result.get("resume_analysis_report", {}).get("strengths_analysis", {}).get("technical_skills", []))
                },
                overall_recommendation=analysis_result.get("short_conclusion", "")
            )
            
            # Save comprehensive analysis to database
            comprehensive_analysis_doc = AnalysisDocument(
                analysis_id=analysis_id,
                resume_filename=resume_file.filename or "unknown",
                job_description_filename=job_desc_filename,
                resume_text=resume_text,
                job_description_text=job_description_text_final,
                result=legacy_analysis_result,  # Store in legacy format for compatibility
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            await save_analysis(comprehensive_analysis_doc)
            logger.info(f"Comprehensive analysis {analysis_id} saved to database")
            
            # Add analysis_id to response for tracking
            response_dict = response.dict()
            response_dict["analysis_id"] = analysis_id
            response_dict["timestamp"] = datetime.utcnow().isoformat()
            
            return JSONResponse(content=response_dict, status_code=200)
        
        except Exception as e:
            # This should rarely happen now due to comprehensive validation
            logger.error(f"Unexpected error creating response model: {str(e)}")
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(
                    error="response_model_creation_failed",
                    message="Failed to create response model despite validation",
                    details=str(e)
                ).dict()
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_resume_comprehensive: {str(e)}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="internal_server_error",
                message="An unexpected error occurred",
                details=str(e)
            ).dict()
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