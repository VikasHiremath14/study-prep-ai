"""Character Companion Agent (Phase 9)."""
from typing import Any, Dict
from backend.agents.base import BaseAgent


class CompanionAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Companion Agent",
            description="Delivers persona-inspired motivation, study-start nudges, break activity suggestions, and backlog recovery."
        )

    def run(self, *args, **kwargs) -> Dict[str, Any]:
        return {"status": "initialized", "agent": self.name}
