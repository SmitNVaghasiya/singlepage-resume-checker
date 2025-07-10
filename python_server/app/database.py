import motor.motor_asyncio
from typing import Optional
from loguru import logger
from .config import settings
from .models import AnalysisDocument


class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    database: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url)
        db.database = db.client[settings.mongodb_database]
        
        # Test the connection
        await db.client.admin.command('ping')
        logger.info(f"Connected to MongoDB: {settings.mongodb_database}")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")


async def get_collection():
    """Get the analyses collection"""
    return db.database[settings.mongodb_collection]


async def save_analysis(analysis_doc: AnalysisDocument) -> str:
    """Save analysis result to MongoDB"""
    try:
        collection = await get_collection()
        doc_dict = analysis_doc.dict(by_alias=True, exclude_unset=True)
        
        result = await collection.insert_one(doc_dict)
        logger.info(f"Analysis saved with ID: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Failed to save analysis: {e}")
        raise


async def get_analysis_by_id(analysis_id: str) -> Optional[AnalysisDocument]:
    """Get analysis result by analysis_id"""
    try:
        collection = await get_collection()
        doc = await collection.find_one({"analysis_id": analysis_id})
        
        if doc:
            return AnalysisDocument(**doc)
        return None
        
    except Exception as e:
        logger.error(f"Failed to get analysis: {e}")
        raise


async def update_analysis(analysis_id: str, update_data: dict) -> bool:
    """Update analysis document"""
    try:
        collection = await get_collection()
        result = await collection.update_one(
            {"analysis_id": analysis_id},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        logger.error(f"Failed to update analysis: {e}")
        raise


async def delete_analysis(analysis_id: str) -> bool:
    """Delete analysis document"""
    try:
        collection = await get_collection()
        result = await collection.delete_one({"analysis_id": analysis_id})
        
        return result.deleted_count > 0
        
    except Exception as e:
        logger.error(f"Failed to delete analysis: {e}")
        raise


async def check_mongo_health() -> dict:
    """Check MongoDB connection health"""
    try:
        if not db.client:
            return {"status": "disconnected", "error": "No client connection"}
            
        # Ping the database
        await db.client.admin.command('ping')
        
        # Get server info
        server_info = await db.client.server_info()
        
        return {
            "status": "connected",
            "version": server_info.get("version", "unknown"),
            "database": settings.mongodb_database
        }
        
    except Exception as e:
        return {"status": "error", "error": str(e)} 