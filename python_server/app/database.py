import motor.motor_asyncio
from typing import Optional
from loguru import logger
from urllib.parse import quote_plus
from .config import settings
from .models import AnalysisDocument
import sys

# Configure loguru to be less verbose
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    colorize=True
)

class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    database: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    try:
        # Handle MongoDB URL with proper encoding
        mongodb_url = settings.mongodb_url
        
        # For MongoDB Atlas, use the database name from settings
        database_name = settings.mongodb_database
        
        # Log connection attempt without exposing credentials
        logger.info(f"Connecting to MongoDB database: {database_name}")
        
        db.client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
        db.database = db.client[database_name]
        
        # Test the connection
        await db.client.admin.command('ping')
        logger.info(f"✅ Connected to MongoDB: {database_name}")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("✅ MongoDB connection closed")


async def get_collection():
    """Get the analyses collection"""
    return db.database[settings.mongodb_collection]


async def save_analysis(analysis_doc: AnalysisDocument) -> str:
    """Save analysis result to MongoDB"""
    try:
        collection = await get_collection()
        doc_dict = analysis_doc.dict(by_alias=True, exclude_unset=True)
        
        # Remove the _id field if it exists to let MongoDB generate it
        doc_dict.pop('_id', None)
        
        result = await collection.insert_one(doc_dict)
        logger.info(f"✅ Analysis saved with ID: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"❌ Failed to save analysis: {e}")
        raise


async def get_analysis_by_id(analysis_id: str) -> Optional[AnalysisDocument]:
    """Get analysis result by analysis_id"""
    try:
        collection = await get_collection()
        doc = await collection.find_one({"analysis_id": analysis_id})
        
        if doc:
            # Convert ObjectId to string for the _id field
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            try:
                return AnalysisDocument(**doc)
            except Exception as model_error:
                logger.error(f"Failed to create AnalysisDocument from database result: {model_error}")
                logger.error(f"Document keys: {list(doc.keys())}")
                raise
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to get analysis: {e}")
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
        logger.error(f"❌ Failed to update analysis: {e}")
        raise


async def delete_analysis(analysis_id: str) -> bool:
    """Delete analysis document"""
    try:
        collection = await get_collection()
        result = await collection.delete_one({"analysis_id": analysis_id})
        
        return result.deleted_count > 0
        
    except Exception as e:
        logger.error(f"❌ Failed to delete analysis: {e}")
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