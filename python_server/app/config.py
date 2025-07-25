from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any, Union
import os
import json
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
    allowed_extensions: str = "pdf,docx,txt"  # Deprecated, use allowed_resume_extensions and allowed_jobdesc_extensions
    allowed_resume_extensions: str = "pdf,docx"  # Only for resume
    allowed_jobdesc_extensions: str = "pdf,docx,txt"  # Only for job description
    
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
    
    # JWT Configuration
    jwt_secret: str = os.getenv("JWT_SECRET", "your_jwt_secret")
    jwt_expires_in: str = os.getenv("JWT_EXPIRES_IN", "30d")
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert allowed_extensions string to list after initialization
        self._allowed_extensions_list = self._parse_allowed_extensions()

    def _parse_allowed_extensions(self) -> List[str]:
        """Parse allowed_extensions string into a list"""
        if not self.allowed_extensions:
            return ["pdf", "docx", "txt"]
        
        # Handle both JSON arrays and comma-separated strings
        if self.allowed_extensions.startswith('[') and self.allowed_extensions.endswith(']'):
            try:
                parsed = json.loads(self.allowed_extensions)
                if isinstance(parsed, list):
                    return [ext.strip() for ext in parsed if ext.strip()]
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Treat as comma-separated string
        return [ext.strip() for ext in self.allowed_extensions.split(",") if ext.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        """Get allowed_extensions as a list"""
        return self._allowed_extensions_list

    @field_validator("allowed_extensions", mode="before")
    @classmethod
    def _validate_allowed_extensions(cls, v):
        # Handle None or empty values
        if v is None or (isinstance(v, str) and not v.strip()):
            return "pdf,docx,txt"
        
        # If it's already a string, return as is
        if isinstance(v, str):
            return v.strip()
        
        # If it's a list, convert to comma-separated string
        if isinstance(v, list):
            return ",".join([str(ext).strip() for ext in v if ext.strip()])
        
        # Fallback to default
        return "pdf,docx,txt"

    def _parse_extensions(self, ext_string: str, default: list) -> list:
        if not ext_string:
            return default
        if ext_string.startswith('[') and ext_string.endswith(']'):
            try:
                parsed = json.loads(ext_string)
                if isinstance(parsed, list):
                    return [ext.strip() for ext in parsed if ext.strip()]
            except (json.JSONDecodeError, TypeError):
                pass
        return [ext.strip() for ext in ext_string.split(",") if ext.strip()]

    @property
    def allowed_resume_extensions_list(self) -> list:
        return self._parse_extensions(self.allowed_resume_extensions, ["pdf", "docx"])

    @property
    def allowed_jobdesc_extensions_list(self) -> list:
        return self._parse_extensions(self.allowed_jobdesc_extensions, ["pdf", "docx", "txt"])

settings = Settings()