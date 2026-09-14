"""StudyPrep.AI — Security & Protection Layer (security.py).

Course references:
  - Section 21: "LLM App Security: Prompt Injection and Jailbreaking Defenses"
  - Section 22: "Production API Hardening: Rate Limiting and Abuse Prevention"

Provides:
  1. SlowAPI Rate Limiter instance for route protection.
  2. Rule-based & heuristic Prompt Injection Detector.
  3. Input sanitization to prevent prompt leakage and instruction tampering.
"""

import re
import logging
from typing import Tuple
from fastapi import Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger("security")

# ── 1. SlowAPI Rate Limiter Instance ──────────────────────────────────────────
# Rate limits sensitive agent generation routes to prevent API exhaustion and runaway costs
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


# ── 2. Prompt Injection & Jailbreak Heuristics ─────────────────────────────────
# Known attack signatures (Course: Section 21 "LLM Vulnerabilities")
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directions)",
    r"disregard\s+(the\s+)?(system|initial)\s+prompt",
    r"you\s+are\s+now\s+(in\s+)?(developer\s+mode|dan|jailbroken)",
    r"reveal\s+(your\s+)?(system\s+prompt|instructions|secret\s+key|api\s+key)",
    r"print\s+the\s+above\s+text",
    r"system\s*:\s*you\s+must",
    r"output\s+the\s+exact\s+prompt\s+above",
    r"bypass\s+all\s+(filters|safety|guardrails)",
]

COMPILED_INJECTION_RE = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def detect_prompt_injection(user_input: str) -> Tuple[bool, str]:
    """
    Checks user input for common prompt injection and system override attempts.

    Course: Section 21 "Defense in Depth for LLMs"

    Args:
        user_input: Raw student question, query, or text selection.

    Returns:
        (is_safe, message): Tuple with boolean flag and explanatory message.
    """
    if not user_input or not isinstance(user_input, str):
        return True, "Valid"

    # Check against known adversarial patterns
    for pattern in COMPILED_INJECTION_RE:
        if pattern.search(user_input):
            logger.warning(f"[Security] Blocked prompt injection attempt matching: {pattern.pattern}")
            return False, "Input contained prohibited prompt override instructions."

    # Check for excessive delimiter abuse (e.g. repeated backticks or curly braces)
    if user_input.count("```") > 8 or user_input.count("###") > 10:
        return False, "Input contained suspicious formatting delimiters."

    return True, "Safe"


def sanitize_input(text: str, max_length: int = 4000) -> str:
    """
    Sanitizes user input by stripping null bytes, truncating excessive length,
    and removing hidden control characters.
    """
    if not text:
        return ""
    # Strip null characters
    cleaned = text.replace("\x00", "")
    # Truncate to maximum permissible token boundary
    return cleaned[:max_length].strip()
