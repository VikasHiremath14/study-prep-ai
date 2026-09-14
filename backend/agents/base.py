"""LangChain-Aware Base Agent.

Course reference: "Creating Your First LangChain Agent: Tools and LLMs"
and "LangChain Fundamentals: Prompt Templates, ChatModels, and Chains".

Replaces the raw Python ABC BaseAgent with a LangChain-powered base class that
gives every subagent access to:
  - A shared ChatModel instance (course: "ChatModels" lecture)
  - LCEL chain builder helper (course: "LCEL Fundamentals" lecture)
  - Structured output helper (course: "Structured Output with LangChain Agents")
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type
from backend.app.config import settings

import logging
logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Abstract Base Class for all LangChain-powered agents in StudyPrep.AI.

    Every subagent inherits:
      - self.llm         — LangChain ChatModel (Gemini 1.5 Flash)
      - self.build_chain()  — creates an LCEL chain from a prompt template
      - self.build_structured_chain()  — creates a chain with Pydantic output
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.provider = settings.LLM_PROVIDER

        # ── Shared LangChain ChatModel ────────────────────────────────────────
        # Course: "LangChain Fundamentals: ChatModels" lecture
        # All subagents share this instance. Switching providers = change here only.
        self.llm = self._init_llm()

    def _init_llm(self):
        """
        Initializes the LangChain ChatModel.
        Course: "LangChain Model Switching: Groq API Integration" — one-line swap.
        """
        if not settings.LLM_API_KEY or settings.LLM_PROVIDER == "mock":
            return None
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=settings.LLM_API_KEY,
                temperature=0.3,
                max_output_tokens=1024,
            )
        except Exception as e:
            logger.warning(f"[{self.name}] Could not initialize LangChain ChatModel: {e}")
            return None

    def build_chain(self, system_message: str, human_template: str):
        """
        Builds a simple LCEL chain: ChatPromptTemplate | ChatModel | StrOutputParser.

        Course: "Building a LangChain Chain to Summarize Text" and "LCEL Fundamentals"

        Args:
            system_message: The system role instruction.
            human_template: Human message template string (supports {variable} placeholders).

        Returns:
            An LCEL Runnable chain, or None if LLM is not configured.
        """
        if self.llm is None:
            return None
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_message),
                ("human", human_template),
            ])
            # LCEL pipe syntax: prompt | llm | parser
            return prompt | self.llm | StrOutputParser()
        except Exception as e:
            logger.error(f"[{self.name}] build_chain failed: {e}")
            return None

    def build_structured_chain(self, system_message: str, human_template: str, schema: Type):
        """
        Builds a structured LCEL chain that returns a validated Pydantic object.

        Course: "Structured Output with LangChain Agents Using Pydantic"
        Pattern: ChatPromptTemplate | llm.with_structured_output(PydanticSchema)

        Args:
            system_message: The system role instruction.
            human_template: Human message template string.
            schema: A Pydantic BaseModel class defining the output structure.

        Returns:
            An LCEL Runnable chain, or None if LLM is not configured.
        """
        if self.llm is None:
            return None
        try:
            from langchain_core.prompts import ChatPromptTemplate

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_message),
                ("human", human_template),
            ])
            structured_llm = self.llm.with_structured_output(schema)
            return prompt | structured_llm
        except Exception as e:
            logger.error(f"[{self.name}] build_structured_chain failed: {e}")
            return None

    @abstractmethod
    def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Execute the agent workflow."""
        pass
