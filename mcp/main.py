#!/usr/bin/env python3
"""
Flask app exposing HTTP endpoints that call the Bank MCP FastMCP server
via langchain_mcp_adapters. Provides /create-account to create accounts.
Updated to include Loan Approval System endpoints.
"""

import os
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List

from flask import Flask, request, jsonify

# LangChain MCP client
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from mcp import ClientSession
from mcp.client.stdio import stdio_client
from mcp import StdioServerParameters
from dotenv import load_dotenv

# Resolve server paths
WORKDIR = Path(__file__).parent
BANK_SERVER_PATH = WORKDIR / "bank" / "fast_server.py"
LOAN_SERVER_PATH = WORKDIR / "loan_server.py"  # Added Loan Server Path

# Load environment and validate Groq key
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set in your .env file.")

# Preferred model from env (accepts raw name or prefixed)
ENV_GROQ_MODEL = os.getenv("GROQ_MODEL")
if ENV_GROQ_MODEL and not ENV_GROQ_MODEL.startswith("groq:"):
    ENV_GROQ_MODEL = f"groq:{ENV_GROQ_MODEL}"

# Candidate Groq models to try in order
GROQ_MODEL_CANDIDATES: List[str] = []
if ENV_GROQ_MODEL:
    GROQ_MODEL_CANDIDATES.append(ENV_GROQ_MODEL)
GROQ_MODEL_CANDIDATES += [
    "groq:llama-3.1-8b-instant",
    "groq:llama-3.1-13b-instant",
    "groq:llama-2-7b",
]

app = Flask(__name__)

def build_client() -> MultiServerMCPClient:
    """Construct a MultiServerMCPClient wired to the bank FastMCP server."""
    return MultiServerMCPClient(
        {
            "bank": {
                "command": "python",
                "args": [str(BANK_SERVER_PATH)],
                "transport": "stdio",
            }
        }
    )

async def get_agent_with_bank_tools():
    """Create agent with tools from Bank MCP server, selecting a working Groq model."""
    client = build_client()
    tools = await client.get_tools()

    last_error: Exception | None = None
    for model_name in GROQ_MODEL_CANDIDATES:
        try:
            agent = create_agent(model_name, tools)
            # quick no-op to ensure agent/tool binding doesn't explode on first use
            # (we avoid invoking a tool here to keep it cheap)
            return agent, client
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            # Skip decommissioned/failed-generation candidates, try next
            if (
                "decommission" in err_str
                or "model_decommissioned" in err_str
                or "tool_use_failed" in err_str
                or "failed_generation" in err_str
            ):
                continue
            # Unexpected error — break and surface
            break

    # If no candidate worked, raise last error
    raise RuntimeError(f"No Groq model candidates worked: {last_error}")
    
    
async def call_bank_tool_direct(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    server_params = StdioServerParameters(
      
       command="python",
        args=["-m", "bank.fast_server"],

        stderr=True  # capture stderr!
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            try:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments)
            except Exception as e:
                print("BANK TOOL ERROR:", e)
                raise e

            for item in result.content:
                if getattr(item, "type", None) == "text":
                    try:
                        return json.loads(item.text)
                    except Exception:
                        return {"success": True, "raw": item.text}

            return {"success": True, "raw": [c.__dict__ for c in result.content]}

async def call_loan_tool_direct(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Bypass LLM: directly call Loan FastMCP tool over stdio."""
    server_params = StdioServerParameters(
        command="python3",
        args=[str(LOAN_SERVER_PATH)],
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, arguments)
            
            # Parse result
            for item in result.content:
                if getattr(item, "type", None) == "text":
                    try:
                        # The loan tools return dictionaries directly, which FastMCP serializes to JSON strings
                        return json.loads(item.text)
                    except Exception:
                        return {"success": True, "raw": item.text}
            return {"success": True, "raw": [c.__dict__ for c in result.content]}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# --- Bank Routes ---

@app.route("/create-account", methods=["POST"])
def create_account_http():
    """
    HTTP endpoint to create an account by invoking MCP tool via LangChain agent.
    Expects JSON body with fields required by create_account tool.
    """
    try:
        print("Received /create-account request")
        payload: Dict[str, Any] = request.get_json(force=True) or {}
        print(f"Payload: {payload}")

        async def run():
            # Prefer direct tool call to avoid LLM latency/hangs
            return await call_bank_tool_direct("create_account", payload)

        result = asyncio.run(run())
        # result may be a dict or object; normalize to dict for response
        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/validate-documents", methods=["POST"])
def validate_documents_http():
    """Validate PAN/Aadhar via the FastMCP tool."""
    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}
        async def run():
            return await call_bank_tool_direct("validate_documents", payload)
        result = asyncio.run(run())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/get-account", methods=["POST"])  # use POST to accept JSON body
def get_account_http():
    """Get account details via MCP tool by number or id."""
    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}
        async def run():
            return await call_bank_tool_direct("get_account", payload)
        result = asyncio.run(run())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- Loan Routes ---

@app.route("/loan/apply", methods=["POST"])
def apply_loan_http():
    """
    Apply for a loan via the Loan MCP Server.
    Expects JSON: { "amount": float, "pre_approved_limit": float, "pan_card_no": str, "phone_number": str, "account_number": str (optional) }
    """
    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}
        async def run():
            return await call_loan_tool_direct("apply_for_loan", payload)
        result = asyncio.run(run())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/loan/verify-salary", methods=["POST"])
def verify_salary_http():
    """
    Verify salary for a pending loan via the Loan MCP Server.
    Expects JSON: { "loan_id": str, "monthly_salary": float }
    """
    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}
        async def run():
            return await call_loan_tool_direct("verify_salary_eligibility", payload)
        result = asyncio.run(run())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/loan/status", methods=["GET", "POST"])
def loan_status_http():
    """
    Check loan status via the Loan MCP Server.
    Accepts 'identifier' via Query Param (GET) or JSON Body (POST).
    """
    try:
        identifier = None
        
        # Handle POST
        if request.method == "POST":
            payload = request.get_json(force=True) or {}
            identifier = payload.get("identifier")
        
        # Handle GET
        if not identifier:
            identifier = request.args.get("identifier")
            
        if not identifier:
             return jsonify({"success": False, "error": "Missing 'identifier' (Loan ID, PAN, or Phone)"}), 400

        async def run():
            return await call_loan_tool_direct("get_loan_status", {"identifier": identifier})
        result = asyncio.run(run())
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    # Optional: expose host/port via env
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(host=host, port=port, debug=True)