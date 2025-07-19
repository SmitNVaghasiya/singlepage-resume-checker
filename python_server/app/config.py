from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any
import os
from datetime import datetime  # maybe not used but fine
from pydantic import field_validator


class Settings(BaseSettings):
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))
    debug: bool = False
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "resume_analyzer"
    mongodb_collection: str = "analyses"
    
    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Use environment variables
    @field_validator("mongodb_url", mode="before")
    @classmethod
    def _validate_mongodb_url(cls, v):
        mongodb_url = os.getenv("MONGODB_URL")
        if mongodb_url:
            return mongodb_url
        return v
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def _validate_cors_origins(cls, v):
        cors_origins = os.getenv("CORS_ORIGINS")
        if cors_origins:
            return cors_origins
        return v
    
    # Groq AI Configuration
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"
    
    # File Processing
    max_file_size: int = 5242880  # 5MB (reduced from 10MB)
    allowed_extensions: Any = ["pdf", "doc", "docx", "txt"]
    
    # Input Validation Limits
    max_resume_tokens: int = 8000  # Maximum tokens for resume text
    max_job_description_tokens: int = 2000  # Maximum tokens for job description
    max_job_description_words: int = 1000  # Maximum words for job description
    min_job_description_words: int = 50  # Minimum words for job description
    max_pdf_pages: int = 7  # Maximum pages for PDF files
    max_docx_pages: int = 7  # Maximum pages for DOCX files
    
    # Rate Limiting
    max_requests_per_day: int = 15  # Daily request limit per IP
    
    # Logging
    log_level: str = "INFO"
    
    # Pydantic v2 configuration
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure allowed_extensions is always a list and handle environment variable parsing
        if hasattr(self, 'allowed_extensions'):
            if isinstance(self.allowed_extensions, str):
                self.allowed_extensions = [ext.strip() for ext in self.allowed_extensions.split(",")]
            elif not isinstance(self.allowed_extensions, list):
                self.allowed_extensions = ["pdf", "doc", "docx", "txt"]
        else:
            self.allowed_extensions = ["pdf", "doc", "docx", "txt"]

    # Allow allowed_extensions to be provided as a comma-separated string in the .env file
    @field_validator("allowed_extensions", mode="before")
    @classmethod
    def _validate_allowed_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",") if ext.strip()]
        return v


# Global settings instance
settings = Settings() 