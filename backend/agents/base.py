from abc import ABC, abstractmethod
from typing import Any, Dict
from backend.app.config import settings


class BaseAgent(ABC):
    """Abstract Base Class for all AI and deterministic agents in the system."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.provider = settings.LLM_PROVIDER

    @abstractmethod
    def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Execute the agent workflow."""
        pass
