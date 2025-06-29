from pydantic import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "resume_analyzer"
    mongodb_collection: str = "analyses"
    
    # Groq AI Configuration
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"
    
    # File Processing
    max_file_size: int = 10485760  # 10MB
    allowed_extensions: List[str] = ["pdf", "doc", "docx", "txt"]
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings() 