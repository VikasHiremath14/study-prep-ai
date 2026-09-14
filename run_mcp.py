#!/usr/bin/env python3
"""Runner script for StudyPrep.AI Model Context Protocol (MCP) Server.

Usage with Claude Desktop, Cursor, Antigravity, or any MCP client:
In your mcp_config.json:
{
  "mcpServers": {
    "studyprep": {
      "command": "python",
      "args": ["/Users/vikash/Desktop/AGENTIC AI PROJECT/run_mcp.py"]
    }
  }
}
"""
import os
import sys

# Ensure backend package is in pythonpath
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    from backend.agents.mcp_server import run_stdio_server
    run_stdio_server()
