#!/usr/bin/env python3
"""
FastMCP-style Bank server exposing tools via stdio.
Tools:
- create_account
- get_account
- validate_documents
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from mcp.server.fastmcp import FastMCP

# Import our internal modules
from db.database.connection import db_manager
from db.models.account import AccountModel
from db.utils.validators import AccountValidator
from db.utils.account_utils import generate_account_number

mcp = FastMCP("Bank")

# Shared, lazily-connected DB manager
_connected: bool = False

async def _ensure_db():
    global _connected
    if not _connected:
        await db_manager.connect()
        _connected = True
    return db_manager

@mcp.tool()
async def create_account(
    name: str,
    dob: str,
    pan_card_no: str,
    aadhar_no: str,
    balance: float,
    account_type: str,
    image: str = "",
    pan_card_image: str = "",
    aadhar_image: str = ""
) -> dict:
    """Create a new bank account with validation and persistence."""
    await _ensure_db()

    validator = AccountValidator()
    data = {
        "name": name,
        "dob": dob,
        "pan_card_no": pan_card_no,
        "aadhar_no": aadhar_no,
        "balance": balance,
        "account_type": account_type,
        "image": image,
        "pan_card_image": pan_card_image,
        "aadhar_image": aadhar_image,
    }

    vr = validator.validate_account_data(data)
    if not vr["valid"]:
        return {"success": False, "error": "Validation failed", "details": vr["errors"]}

    acct_number = generate_account_number(account_type)
    payload = {
        "account_number": acct_number,
        "name": name,
        "image": image,
        "dob": dob,
        "pan_card_no": pan_card_no.upper(),
        "aadhar_no": aadhar_no,
        "pan_card_image": pan_card_image,
        "aadhar_image": aadhar_image,
        "balance": float(balance),
        "account_type": account_type,
        "status": "active",
        "kyc_verified": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    created = await AccountModel().create_account(payload)
    return {"success": True, "account": created}

@mcp.tool()
async def get_account(account_number: Optional[str] = None, account_id: Optional[str] = None) -> dict:
    """Get account details by number or id."""
    await _ensure_db()
    model = AccountModel()
    if account_number:
        acc = await model.get_account_by_number(account_number)
    elif account_id:
        acc = await model.get_account_by_id(account_id)
    else:
        return {"success": False, "error": "Provide account_number or account_id"}
    if acc:
        return {"success": True, "account": acc}
    return {"success": False, "error": "Account not found"}

@mcp.tool()
async def validate_documents(pan_card_no: str, aadhar_no: str) -> dict:
    """Validate PAN and Aadhar formats (Aadhar uses Verhoeff check)."""
    v = AccountValidator()
    pan_ok = v.validate_pan(pan_card_no)
    aad_ok = v.validate_aadhar(aadhar_no)
    return {
        "success": True,
        "validation": {
            "pan_valid": pan_ok,
            "aadhar_valid": aad_ok,
            "both_valid": pan_ok and aad_ok,
        },
    }

# Keep above code unchanged...

if __name__ == "__main__":
    mcp.run()

