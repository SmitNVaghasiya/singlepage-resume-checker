import os
import tempfile
from typing import Tuple
from fastapi import UploadFile, HTTPException
from loguru import logger
import PyPDF2
from docx import Document
import aiofiles
from .config import settings


async def validate_file(file: UploadFile) -> None:
    """Validate uploaded file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check file extension
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_ext}' not allowed. Allowed types: {', '.join(settings.allowed_extensions)}"
        )
    
    # Check file size
    if hasattr(file, 'size') and file.size > settings.max_file_size:
        raise HTTPException(
            status_code=400, 
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size} bytes"
        )


async def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from PDF")


async def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from DOCX")


async def extract_text_from_doc(file_path: str) -> str:
    """Extract text from DOC file (basic support)"""
    try:
        # For DOC files, we'll try to read as text (limited support)
        with open(file_path, 'rb') as file:
            content = file.read()
            # Basic text extraction (this is very limited for DOC files)
            text = content.decode('utf-8', errors='ignore')
            # Clean up the text
            text = ''.join(char for char in text if char.isprintable() or char.isspace())
            return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from DOC: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to extract text from DOC file. Please convert to DOCX or PDF format."
        )


async def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT file"""
    try:
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
            text = await file.read()
        return text.strip()
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            async with aiofiles.open(file_path, 'r', encoding='latin-1') as file:
                text = await file.read()
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from TXT: {e}")
            raise HTTPException(status_code=500, detail="Failed to extract text from TXT file")
    except Exception as e:
        logger.error(f"Error extracting text from TXT: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract text from TXT file")


async def save_temp_file(file: UploadFile) -> str:
    """Save uploaded file to temporary location"""
    try:
        # Create temporary file
        suffix = f".{file.filename.split('.')[-1].lower()}"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_path = temp_file.name
        temp_file.close()
        
        # Write file content
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return temp_path
    except Exception as e:
        logger.error(f"Error saving temporary file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")


async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from uploaded file based on its type"""
    await validate_file(file)
    
    # Save file temporarily
    temp_path = await save_temp_file(file)
    
    try:
        # Get file extension
        file_ext = file.filename.split('.')[-1].lower()
        
        # Extract text based on file type
        if file_ext == 'pdf':
            text = await extract_text_from_pdf(temp_path)
        elif file_ext == 'docx':
            text = await extract_text_from_docx(temp_path)
        elif file_ext == 'doc':
            text = await extract_text_from_doc(temp_path)
        elif file_ext == 'txt':
            text = await extract_text_from_txt(temp_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}")
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="No text content found in the file")
        
        return text
    
    finally:
        # Clean up temporary file
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except Exception as e:
            logger.warning(f"Failed to delete temporary file {temp_path}: {e}")


async def process_files(resume_file: UploadFile, job_description_file: UploadFile) -> Tuple[str, str]:
    """Process both resume and job description files"""
    try:
        # Extract text from both files concurrently
        resume_text = await extract_text_from_file(resume_file)
        job_description_text = await extract_text_from_file(job_description_file)
        
        logger.info(f"Successfully processed files: {resume_file.filename}, {job_description_file.filename}")
        
        return resume_text, job_description_text
    
    except Exception as e:
        logger.error(f"Error processing files: {e}")
        raise 