#!/usr/bin/env python3
"""
Flask app exposing HTTP endpoints that call the Bank MCP FastMCP server
via langchain_mcp_adapters. Provides /create-account to create accounts.
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

# Resolve bank FastMCP server path
WORKDIR = Path(__file__).parent
BANK_SERVER_PATH = WORKDIR / "bank" / "fast_server.py"

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
                "command": "python3",
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
    """Bypass LLM: directly call FastMCP tool over stdio for reliability and speed."""
    server_params = StdioServerParameters(
        command="python",
        args=[str(BANK_SERVER_PATH)],
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(tool_name, arguments)
            # result.content is a list of content items; return first text/plain JSON if present
            for item in result.content:
                if getattr(item, "type", None) == "text":
                    try:
                        return json.loads(item.text)
                    except Exception:
                        return {"success": True, "raw": item.text}
            # Fallback: return raw serialization
            return {"success": True, "raw": [c.__dict__ for c in result.content]}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/create-account", methods=["POST"])
def create_account_http():
    """
    HTTP endpoint to create an account by invoking MCP tool via LangChain agent.
    Expects JSON body with fields required by create_account tool.
    """
    try:
        payload: Dict[str, Any] = request.get_json(force=True) or {}

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


if __name__ == "__main__":
    # Optional: expose host/port via env
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(host=host, port=port, debug=True)
