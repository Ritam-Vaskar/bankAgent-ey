from datetime import datetime
import logging
from typing import Dict, List, Optional, Any
from bson import ObjectId

from database.connection import db_manager

logger = logging.getLogger(__name__)

class LoanModel:
    def __init__(self):
        self.collection_name = "loans"

    def _collection(self):
        return db_manager.get_collection(self.collection_name)

    def _serialize(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    async def create_loan(self, data: Dict[str, Any]) -> Dict[str, Any]:
        col = self._collection()
        
        # 1. Uniqueness Check: Loan ID
        if await col.find_one({"loan_id": data["loan_id"]}):
            raise ValueError("Loan ID already exists")

        # 2. "New to Bank" Validation Logic
        # If no account number is provided, we MUST have personal identifiers (PAN/Phone)
        if not data.get("account_number"):
            if not data.get("pan_card_no") or not data.get("phone_number"):
                raise ValueError("For non-account holders, PAN and Phone are mandatory.")
            
            # Optional: Check if this PAN has an ACTIVE pending application to prevent spam
            existing_pending = await col.find_one({
                "pan_card_no": data["pan_card_no"],
                "status": "PENDING"
            })
            if existing_pending:
                raise ValueError("An active loan application already exists for this PAN.")

        # 3. Add Metadata
        if "created_at" not in data:
            data["created_at"] = datetime.utcnow()
        
        # Mark as 'NTB' (New To Bank) if no account exists
        data["customer_type"] = "EXISTING" if data.get("account_number") else "NTB"

        res = await col.insert_one(data)
        created = await col.find_one({"_id": res.inserted_id})
        return self._serialize(created)

    async def get_loan_by_id(self, loan_id: str) -> Optional[Dict[str, Any]]:
        doc = await self._collection().find_one({"loan_id": loan_id})
        return self._serialize(doc) if doc else None

    async def get_loans_by_account(self, account_number: str) -> List[Dict[str, Any]]:
        """Fetch loans for existing customers via Account Number"""
        cursor = self._collection().find({"account_number": account_number})
        items = []
        async for doc in cursor:
            items.append(self._serialize(doc))
        return items

    async def get_loans_by_identifier(self, identifier: str) -> List[Dict[str, Any]]:
        """
        Fetch loans for Non-Customers using PAN or Phone.
        This allows a guest user to 'Check Application Status'.
        """
        # Search in both PAN and Phone fields
        query = {
            "$or": [
                {"pan_card_no": identifier},
                {"phone_number": identifier}
            ]
        }
        cursor = self._collection().find(query)
        items = []
        async for doc in cursor:
            items.append(self._serialize(doc))
        return items

    async def update_status(self, loan_id: str, status: str, extra_data: Dict[str, Any] = None) -> bool:
        col = self._collection()
        update_fields = {"status": status, "updated_at": datetime.utcnow()}
        
        if extra_data:
            update_fields.update(extra_data)

        result = await col.update_one(
            {"loan_id": loan_id},
            {"$set": update_fields}
        )
        return result.modified_count > 0