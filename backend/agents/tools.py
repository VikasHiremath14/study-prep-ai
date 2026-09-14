"""StudyPrep.AI — LangChain @tool Decorated Agent Toolset & ReAct Agent.

Course references:
  - Section 5: "Writing Tools — The @tool Decorator"
  - Section 6: "Creating Your First LangChain Agent: Tools and LLMs"
  - Section 7: "The Evolution of LangChain ReAct Agents"
  - Section 14: "Agentic RAG Architecture — Tool-Assisted Retrieval"

This module wraps all StudyPrep.AI core capabilities into standard LangChain
`@tool` decorated functions with comprehensive docstrings and type annotations.
These tools can be bound to any ChatModel or executed inside a LangGraph ReAct agent.
"""

import json
import logging
from typing import Optional, List, Dict, Any

from langchain_core.tools import tool

from backend.app.config import settings
from backend.agents.ingestion_agent import ingestion_agent
from backend.agents.qa_tutor import qa_tutor_agent
from backend.agents.quiz_generator import quiz_generator_agent
from backend.agents.retention_profiler import retention_profiler_agent
from backend.agents.scheduler import scheduler_agent
from backend.agents.references import get_references_for_page_text

logger = logging.getLogger(__name__)


# ── 1. Vector Retrieval Tool ──────────────────────────────────────────────────
@tool
def search_study_notes(query: str, n_results: int = 3) -> str:
    """
    Search indexed study notes, textbooks, and lecture transcripts using vector similarity search.
    Useful when the student asks a question about their course materials, uploaded PDFs, or notes.

    Args:
        query: The search term or conceptual question to look up in the vector database.
        n_results: Maximum number of relevant document chunks to return (default 3).

    Returns:
        A formatted string of relevant text passages from the student's study material.
    """
    try:
        results = ingestion_agent.query_collection(query=query, n_results=n_results)
        chunks = results.get("documents", [[]])[0]
        if not chunks:
            return f"No direct study notes found for '{query}'. Consider falling back to web search or explaining from general knowledge."
        formatted = "\n---\n".join([f"Passage {i+1}:\n{chunk}" for i, chunk in enumerate(chunks)])
        return formatted
    except Exception as e:
        logger.error(f"search_study_notes tool failed: {e}")
        return f"Error retrieving study notes: {str(e)}"


# ── 2. Conceptual Explanation Tool ────────────────────────────────────────────
@tool
def explain_concept(concept: str, persona: str = "eli5") -> str:
    """
    Generate an educational explanation of an academic concept using a tailored teaching persona.

    Args:
        concept: The subject, formula, or concept to explain (e.g. 'Backpropagation', 'Mitosis').
        persona: The pedagogical style. Options:
            - 'eli5': Simple real-world analogies, beginner-friendly.
            - 'deep_dive': Rigorous, first-principles technical breakdown.
            - 'exam_crux': Bullet points of what exam boards test and common pitfalls.
            - 'socratic': Guiding questions that lead the student to deduce the answer.

    Returns:
        Structured explanation markdown tailored to the chosen persona.
    """
    try:
        response = qa_tutor_agent.explain_concept(
            concept=concept,
            persona=persona,
            grade_level="undergraduate"
        )
        return response.get("explanation", f"Could not generate explanation for {concept}.")
    except Exception as e:
        logger.error(f"explain_concept tool failed: {e}")
        return f"Error generating explanation: {str(e)}"


# ── 3. Practice Quiz Generator Tool ───────────────────────────────────────────
@tool
def generate_practice_quiz(topic: str, num_questions: int = 3, difficulty: str = "medium") -> str:
    """
    Generate active-recall practice quiz questions with multiple choice options and detailed explanations.
    Useful when a student wants to test their understanding after learning a concept.

    Args:
        topic: The topic or concept to test (e.g. 'Photosynthesis light reactions', 'Dynamic Programming').
        num_questions: Number of questions to generate (1 to 5).
        difficulty: 'easy', 'medium', or 'hard'.

    Returns:
        JSON string containing questions, options A/B/C/D, correct answer key, and pedagogical rationales.
    """
    try:
        quiz = quiz_generator_agent.generate_quiz(
            topic=topic,
            context=f"Generate a {difficulty} quiz focusing on core principles and typical exam problems.",
            num_questions=min(max(num_questions, 1), 5),
            difficulty=difficulty
        )
        return json.dumps(quiz, indent=2)
    except Exception as e:
        logger.error(f"generate_practice_quiz tool failed: {e}")
        return f"Error creating quiz: {str(e)}"


# ── 4. Retention & Fatigue Profiler Tool ───────────────────────────────────────
@tool
def calculate_retention_risk(score_pct: float, response_time_sec: float) -> str:
    """
    Analyze student quiz metrics using the Ebbinghaus forgetting curve model to detect fatigue
    and predict retention decay.

    Args:
        score_pct: Student's percentage score on the recent quiz (0.0 to 100.0).
        response_time_sec: Average response time per question in seconds.

    Returns:
        Retention risk assessment, memory decay half-life estimate, and recommended review interval.
    """
    try:
        half_life_days = max(0.5, (score_pct / 100.0) * 7.0)
        risk = "HIGH" if score_pct < 60 or response_time_sec > 45 else ("MEDIUM" if score_pct < 80 else "LOW")
        return (
            f"Retention Risk: {risk} | Estimated Memory Half-Life: {half_life_days:.1f} days.\n"
            f"Recommended Next Spaced Review: within {max(1, int(half_life_days))} day(s).\n"
            f"Cognitive load status: {'Optimal' if risk == 'LOW' else 'High burden / fatigue detected, recommend a 5-min break.'}"
        )
    except Exception as e:
        logger.error(f"calculate_retention_risk tool failed: {e}")
        return f"Error analyzing retention: {str(e)}"


# ── 5. Smart Study Session Scheduler Tool ─────────────────────────────────────
@tool
def schedule_study_session(subject: str, duration_minutes: int = 45) -> str:
    """
    Calculate an optimized study block based on cognitive load management and spaced repetition slots.

    Args:
        subject: The academic subject or topic to study.
        duration_minutes: Planned study time (e.g. 25 for Pomodoro, 45 for deep work).

    Returns:
        Structured study schedule with focus intervals and mandatory rest breaks.
    """
    try:
        work_block = min(duration_minutes, 50)
        break_block = 5 if work_block <= 30 else 10
        return (
            f"📅 Study Plan for '{subject}':\n"
            f"• Deep Focus Interval: {work_block} minutes (Active recall + problem solving)\n"
            f"• Mandatory Brain Recovery: {break_block} minutes (Walk, hydrate, no screens)\n"
            f"• Optimal review window: Tomorrow morning during high peak alertness."
        )
    except Exception as e:
        logger.error(f"schedule_study_session tool failed: {e}")
        return f"Error scheduling session: {str(e)}"


# ── 6. Fallback Web Search Tool (Tavily / Academic Reference) ─────────────────
@tool
def search_web_references(query: str) -> str:
    """
    Search the external web for academic references, documentation, and external explanations
    when local study notes do not contain the answer (Corrective RAG fallback).

    Args:
        query: The search query to look up on the web.

    Returns:
        Summaries and URLs of reliable external web sources.
    """
    # 1. Try Tavily if API key is provided
    tavily_key = getattr(settings, "TAVILY_API_KEY", None)
    if tavily_key:
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=tavily_key)
            res = client.search(query=query, max_results=3)
            formatted = []
            for r in res.get("results", []):
                formatted.append(f"Title: {r.get('title')}\nURL: {r.get('url')}\nSnippet: {r.get('content')}")
            if formatted:
                return "\n\n".join(formatted)
        except Exception as e:
            logger.warning(f"Tavily search error: {e}, falling back to reference agent")

    # 2. Curated academic reference fallback
    try:
        ref_data = get_references_for_page_text(page_text=query)
        websites = ref_data.get("websites", [])
        if websites:
            formatted = []
            for r in websites[:3]:
                formatted.append(f"Source: {r.get('title', 'Reference')} ({r.get('type', 'website')})\nURL: {r.get('url', '')}")
            return "\n\n".join(formatted)
    except Exception as e:
        logger.error(f"Reference fallback failed: {e}")

    return f"Academic references found for '{query}': check Khan Academy, MIT OpenCourseWare, or arXiv for detailed papers."


# ── All Registered Tools ──────────────────────────────────────────────────────
STUDY_TOOLS = [
    search_study_notes,
    explain_concept,
    generate_practice_quiz,
    calculate_retention_risk,
    schedule_study_session,
    search_web_references,
]


# ── ReAct Agent Builder ───────────────────────────────────────────────────────
# Course: Section 6 & 7 — "The Evolution of LangChain ReAct Agents" &
# LangGraph prebuilt create_react_agent
def create_study_react_agent(checkpointer: Optional[Any] = None):
    """
    Builds a LangGraph ReAct agent equipped with the full suite of study tools.
    If LLM is in mock mode (no API key), returns a lightweight fallback handler.
    """
    from backend.agents.qa_tutor import qa_tutor_agent
    llm = qa_tutor_agent.llm

    if not llm:
        logger.info("No LLM key configured — ReAct agent running in offline mock mode.")
        return None

    try:
        from langgraph.prebuilt import create_react_agent
        # LangGraph ReAct agent with tools and optional checkpointer for session persistence
        agent = create_react_agent(
            model=llm,
            tools=STUDY_TOOLS,
            checkpointer=checkpointer
        )
        return agent
    except Exception as e:
        logger.error(f"Failed to create LangGraph ReAct agent: {e}")
        return None
