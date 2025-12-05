import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.database = None
        self.connection_string = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/banking-onboarding')
        self.database_name = os.getenv('DATABASE_NAME', 'banking-onboarding')
    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(self.connection_string)
            self.database = self.client[self.database_name]
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {self.database_name}")
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    async def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    def get_collection(self, name: str):
        # Motor database objects do not support truthiness; compare to None explicitly
        if self.database is None:
            raise RuntimeError("Database not connected")
        return self.database[name]

# Provide a shared singleton instance for use across modules
db_manager = DatabaseManager()

