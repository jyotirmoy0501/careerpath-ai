import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "careerpath_db")

# Create Motor Async Client
client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=3000)
db = client[MONGODB_DB_NAME]
analyses_collection = db["analysis_records"]


async def ping_mongodb() -> bool:
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False
