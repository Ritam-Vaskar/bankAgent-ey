from datetime import datetime
import logging
from typing import Dict, List, Optional, Any
from bson import ObjectId

from db.database.connection import db_manager
logger = logging.getLogger(__name__)

class AccountModel:
    def __init__(self):
        self.collection_name = "accounts"
    def _collection(self):
        return db_manager.get_collection(self.collection_name)
    def _serialize(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc
    async def create_account(self, data: Dict[str, Any]) -> Dict[str, Any]:
        col = self._collection()
        # uniqueness checks
        if await col.find_one({"account_number": data["account_number"]}):
            raise ValueError("Account number already exists")
        if await col.find_one({"pan_card_no": data["pan_card_no"]}):
            raise ValueError("PAN already used")
        if await col.find_one({"aadhar_no": data["aadhar_no"]}):
            raise ValueError("Aadhar already used")
        res = await col.insert_one(data)
        created = await col.find_one({"_id": res.inserted_id})
        return self._serialize(created)
    async def get_account_by_number(self, account_number: str) -> Optional[Dict[str, Any]]:
        doc = await self._collection().find_one({"account_number": account_number})
        return self._serialize(doc) if doc else None
    async def get_account_by_id(self, account_id: str) -> Optional[Dict[str, Any]]:
        doc = await self._collection().find_one({"_id": ObjectId(account_id)})
        return self._serialize(doc) if doc else None
    async def get_all_accounts(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        cursor = self._collection().find({"status": {"$ne": "deleted"}}).skip(skip).limit(limit)
        items = []
        async for doc in cursor:
            items.append(self._serialize(doc))
        return items
