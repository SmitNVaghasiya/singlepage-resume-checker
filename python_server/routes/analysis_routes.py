import time
from uuid import uuid4
from typing import Optional, Union
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from loguru import logger

from app.file_processor import extract_text_from_file, FileProcessor
from app.groq_service import GroqService
from app.models import ResumeAnalysisResponse, ErrorResponse, AnalysisDocument, AnalysisStatus
from app.database import save_analysis, get_analysis_by_id, update_analysis
from app.config import settings

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=Union[ResumeAnalysisResponse, ErrorResponse])
async def analyze_resume(
    resume: UploadFile = File(..., description="Resume file (PDF/DOCX/TXT)"),
    job_description: Optional[UploadFile] = File(None, description="Job description file"),
    job_description_text: Optional[str] = Form(None, description="Job description raw text"),
    user_id: Optional[str] = Form(None, description="User ID if authenticated"),
):
    """
    Analyze resume against job description (file or raw text).
    
    This endpoint provides comprehensive resume analysis using AI, including:
    - Job description validation
    - Resume eligibility assessment
    - Detailed strengths and weaknesses analysis
    - Section-wise feedback
    - Improvement recommendations
    - Final assessment with hiring recommendations
    
    **Limits:**
    - File size: Maximum 5MB
    - PDF/DOCX pages: Maximum 7 pages
    - Job description: 50-1000 words
    - Resume tokens: Maximum 8000 words
    - Daily requests: 15 per IP address
    """
    start_time = time.time()
    
    try:
        # Validate inputs
        if not job_description and not job_description_text:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="missing_job_description",
                    message="Either job_description_file or job_description_text must be provided"
                ).dict()
            )
        
        if job_description and job_description_text:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="multiple_job_descriptions",
                    message="Please provide either job_description_file OR job_description_text, not both"
                ).dict()
            )
        
        # Process resume file
        logger.info(f"Processing resume file: {resume.filename}")
        resume_content = await resume.read()
        
        if not resume_content:
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="empty_resume_file",
                    message="Resume file is empty"
                ).dict()
            )
        
        # Extract text from resume with validation
        resume_text, resume_success, resume_file_type = FileProcessor.process_file(
            resume_content, resume.filename or "resume"
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
        job_description_filename = None
        
        if job_description:
            logger.info(f"Processing job description file: {job_description.filename}")
            job_desc_content = await job_description.read()
            
            if not job_desc_content:
                return JSONResponse(
                    status_code=400,
                    content=ErrorResponse(
                        error="empty_job_description_file",
                        message="Job description file is empty"
                    ).dict()
                )
            
            job_desc_text, job_desc_success, job_desc_file_type = FileProcessor.process_file(
                job_desc_content, job_description.filename or "job_description"
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
            job_description_filename = job_description.filename
        else:
            job_description_text_final = job_description_text.strip()
        
        # Validate job description content with specific validation
        job_desc_valid, job_desc_validation_msg = FileProcessor.validate_job_description_content(
            job_description_text_final
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
        groq_service = GroqService()
        analysis_result = groq_service.analyze_resume(resume_text, job_description_text_final)
        
        # Check for AI-based security validation first
        if analysis_result.get("security_validation") == "Failed":
            security_error = analysis_result.get("security_error", "Security threat detected")
            logger.warning(f"AI detected security threat: {security_error}")
            return JSONResponse(
                status_code=403,  # Forbidden for security issues
                content=ErrorResponse(
                    error="security_validation_failed",
                    message="Content blocked for security reasons",
                    details=security_error
                ).dict()
            )
        
        # Check if job description validation failed (but no security threats)
        if analysis_result.get("job_description_validity") == "Invalid":
            validation_error = analysis_result.get("validation_error", "Invalid job description format")
            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="invalid_job_description",
                    message="Job description validation failed",
                    details=validation_error
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
            user_id=user_id,
            resume_filename=resume.filename or "resume",
            job_description_filename=job_description_filename,
            job_description_text=job_description_text if not job_description else None,
            analysis_result=ResumeAnalysisResponse(**analysis_result),
            status="completed",
            processing_time=processing_time,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Save to database
        try:
            await save_analysis(analysis_doc)
            logger.info(f"Analysis saved to database with ID: {analysis_id}")
        except Exception as e:
            logger.error(f"Failed to save analysis to database: {e}")
            # Continue without database save for now
        
        # Final Pydantic model creation
        try:
            response = ResumeAnalysisResponse(**analysis_result)
            logger.info(f"✅ Resume analysis completed successfully (analysis_id: {analysis_id})")
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


@router.get("/status/{analysis_id}", response_model=AnalysisStatus)
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
            "analysis_id": analysis_id,
            "status": analysis_doc.status,
            "message": f"Analysis is {analysis_doc.status}",
            "progress": 100 if analysis_doc.status == "completed" else 0,
            "result": analysis_doc.analysis_result if analysis_doc.status == "completed" else None
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


@router.get("/result/{analysis_id}", response_model=Union[ResumeAnalysisResponse, ErrorResponse])
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
        return analysis_doc.analysis_result
        
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