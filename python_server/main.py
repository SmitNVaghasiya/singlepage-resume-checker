import os
import sys
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.middleware import rate_limit_middleware

# Configure logging to reduce verbosity
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Suppress verbose PyMongo debug logs
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("motor").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app"""
    # Startup
    try:
        await connect_to_mongo()
        logger.info("✅ MongoDB connected successfully")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        # Continue without database for now
    
    yield
    
    # Shutdown
    try:
        await close_mongo_connection()
        logger.info("✅ MongoDB connection closed")
    except Exception as e:
        logger.error(f"❌ Error closing MongoDB connection: {e}")


# Initialize FastAPI app
app = FastAPI(
    title="AI Resume Analyzer",
    description="Advanced AI-powered resume analysis using Groq's LLaMA model",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = settings.cors_origins.split(",") if settings.cors_origins else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware)

# Include routes
from routes.analysis_routes import router as analysis_router
from routes.health_routes import router as health_router

app.include_router(analysis_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Resume Analyzer API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    from app.models import ErrorResponse
    from fastapi.responses import JSONResponse
    
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            error="not_found",
            message="Endpoint not found"
        ).dict()
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    from app.models import ErrorResponse
    from fastapi.responses import JSONResponse
    
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="internal_server_error",
            message="An internal server error occurred"
        ).dict()
    )


def check_virtual_environment():
    """Check if we're in a virtual environment"""
    return hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import groq
        import uvicorn
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("💡 Please install dependencies with: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    
    if not env_file.exists():
        print("❌ .env file not found")
        print("💡 Please create a .env file with your Groq API key:")
        print("   GROQ_API_KEY=your_groq_api_key_here")
        print("   GROQ_MODEL=llama3-70b-8192")
        return False
    
    # Check for required variables
    with open(env_file, 'r') as f:
        content = f.read()
        
    if "GROQ_API_KEY" not in content:
        print("❌ GROQ_API_KEY not found in .env file")
        return False
    
    if "your_groq_api_key_here" in content:
        print("❌ Please update .env file with your actual Groq API key")
        return False
    
    return True


if __name__ == "__main__":
    print("🚀 Starting AI Resume Analyzer API...")
    print("=" * 50)
    
    # Check virtual environment
    if not check_virtual_environment():
        print("⚠️  Warning: Not running in a virtual environment")
        print("💡 Consider activating your virtual environment:")
        print("   Windows: venv\\Scripts\\activate")
        print("   Linux/Mac: source venv/bin/activate")
        print()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check environment file
    if not check_env_file():
        sys.exit(1)
    
    # Final check for API key in environment
    if not os.getenv("GROQ_API_KEY"):
        logger.error("❌ GROQ_API_KEY environment variable is required")
        sys.exit(1)
    
    print("✅ All checks passed!")
    print("🌐 Starting FastAPI server...")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/api/v1/health")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "main:app",
            host=settings.host,
            port=settings.port,
            reload=True,
            log_level="warning"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1) 