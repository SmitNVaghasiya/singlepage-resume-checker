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
    job_desc_lower = job_description.lower() if job_description else ""
    
    # Find technical keywords in resume
    matched_keywords = []
    for keyword in TECHNICAL_KEYWORDS:
        if keyword in resume_lower:
            matched_keywords.append(keyword.title())
    
    # Find job-specific keywords if job description is provided
    job_keywords = []
    missing_keywords = []
    if job_description:
        # Extract potential keywords from job description
        job_words = set(word.lower().strip('.,!?;:') for word in job_description.split() 
                       if len(word) > 3 and word.lower() not in ['with', 'have', 'been', 'will', 'must', 'should'])
        
        # Check which job keywords are in resume
        for word in job_words:
            if word in TECHNICAL_KEYWORDS:
                if word in resume_lower:
                    if word.title() not in matched_keywords:
                        matched_keywords.append(word.title())
                else:
                    missing_keywords.append(word.title())
    
    # Calculate comprehensive score
    keyword_score = min(len(matched_keywords) * 5, 60)
    word_count = len(resume_text.split())
    
    # Length and detail score
    if 300 <= word_count <= 800:
        length_score = 20
    elif 200 <= word_count < 300 or 800 < word_count <= 1000:
        length_score = 15
    else:
        length_score = 5
    
    # Experience indicators
    experience_words = ['experience', 'worked', 'developed', 'managed', 'led', 'created', 'implemented']
    experience_count = sum(1 for word in experience_words if word in resume_lower)
    experience_score = min(experience_count * 3, 15)
    
    # Job match bonus if job description provided
    job_match_score = 0
    if job_description and matched_keywords:
        job_match_score = min(len([k for k in matched_keywords if k.lower() in job_desc_lower]) * 2, 10)
    
    total_score = keyword_score + length_score + experience_score + job_match_score
    
    # Generate comprehensive feedback
    strengths = []
    if len(matched_keywords) > 8:
        strengths.append("Excellent technical skill coverage")
    elif len(matched_keywords) > 5:
        strengths.append("Strong technical skill set")
    elif len(matched_keywords) > 2:
        strengths.append("Good technical foundation")
    
    if len(matched_keywords) > 0:
        strengths.append(f"Proficient in {', '.join(matched_keywords[:4])}")
    
    if word_count >= 300:
        strengths.append("Comprehensive professional background")
    
    if experience_count > 3:
        strengths.append("Strong demonstration of hands-on experience")
    
    # Generate weaknesses
    weaknesses = []
    if len(matched_keywords) < 3:
        weaknesses.append("Limited technical keywords mentioned - consider adding more relevant skills")
    
    if word_count < 200:
        weaknesses.append("Resume could benefit from more detailed experience descriptions")
    
    if job_description and missing_keywords:
        weaknesses.append(f"Missing some job-relevant skills: {', '.join(missing_keywords[:3])}")
    
    if experience_count < 2:
        weaknesses.append("Could emphasize more action-oriented experience descriptions")
    
    # Generate suggestions
    suggestions = []
    if len(matched_keywords) < 5:
        suggestions.append("Include more relevant technical skills and certifications")
    
    if job_description:
        suggestions.append("Tailor resume content to better match the specific job requirements")
    else:
        suggestions.append("Consider customizing resume for specific job applications")
    
    suggestions.append("Use more action verbs to describe your accomplishments")
    
    if word_count < 300:
        suggestions.append("Expand on your project experiences and achievements")
    
    # Calculate keyword match percentage
    total_relevant_keywords = len(set(TECHNICAL_KEYWORDS) & set(job_desc_lower.split())) if job_description else len(TECHNICAL_KEYWORDS)
    keyword_percentage = (len(matched_keywords) / max(total_relevant_keywords, 1)) * 100 if total_relevant_keywords > 0 else 0
    
    # Overall recommendation
    if total_score >= 80:
        overall_rec = "Excellent resume with strong technical skills and comprehensive experience. Ready for senior-level positions."
    elif total_score >= 60:
        overall_rec = "Good resume with solid foundation. Consider adding more specific achievements and technical details."
    elif total_score >= 40:
        overall_rec = "Decent resume but needs improvement. Focus on adding more technical keywords and detailed experience."
    else:
        overall_rec = "Resume needs significant improvement. Add more technical skills, detailed experience, and tailor to job requirements."
    
    return {
        "score": min(int(total_score), 100),
        "strengths": strengths[:4],  # Limit to top 4 strengths
        "weaknesses": weaknesses[:3],  # Limit to top 3 weaknesses
        "suggestions": suggestions[:4],  # Limit to top 4 suggestions
        "keyword_match": {
            "matched": matched_keywords,
            "missing": missing_keywords[:5],  # Top 5 missing keywords
            "total_found": len(matched_keywords),
            "percentage": round(keyword_percentage, 1)
        },
        "overall_recommendation": overall_rec
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
    job_description: Optional[UploadFile] = File(None),
    job_description_text: Optional[str] = Form(None)
):
    """Analyze resume against job description"""
    try:
        # Validate file size
        resume_content = await resume.read()
        if len(resume_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Process the resume file
        resume_text = process_file(resume_content, resume.filename)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume")
        
        # Process job description
        job_desc_text = ""
        if job_description:
            job_desc_content = await job_description.read()
            job_desc_text = process_file(job_desc_content, job_description.filename)
        elif job_description_text:
            job_desc_text = job_description_text
        
        # Analyze the resume
        analysis_result = analyze_resume(resume_text, job_desc_text)
        
        return {
            "success": True,
            "analysis": analysis_result,
            "metadata": {
                "filename": resume.filename,
                "file_size": len(resume_content),
                "has_job_description": bool(job_desc_text)
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