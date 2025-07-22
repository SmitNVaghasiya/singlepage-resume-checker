from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any
import os
from pydantic import field_validator

class Settings(BaseSettings):
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))
    debug: bool = False
    
    # MongoDB Configuration
    mongodb_url: str
    mongodb_database: str
    mongodb_collection: str
    
    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Use environment variables
    @field_validator("mongodb_url", mode="before")
    @classmethod
    def _validate_mongodb_url(cls, v):
        return os.getenv("MONGODB_URL") or v

    @field_validator("mongodb_database", mode="before")
    @classmethod
    def _validate_mongodb_database(cls, v):
        return os.getenv("MONGODB_DATABASE") or v

    @field_validator("mongodb_collection", mode="before")
    @classmethod
    def _validate_mongodb_collection(cls, v):
        return os.getenv("MONGODB_COLLECTION") or v
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def _validate_cors_origins(cls, v):
        return os.getenv("CORS_ORIGINS") or v
    
    # Groq AI Configuration
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"
    
    # File Processing
    max_file_size: int = 5242880  # 5MB
    allowed_extensions: List[str] = ["pdf", "docx", "txt"]
    
    # Input Validation Limits
    max_resume_words: int = 8000  # Maximum words for resume text
    max_job_description_words: int = 1000  # Maximum words for job description
    min_job_description_words: int = 50  # Minimum words for job description
    max_pdf_pages: int = 7
    max_docx_pages: int = 7
    
    # Rate Limiting
    max_requests_per_day: int = 15
    
    # Logging
    log_level: str = "INFO"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if isinstance(self.allowed_extensions, str):
            self.allowed_extensions = [ext.strip() for ext in self.allowed_extensions.split(",")]

    @field_validator("allowed_extensions", mode="before")
    @classmethod
    def _validate_allowed_extensions(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return ["pdf", "docx", "txt"]
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",") if ext.strip()]
        return v

settings = Settings()