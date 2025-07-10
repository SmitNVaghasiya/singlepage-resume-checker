import os
import io
import tempfile
from typing import Optional, Tuple
import logging
from docx import Document
import PyPDF2
import pdfplumber
import filetype
from fastapi import UploadFile, HTTPException
from loguru import logger
import aiofiles
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FileProcessor:
    
    @staticmethod
    def detect_file_type(file_content: bytes, filename: str) -> str:
        """Detect file type using both filename extension and magic bytes"""
        try:
            # Try to detect using filetype library (magic bytes)
            kind = filetype.guess(file_content)
            if kind is not None:
                return kind.extension.lower()
            
            # Fallback to filename extension
            if filename:
                extension = filename.lower().split('.')[-1]
                if extension in ['pdf', 'docx', 'txt']:
                    return extension
            
            return 'unknown'
        except Exception as e:
            logger.error(f"Error detecting file type: {str(e)}")
            return 'unknown'
    
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> Tuple[str, bool]:
        """Extract text from PDF using multiple methods with fallback"""
        text = ""
        success = False
        
        try:
            # Method 1: Try pdfplumber first (better for complex layouts)
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                if text.strip():
                    success = True
                    logger.info("PDF text extracted successfully using pdfplumber")
                    return text.strip(), success
        except Exception as e:
            logger.warning(f"pdfplumber failed: {str(e)}")
        
        try:
            # Method 2: Fallback to PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            if text.strip():
                success = True
                logger.info("PDF text extracted successfully using PyPDF2")
                return text.strip(), success
        except Exception as e:
            logger.error(f"PyPDF2 also failed: {str(e)}")
        
        # Method 3: Try to extract as plain text (if PDF is corrupted but readable)
        try:
            decoded_text = file_content.decode('utf-8', errors='ignore')
            if len(decoded_text.strip()) > 50:  # Minimum viable text
                success = True
                logger.info("PDF processed as plain text")
                return decoded_text.strip(), success
        except Exception as e:
            logger.error(f"Plain text extraction failed: {str(e)}")
        
        return "Error: Unable to extract text from PDF file", False
    
    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> Tuple[str, bool]:
        """Extract text from DOCX file with error handling"""
        try:
            doc = Document(io.BytesIO(file_content))
            text = ""
            
            # Extract text from paragraphs
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
            
            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text += cell.text + " "
                    text += "\n"
            
            if text.strip():
                logger.info("DOCX text extracted successfully")
                return text.strip(), True
            else:
                return "Error: DOCX file appears to be empty", False
                
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {str(e)}")
            # Try to extract as plain text if DOCX parsing fails
            try:
                decoded_text = file_content.decode('utf-8', errors='ignore')
                if len(decoded_text.strip()) > 50:
                    logger.info("DOCX processed as plain text")
                    return decoded_text.strip(), True
            except Exception as e2:
                logger.error(f"Plain text extraction from DOCX failed: {str(e2)}")
            
            return f"Error: Unable to extract text from DOCX file - {str(e)}", False
    
    @staticmethod
    def extract_text_from_txt(file_content: bytes) -> Tuple[str, bool]:
        """Extract text from TXT file with encoding detection"""
        encodings_to_try = ['utf-8', 'utf-16', 'latin-1', 'cp1252', 'ascii']
        
        for encoding in encodings_to_try:
            try:
                text = file_content.decode(encoding)
                if text.strip():
                    logger.info(f"TXT file decoded successfully using {encoding}")
                    return text.strip(), True
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logger.error(f"Error decoding TXT with {encoding}: {str(e)}")
                continue
        
        # Last resort: decode with errors='ignore'
        try:
            text = file_content.decode('utf-8', errors='ignore')
            if text.strip():
                logger.info("TXT file decoded with error handling")
                return text.strip(), True
        except Exception as e:
            logger.error(f"Final TXT decoding attempt failed: {str(e)}")
        
        return "Error: Unable to decode text file", False
    
    @staticmethod
    def process_file(file_content: bytes, filename: str) -> Tuple[str, bool, str]:
        """
        Process file and extract text based on file type
        Returns: (extracted_text, success, file_type)
        """
        if not file_content:
            return "Error: Empty file", False, "unknown"
        
        file_type = FileProcessor.detect_file_type(file_content, filename)
        logger.info(f"Processing file: {filename}, detected type: {file_type}")
        
        if file_type == 'pdf':
            text, success = FileProcessor.extract_text_from_pdf(file_content)
            return text, success, file_type
        
        elif file_type == 'docx':
            text, success = FileProcessor.extract_text_from_docx(file_content)
            return text, success, file_type
        
        elif file_type == 'txt' or file_type == 'unknown':
            # Try as text file if unknown or explicitly txt
            text, success = FileProcessor.extract_text_from_txt(file_content)
            return text, success, file_type if file_type != 'unknown' else 'txt'
        
        else:
            return f"Error: Unsupported file type '{file_type}'. Please upload PDF, DOCX, or TXT files.", False, file_type
    
    @staticmethod
    def validate_content(text: str, content_type: str = "document") -> Tuple[bool, str]:
        """Validate if extracted text is meaningful"""
        if not text or not text.strip():
            return False, f"Error: {content_type} appears to be empty"
        
        # Check minimum length
        if len(text.strip()) < 50:
            return False, f"Error: {content_type} is too short (minimum 50 characters required)"
        
        # Check if it's mostly special characters or gibberish
        alphanumeric_chars = sum(c.isalnum() for c in text)
        if alphanumeric_chars < len(text) * 0.3:  # At least 30% should be alphanumeric
            return False, f"Error: {content_type} contains too many non-readable characters"
        
        return True, "Valid content"


# Legacy functions for backward compatibility
async def process_files(resume_file_content: bytes, resume_filename: str, 
                       job_desc_file_content: bytes = None, job_desc_filename: str = None) -> tuple:
    """Legacy function for backward compatibility"""
    # Process resume
    resume_text, resume_success, resume_type = FileProcessor.process_file(resume_file_content, resume_filename)
    
    # Process job description if provided
    job_desc_text = ""
    if job_desc_file_content and job_desc_filename:
        job_desc_text, job_desc_success, job_desc_type = FileProcessor.process_file(job_desc_file_content, job_desc_filename)
        if not job_desc_success:
            job_desc_text = ""
    
    return resume_text, job_desc_text


async def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Legacy function for backward compatibility"""
    text, success, file_type = FileProcessor.process_file(file_content, filename)
    if not success:
        raise Exception(text)  # Return error as exception for legacy compatibility
    return text


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


# Async file processing functions for the new endpoint
async def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file path"""
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        text, success = FileProcessor.extract_text_from_pdf(content)
        if not success:
            raise Exception(text)
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


async def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file path"""
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        text, success = FileProcessor.extract_text_from_docx(content)
        if not success:
            raise Exception(text)
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from DOCX: {str(e)}")


async def extract_text_from_doc(file_path: str) -> str:
    """Extract text from DOC file path (legacy format)"""
    try:
        # For DOC files, we'll try to extract as text since python-docx doesn't support .doc
        with open(file_path, 'rb') as f:
            content = f.read()
        text, success = FileProcessor.extract_text_from_txt(content)
        if not success:
            raise Exception(text)
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from DOC: {str(e)}")


async def extract_text_from_txt(file_path: str) -> str:
    """Extract text from TXT file path"""
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        text, success = FileProcessor.extract_text_from_txt(content)
        if not success:
            raise Exception(text)
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from TXT: {str(e)}")


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