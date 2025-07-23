import time
from uuid import uuid4
from typing import Optional, Union, List
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging
import asyncio

from app.file_processor import extract_text_from_file, FileProcessor
from app.groq_service import GroqService
from app.models import ResumeAnalysisResponse, ErrorResponse, AnalysisDocument, AnalysisStatus
from app.database import save_analysis, get_analysis_by_id, update_analysis, get_analyses_by_user_id
from app.middleware import get_current_user_id
from app.config import settings

router = APIRouter(tags=["analysis"])
logger = logging.getLogger(__name__)

async def perform_analysis(
    analysisId: str,
    resume_text: str,
    # jobDescriptionFilename: str,
    userId: str,
    resumeFilename: str,
    jobDescriptionFilename: Optional[str]
):
    start_time = time.time()
    groq_service = GroqService()
    result = groq_service.analyze_resume(resume_text, jobDescriptionFilename)
    
    if result.get("security_validation") == "Failed":
        security_error = result.get("security_error", "Security threat detected")
        logger.warning(f"AI detected security threat: {security_error}")
        await update_analysis(analysisId, {"status": "failed", "error": security_error})
        return
    
    if result.get("job_description_validity") == "Invalid":
        validation_error = result.get("validation_error", "Invalid job description")
        logger.warning(f"Job description invalid: {validation_error}")
        await update_analysis(analysisId, {"status": "failed", "error": validation_error})
        return
    
    processingTime = time.time() - start_time
    analysis_doc = AnalysisDocument(
        analysisId=analysisId,
        userId=userId,
        resumeFilename=resumeFilename,
        jobDescriptionFilename=jobDescriptionFilename,
        result=ResumeAnalysisResponse(**result),
        status="completed",
        processingTime=processingTime,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    await save_analysis(analysis_doc)

@router.post("/analyze", response_model=Union[AnalysisStatus, ErrorResponse])
async def analyze_resume(
    resume: UploadFile = File(..., description="Resume file (PDF/DOCX/TXT)"),
    job_description: Optional[UploadFile] = File(None, description="Job description file"),
    jobDescriptionFilename: Optional[str] = Form(None, description="Job description filename"),
    jobDescriptionText: Optional[str] = Form(None, description="Job description raw text"),
    userId: str = Depends(get_current_user_id),
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
    if not job_description and not jobDescriptionText:
        raise HTTPException(status_code=400, detail="Either job_description file or text must be provided")
    if job_description and jobDescriptionText:
        raise HTTPException(status_code=400, detail="Provide either job_description file OR text, not both")
    
    resume_text = await extract_text_from_file(resume)
    resume_valid, resume_msg = FileProcessor.validate_content(resume_text, "resume")
    if not resume_valid:
        raise HTTPException(status_code=400, detail=resume_msg)
    
    job_description_text_final = ""
    jobDescriptionFilename = None
    
    if job_description:
        # Process job description file
        job_desc_text = await extract_text_from_file(job_description)
        job_desc_valid, job_desc_msg = FileProcessor.validate_job_description_content(job_desc_text)
        if not job_desc_valid:
            raise HTTPException(status_code=400, detail=job_desc_msg)
        job_description_text_final = job_desc_text
        jobDescriptionFilename = job_description.filename
    else:
        # Process job description text
        if not jobDescriptionText or not jobDescriptionText.strip():
            raise HTTPException(status_code=400, detail="Job description text cannot be empty")
        job_description_text_final = jobDescriptionText.strip()
        job_desc_valid, job_desc_msg = FileProcessor.validate_job_description_content(job_description_text_final)
        if not job_desc_valid:
            raise HTTPException(status_code=400, detail=job_desc_msg)
    
    analysisId = str(uuid4())
    groq_service = GroqService()
    result = await asyncio.to_thread(
        groq_service.analyze_resume, resume_text, job_description_text_final
    )
    if not result:
        raise HTTPException(status_code=500, detail="AI analysis failed, no result returned")
    
    # Save the analysis result
    analysis_doc = AnalysisDocument(
        analysisId=analysisId,
        userId=userId,
        resumeFilename=resume.filename,
        jobDescriptionFilename=jobDescriptionFilename,
        jobDescriptionText=jobDescriptionText if not job_description else None,
        result=ResumeAnalysisResponse(**result),
        status="completed",
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    await save_analysis(analysis_doc)
    return AnalysisStatus(
        analysisId=analysisId,
        status="completed",
        message="Analysis completed successfully",
        progress=100
    )
