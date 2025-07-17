from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any
import os
from datetime import datetime  # maybe not used but fine
from pydantic import field_validator


class Settings(BaseSettings):
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "resume_analyzer"
    mongodb_collection: str = "analyses"
    
    # Use MONGO_URI from environment
    @field_validator("mongodb_url", mode="before")
    @classmethod
    def _validate_mongodb_url(cls, v):
        mongodb_url = os.getenv("MONGODB_URL")
        if mongodb_url:
            return mongodb_url
        return v
    
    # Groq AI Configuration
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"
    
    # File Processing
    max_file_size: int = 10485760  # 10MB
    allowed_extensions: Any = ["pdf", "doc", "docx", "txt"]
    
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