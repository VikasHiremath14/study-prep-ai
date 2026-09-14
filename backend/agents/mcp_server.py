"""StudyPrep.AI — Model Context Protocol (MCP) Server (mcp_server.py).

Course reference: Section 16 "Model Context Protocol (MCP) Integration"

Implements an MCP-compliant JSON-RPC 2.0 stdio server exposing StudyPrep.AI
agents and tools to any external LLM client (Claude Desktop, Cursor, Antigravity, etc.).

Supported Methods:
  - initialize: Negotiates protocol capabilities and server info.
  - tools/list: Lists all available pedagogical and retrieval tools.
  - tools/call: Executes the requested tool and returns structured content.
"""

import sys
import json
import logging
from typing import Dict, Any, List, Optional

from backend.agents.tools import (
    search_study_notes,
    explain_concept,
    generate_practice_quiz,
    calculate_retention_risk,
    schedule_study_session,
    search_web_references,
)

logger = logging.getLogger("mcp_server")


def get_tool_manifest() -> List[Dict[str, Any]]:
    """Returns MCP tools/list schema for StudyPrep.AI tools."""
    return [
        {
            "name": "search_study_notes",
            "description": "Semantic search over student's textbooks, lecture notes, and ingested PDFs using ChromaDB.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search question or concept to look up"},
                    "n_results": {"type": "integer", "description": "Number of passages to retrieve (default 3)", "default": 3}
                },
                "required": ["query"]
            }
        },
        {
            "name": "explain_concept",
            "description": "Explains an academic concept calibrated to student grade level using educational personas (ELI5, Deep Dive, Exam Crux, Socratic).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "concept": {"type": "string", "description": "Concept name or formula to explain"},
                    "persona": {"type": "string", "enum": ["eli5", "deep_dive", "exam_crux", "socratic"], "default": "eli5"}
                },
                "required": ["concept"]
            }
        },
        {
            "name": "generate_practice_quiz",
            "description": "Generates a 3-question active recall multiple-choice quiz with explanations.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Topic or concept to test"},
                    "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"], "default": "medium"}
                },
                "required": ["topic"]
            }
        },
        {
            "name": "calculate_retention_risk",
            "description": "Computes memory retention decay risk and cognitive burden using the Ebbinghaus forgetting curve.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "score_pct": {"type": "number", "description": "Recent quiz score percentage (0-100)"},
                    "response_time_sec": {"type": "number", "description": "Average response time per question in seconds"}
                },
                "required": ["score_pct", "response_time_sec"]
            }
        },
        {
            "name": "schedule_study_session",
            "description": "Optimizes a study block with focus intervals and mandatory brain recovery breaks.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Subject or topic to study"},
                    "duration_minutes": {"type": "integer", "default": 45}
                },
                "required": ["subject"]
            }
        }
    ]


def handle_tool_call(name: str, args: Dict[str, Any]) -> str:
    """Dispatches tool execution."""
    if name == "search_study_notes":
        return search_study_notes.invoke(args)
    elif name == "explain_concept":
        return explain_concept.invoke(args)
    elif name == "generate_practice_quiz":
        return generate_practice_quiz.invoke(args)
    elif name == "calculate_retention_risk":
        return calculate_retention_risk.invoke(args)
    elif name == "schedule_study_session":
        return schedule_study_session.invoke(args)
    elif name == "search_web_references":
        return search_web_references.invoke(args)
    else:
        raise ValueError(f"Unknown tool: '{name}'")


def process_mcp_message(msg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Processes an incoming JSON-RPC 2.0 message."""
    method = msg.get("method")
    msg_id = msg.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "studyprep-mcp-server",
                    "version": "1.0.0"
                }
            }
        }

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "tools": get_tool_manifest()
            }
        }

    elif method == "tools/call":
        params = msg.get("params", {})
        tool_name = params.get("name")
        args = params.get("arguments", {})
        try:
            output_text = handle_tool_call(tool_name, args)
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "content": [{"type": "text", "text": str(output_text)}],
                    "isError": False
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "content": [{"type": "text", "text": f"Error executing {tool_name}: {str(e)}"}],
                    "isError": True
                }
            }

    elif method == "ping":
        return {"jsonrpc": "2.0", "id": msg_id, "result": {}}

    return None


def run_stdio_server():
    """Main stdio loop for MCP server."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
            response = process_mcp_message(request)
            if response:
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
        except Exception as e:
            logger.error(f"Error handling MCP line: {e}")


if __name__ == "__main__":
    run_stdio_server()
