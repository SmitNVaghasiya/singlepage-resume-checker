import time
from uuid import uuid4
from typing import Optional, Union, List
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging

from app.file_processor import extract_text_from_file, FileProcessor
from app.groq_service import GroqService
from app.models import ResumeAnalysisResponse, ErrorResponse, AnalysisDocument, AnalysisStatus
from app.database import save_analysis, get_analysis_by_id, update_analysis, get_analyses_by_user_id
from app.middleware import get_current_user_id
from app.config import settings

router = APIRouter(tags=["analysis"])
logger = logging.getLogger(__name__)

async def perform_analysis(
    analysis_id: str,
    resume_text: str,
    job_description_text: str,
    user_id: str,
    resume_filename: str,
    job_description_filename: Optional[str]
):
    start_time = time.time()
    groq_service = GroqService()
    analysis_result = groq_service.analyze_resume(resume_text, job_description_text)
    
    if analysis_result.get("security_validation") == "Failed":
        security_error = analysis_result.get("security_error", "Security threat detected")
        logger.warning(f"AI detected security threat: {security_error}")
        await update_analysis(analysis_id, {"status": "failed", "error": security_error})
        return
    
    if analysis_result.get("job_description_validity") == "Invalid":
        validation_error = analysis_result.get("validation_error", "Invalid job description")
        logger.warning(f"Job description invalid: {validation_error}")
        await update_analysis(analysis_id, {"status": "failed", "error": validation_error})
        return
    
    processing_time = time.time() - start_time
    analysis_doc = AnalysisDocument(
        analysis_id=analysis_id,
        user_id=user_id,
        resume_filename=resume_filename,
        job_description_filename=job_description_filename,
        job_description_text=job_description_text if not job_description_filename else None,
        analysis_result=ResumeAnalysisResponse(**analysis_result),
        status="completed",
        processing_time=processing_time,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await save_analysis(analysis_doc)

@router.post("/analyze", response_model=Union[AnalysisStatus, ErrorResponse])
async def analyze_resume(
    resume: UploadFile = File(..., description="Resume file (PDF/DOCX/TXT)"),
    job_description: Optional[UploadFile] = File(None, description="Job description file"),
    job_description_text: Optional[str] = Form(None, description="Job description raw text"),
    user_id: str = Depends(get_current_user_id),
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
    if not job_description and not job_description_text:
        raise HTTPException(status_code=400, detail="Either job_description file or text must be provided")
    if job_description and job_description_text:
        raise HTTPException(status_code=400, detail="Provide either job_description file OR text, not both")
    
    resume_text = await extract_text_from_file(resume)
    resume_valid, resume_msg = FileProcessor.validate_content(resume_text, "resume")
    if not resume_valid:
        raise HTTPException(status_code=400, detail=resume_msg)
    
    job_description_text_final = ""
    job_description_filename = None
    if job_description:
        job_desc_text = await extract_text_from_file(job_description)
        job_desc_valid, job_desc_msg = FileProcessor.validate_job_description_content(job_desc_text)
        if not job_desc_valid:
            raise HTTPException(status_code=400, detail=job_desc_msg)
        job_description_text_final = job_desc_text
        job_description_filename = job_description.filename
    else:
        job_description_text_final = job_description_text.strip()
        job_desc_valid, job_desc_msg = FileProcessor.validate_job_description_content(job_description_text_final)
        if not job_desc_valid:
            raise HTTPException(status_code=400, detail=job_desc_msg)
    
    analysis_id = str(uuid4())
    analysis_doc = AnalysisDocument(
        analysis_id=analysis_id,
        user_id=user_id,
        resume_filename=resume.filename,
        job_description_filename=job_description_filename,
        job_description_text=job_description_text if not job_description_filename else None,
        analysis_result=None,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    await save_analysis(analysis_doc)
    
    perform_analysis(
        analysis_id,
        resume_text,
        job_description_text_final,
        user_id,
        resume.filename,
        job_description_filename
    )
    
    return AnalysisStatus(
        analysis_id=analysis_id,
        status="pending",
        message="Analysis is being processed",
        progress=0
    )

# @router.get("/status/{analysis_id}", response_model=AnalysisStatus)
# async def get_analysis_status(analysis_id: str, user_id: str = Depends(get_current_user_id)):
#     """Get analysis status by analysis ID, only if owned by current user"""
#     analysis_doc = await get_analysis_by_id(analysis_id)
#     if not analysis_doc:
#         raise HTTPException(status_code=404, detail=f"Analysis with ID {analysis_id} not found")
#     if analysis_doc.user_id != user_id:
#         raise HTTPException(status_code=403, detail="You do not have access to this analysis.")
#     return AnalysisStatus(
#         analysis_id=analysis_id,
#         status=analysis_doc.status,
#         message=f"Analysis is {analysis_doc.status}",
#         progress=100 if analysis_doc.status == "completed" else 0,
#         result=analysis_doc.analysis_result if analysis_doc.status == "completed" else None
#     )

# @router.get("/result/{analysis_id}", response_model=Union[ResumeAnalysisResponse, ErrorResponse])
# async def get_analysis_result(analysis_id: str, user_id: str = Depends(get_current_user_id)):
#     """Get complete analysis result by analysis ID, only if owned by current user"""
#     analysis_doc = await get_analysis_by_id(analysis_id)
#     if not analysis_doc:
#         raise HTTPException(status_code=404, detail=f"Analysis with ID {analysis_id} not found")
#     if analysis_doc.user_id != user_id:
#         raise HTTPException(status_code=403, detail="You do not have access to this analysis.")
#     if analysis_doc.status != "completed":
#         raise HTTPException(status_code=400, detail=f"Analysis with ID {analysis_id} is not completed (status: {analysis_doc.status})")
#     return analysis_doc.analysis_result

# @router.get("/my-analyses", response_model=List[AnalysisDocument])
# async def get_my_analyses(user_id: str = Depends(get_current_user_id)):
#     """Get all analyses for the authenticated user"""
#     try:
#         analyses = await get_analyses_by_user_id(user_id)
#         return analyses
#     except Exception as e:
#         logger.error(f"Error fetching analyses for user {user_id}: {str(e)}")
#         raise HTTPException(status_code=500, detail="Failed to fetch analyses")
