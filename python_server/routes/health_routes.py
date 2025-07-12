from datetime import datetime

from fastapi import APIRouter

from app.database import check_mongo_health
from app.groq_service import GroqService

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Return health status of the server and its dependencies."""
    mongo_status = await check_mongo_health()

    # Check Groq service health
    groq_service = GroqService()
    groq_status = await groq_service.check_health()

    overall_status = (
        "ok" if mongo_status.get("status") == "connected" and groq_status.get("status") == "healthy" else "degraded"
    )

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow(),
        "services": {
            "mongo": mongo_status,
            "groq": groq_status,
        },
    } 