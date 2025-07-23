from datetime import datetime
import psutil
import os

from fastapi import APIRouter
from loguru import logger

from app.database import check_mongo_health
from app.groq_service import GroqService
from app.middleware import rate_limiter
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Return comprehensive health status of the server and its dependencies."""
    
    # Get system information
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
    except Exception as e:
        logger.warning(f"Could not get system info: {e}")
        cpu_percent = "unknown"
        memory = None
        disk = None
    
    # Check MongoDB health
    mongo_status = await check_mongo_health()

    # Check Groq service health
    try:
        groq_service = GroqService()
        groq_status = await groq_service.check_health()
    except Exception as e:
        groq_status = {
            "status": "unhealthy",
            "error": str(e),
            "api_key_configured": False
        }

    # Get rate limiting statistics
    rate_limit_stats = {
        "max_requests_per_day": rate_limiter.max_requests_per_day,
        "active_ips": len(rate_limiter.requests),
        "total_requests_today": sum(len(requests) for requests in rate_limiter.requests.values())
    }

    # Determine overall status
    mongo_healthy = mongo_status.get("status") == "connected"
    groq_healthy = groq_status.get("status") == "healthy"
    
    if mongo_healthy and groq_healthy:
        overall_status = "healthy"
    elif mongo_healthy or groq_healthy:
        overall_status = "degraded"
    else:
        overall_status = "unhealthy"

    # Build response
    response = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "mongo": mongo_status,
            "groq": groq_status,
        },
        "rate_limiting": rate_limit_stats,
        "validation_limits": {
            "max_file_size_mb": settings.max_file_size / (1024 * 1024),
            "max_resume_tokens": settings.max_resume_tokens,
            "max_job_description_words": settings.max_job_description_words,
            "min_job_description_words": settings.min_job_description_words,
            "max_pdf_pages": settings.max_pdf_pages,
            "max_docx_pages": settings.max_docx_pages,
            "allowed_file_types": settings.allowed_extensions_list
        }
    }
    
    # Add system information if available
    if memory and disk:
        response["system"] = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2)
        }
    
    # Add environment information
    response["environment"] = {
        "debug_mode": settings.debug,
        "log_level": settings.log_level,
        "groq_model": settings.groq_model,
        "mongodb_database": settings.mongodb_database
    }
    
    return response


@router.get("/health/simple")
async def simple_health_check():
    """Simple health check for load balancers and monitoring."""
    try:
        # Quick checks
        mongo_status = await check_mongo_health()
        groq_service = GroqService()
        groq_status = await groq_service.check_health()
        
        mongo_healthy = mongo_status.get("status") == "connected"
        groq_healthy = groq_status.get("status") == "healthy"
        
        if mongo_healthy and groq_healthy:
            return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
        else:
            return {"status": "degraded", "timestamp": datetime.utcnow().isoformat()}
            
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "timestamp": datetime.utcnow().isoformat()} 