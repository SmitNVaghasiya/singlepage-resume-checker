"""
FastAPI Resume Analyzer Service
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, List, Any
import uvicorn
import re
import io
import PyPDF2
from docx import Document

# Initialize FastAPI app
app = FastAPI(
    title="Resume Analyzer API",
    description="FastAPI service for analyzing resumes against job descriptions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

# Technical keywords for analysis
TECHNICAL_KEYWORDS = [
    'python', 'javascript', 'java', 'react', 'node.js', 'angular', 'vue.js',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'git', 'linux', 'typescript',
    'express', 'fastapi', 'django', 'flask', 'spring', 'machine learning',
    'data science', 'artificial intelligence'
]

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc_file = io.BytesIO(file_content)
        doc = Document(doc_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing DOCX: {str(e)}")

def process_file(file_content: bytes, filename: str) -> str:
    """Process uploaded file and extract text"""
    file_extension = filename.lower().split('.')[-1]
    
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if file_extension == 'pdf':
        return extract_text_from_pdf(file_content)
    elif file_extension in ['doc', 'docx']:
        return extract_text_from_docx(file_content)
    elif file_extension == 'txt':
        return file_content.decode('utf-8').strip()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

def analyze_resume(resume_text: str, job_description: str = "") -> Dict[str, Any]:
    """Analyze resume text and return analysis results"""
    resume_lower = resume_text.lower()
    
    # Find technical keywords
    matched_keywords = []
    for keyword in TECHNICAL_KEYWORDS:
        if keyword in resume_lower:
            matched_keywords.append(keyword.title())
    
    # Calculate score
    keyword_score = min(len(matched_keywords) * 4, 70)
    word_count = len(resume_text.split())
    length_score = 15 if 200 <= word_count <= 600 else 5
    experience_score = min(sum(1 for word in ['experience', 'worked', 'developed'] if word in resume_lower) * 5, 15)
    
    total_score = keyword_score + length_score + experience_score
    
    # Generate feedback
    strengths = []
    if len(matched_keywords) > 5:
        strengths.append("Strong technical skill set")
    if len(matched_keywords) > 0:
        strengths.append(f"Proficient in {', '.join(matched_keywords[:3])}")
    if word_count > 200:
        strengths.append("Comprehensive professional background")
    
    weaknesses = []
    if len(matched_keywords) < 3:
        weaknesses.append("Limited technical keywords mentioned")
    if word_count < 200:
        weaknesses.append("Could provide more detailed experience")
    
    suggestions = []
    if len(matched_keywords) < 5:
        suggestions.append("Include more relevant technical skills")
    suggestions.append("Tailor resume to specific job requirements")
    
    return {
        "score": min(int(total_score), 100),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "keyword_match": {
            "matched": matched_keywords,
            "total_found": len(matched_keywords)
        }
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "FastAPI Resume Analyzer Service", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "resume-analyzer-fastapi"}

@app.post("/analyze")
async def analyze_resume_endpoint(
    resume: UploadFile = File(...),
    job_description: Optional[str] = Form(None)
):
    """Analyze resume against job description"""
    try:
        # Validate file size
        file_content = await resume.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Process the resume file
        resume_text = process_file(file_content, resume.filename)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume")
        
        # Analyze the resume
        analysis_result = analyze_resume(resume_text, job_description or "")
        
        return {
            "success": True,
            "analysis": analysis_result,
            "metadata": {
                "filename": resume.filename,
                "file_size": len(file_content),
                "has_job_description": bool(job_description)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "fastapi_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 