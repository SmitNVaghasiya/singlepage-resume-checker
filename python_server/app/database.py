import motor.motor_asyncio
from typing import Optional
import logging
from .config import settings
from .models import AnalysisDocument

logger = logging.getLogger(__name__)

class Database:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    database: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None

db = Database()

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB database: {settings.mongodb_database}")
        db.client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url)
        db.database = db.client[settings.mongodb_database]
        await db.client.admin.command('ping')
        logger.info(f"✅ Connected to MongoDB: {settings.mongodb_database}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("✅ MongoDB connection closed")

async def get_collection():
    return db.database[settings.mongodb_collection]

async def save_analysis(analysis_doc: AnalysisDocument) -> str:
    try:
        collection = await get_collection()
        doc_dict = analysis_doc.dict(by_alias=True, exclude_unset=True)
        doc_dict.pop('_id', None)
        # Ensure both 'analysisId' and 'analysisId' are set for MongoDB compatibility
        if 'analysisId' in doc_dict:
            doc_dict['analysisId'] = doc_dict['analysisId']
        elif 'analysisId' in doc_dict:
            doc_dict['analysisId'] = doc_dict['analysisId']
        else:
            raise ValueError("AnalysisDocument must have 'analysisId' or 'analysisId' set.")
        result = await collection.insert_one(doc_dict)
        logger.info(f"✅ Analysis saved with ID: {result.inserted_id}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"❌ Failed to save analysis: {e}")
        raise

async def get_analysis_by_id(analysisId: str) -> Optional[AnalysisDocument]:
    try:
        collection = await get_collection()
        doc = await collection.find_one({"analysisId": analysisId})
        if doc:
            doc['_id'] = str(doc['_id'])
            return AnalysisDocument(**doc)
        return None
    except Exception as e:
        logger.error(f"❌ Failed to get analysis: {e}")
        raise

async def update_analysis(analysisId: str, update_data: dict) -> bool:
    try:
        collection = await get_collection()
        result = await collection.update_one({"analysisId": analysisId}, {"$set": update_data})
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"❌ Failed to update analysis: {e}")
        raise

async def delete_analysis(analysisId: str) -> bool:
    try:
        collection = await get_collection()
        result = await collection.delete_one({"analysisId": analysisId})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"❌ Failed to delete analysis: {e}")
        raise

async def check_mongo_health() -> dict:
    try:
        if not db.client:
            return {"status": "disconnected", "error": "No client connection"}
        await db.client.admin.command('ping')
        server_info = await db.client.server_info()
        return {
            "status": "connected",
            "version": server_info.get("version", "unknown"),
            "database": settings.mongodb_database
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
    
async def get_analyses_by_user_id(userId: str) -> list:
    """Get all analyses for a specific userId"""
    try:
        collection = await get_collection()
        cursor = collection.find({"userId": userId})
        analyses = []
        async for doc in cursor:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            analyses.append(AnalysisDocument(**doc))
        return analyses
    except Exception as e:
        logger.error(f"❌ Failed to get analyses for userId {userId}: {e}")
        raise 