#!/usr/bin/env python3
"""
FastMCP Loan Server with MongoDB Persistence.
Tools:
- apply_for_loan
- verify_salary_eligibility
- get_loan_status
"""

import random
import uuid
import math
from typing import Optional

from mcp.server.fastmcp import FastMCP

# Import internal modules
from db.database.connection import db_manager
from db.models.loan import LoanModel

# Initialize Server
mcp = FastMCP("Loan Approval System")

# --- Constants ---
INTEREST_RATE_PA = 0.12  # 12% Annual Interest Rate
DEFAULT_TENURE_MONTHS = 24 

# --- Helpers ---
def _get_mock_credit_score():
    """Helper to fetch a dummy credit score between 550 and 900."""
    #implement actual credit score fetching logic here
    return random.randint(550, 900)

def _calculate_emi(principal: float, rate_per_annum: float, months: int) -> float:
    """Helper to calculate Equated Monthly Installment."""
    if months <= 0: return 0
    r = rate_per_annum / 12
    # EMI Formula: P x r x (1+r)^n / ((1+r)^n - 1)
    emi = (principal * r * pow(1 + r, months)) / (pow(1 + r, months) - 1)
    return round(emi, 2)

# --- Database Connection Helper ---
_connected: bool = False

async def _ensure_db():
    global _connected
    if not _connected:
        await db_manager.connect()
        _connected = True

# --- MCP Tools ---

@mcp.tool()
async def apply_for_loan(
    amount: float, 
    pre_approved_limit: float, 
    pan_card_no: str, 
    phone_number: str,
    account_number: Optional[str] = None
) -> dict:
    """
    Evaluates a loan application based on credit score and pre-approved limits.
    Persists the application in the database.
    
    Args:
        amount: The requested loan amount.
        pre_approved_limit: The limit assigned to the user (mocked or from profile).
        pan_card_no: Mandatory for credit checks.
        phone_number: Mandatory for contact.
        account_number: Optional. If provided, links loan to existing bank account.
    """
    await _ensure_db()
    
    # 1. Generate Loan ID
    loan_id = f"LN-{uuid.uuid4().hex[:8].upper()}"
    
    # 2. Logic Evaluation
    credit_score = _get_mock_credit_score()
    print(f"DEBUG: Loan {loan_id} - Fetched Credit Score: {credit_score}")
    
    status = "REJECTED"
    message = ""
    
    # Decision Matrix
    if credit_score < 700:
        message = f"REJECTED. Credit Score ({credit_score}) is below the minimum requirement of 700."
    
    elif amount > (2 * pre_approved_limit):
        message = (f"REJECTED. Loan amount ({amount}) exceeds 2x the pre-approved limit "
                   f"({pre_approved_limit}).")

    elif amount <= pre_approved_limit:
        status = "APPROVED"
        message = (f"APPROVED INSTANTLY. Credit Score: {credit_score}. "
                   f"Amount is within pre-approved limit.")

    else:
        # Limit < Amount <= 2x Limit
        status = "PENDING_SALARY_VERIFICATION"
        message = (f"PENDING_SALARY_VERIFICATION. Credit Score: {credit_score}. "
                   f"Loan amount is > limit but <= 2x limit. "
                   f"Action Required: Please call 'verify_salary_eligibility' with loan_id and monthly_salary.")

    # 3. Create Payload for DB
    payload = {
        "loan_id": loan_id,
        "account_number": account_number,
        "pan_card_no": pan_card_no,
        "phone_number": phone_number,
        "amount": amount,
        "pre_approved_limit": pre_approved_limit,
        "credit_score": credit_score,
        "status": status,
        "initial_decision_message": message
    }

    # 4. Save to DB
    try:
        created_loan = await LoanModel().create_loan(payload)
        return {
            "success": True, 
            "status": status, 
            "loan_id": loan_id, 
            "message": message,
            "data": created_loan
        }
    except ValueError as e:
        return {
            "success": False, 
            "status": "ERROR", 
            "message": str(e)
        }

@mcp.tool()
async def verify_salary_eligibility(loan_id: str, monthly_salary: float) -> dict:
    """
    Validates loan based on EMI to Income ratio. 
    Use this only if the loan status is PENDING_SALARY_VERIFICATION.
    
    Args:
        loan_id: The ID returned from apply_for_loan.
        monthly_salary: The user's monthly income.
    """
    await _ensure_db()
    model = LoanModel()
    
    # 1. Fetch Loan
    loan = await model.get_loan_by_id(loan_id)
    if not loan:
        return {"success": False, "error": "Loan ID not found"}
        
    if loan["status"] != "PENDING_SALARY_VERIFICATION":
        return {
            "success": False, 
            "error": f"Cannot verify salary. Current status is {loan['status']}."
        }

    # 2. Logic Calculation
    amount = loan["amount"]
    # Calculate expected EMI
    emi = _calculate_emi(amount, INTEREST_RATE_PA, DEFAULT_TENURE_MONTHS)
    
    # Logic: Approve only if expected EMI <= 50% of salary
    salary_threshold = monthly_salary * 0.50
    
    if emi <= salary_threshold:
        new_status = "APPROVED"
        reason = (f"APPROVED. Salary verification successful. "
                  f"EMI ({emi}) is within 50% of salary ({monthly_salary}).")
    else:
        new_status = "REJECTED"
        reason = (f"REJECTED. High Debt-to-Income ratio. "
                  f"Estimated EMI ({emi}) exceeds 50% of monthly salary ({monthly_salary}).")

    # 3. Update DB
    await model.update_status(loan_id, new_status, {
        "verified_salary": monthly_salary,
        "estimated_emi": emi,
        "final_decision_reason": reason
    })
    
    return {
        "success": True, 
        "loan_id": loan_id, 
        "old_status": "PENDING_SALARY_VERIFICATION",
        "new_status": new_status, 
        "message": reason
    }

@mcp.tool()
async def get_loan_status(identifier: str) -> dict:
    """
    Check the status of loan applications.
    
    Args:
        identifier: Can be a Loan ID, PAN Card Number, or Phone Number.
    """
    await _ensure_db()
    model = LoanModel()
    
    # Try ID first
    if identifier.startswith("LN-"):
        loan = await model.get_loan_by_id(identifier)
        if loan:
            return {"success": True, "loans": [loan]}
            
    # Try PAN/Phone
    loans = await model.get_loans_by_identifier(identifier)
    
    if not loans:
        return {"success": False, "message": "No applications found for this identifier."}
        
    return {"success": True, "loans": loans}

if __name__ == "__main__":
    # Run via stdio, compatible with MCP clients (Claude Desktop, etc.)
    mcp.run(transport="stdio")