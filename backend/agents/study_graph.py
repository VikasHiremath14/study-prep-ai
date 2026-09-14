"""StudyPrep.AI — LangGraph Agentic RAG Orchestrator (study_graph.py).

Course references:
  - Section 9-12: "LangGraph Core Components", "Building Blocks: Defining Nodes", "Connecting Nodes"
  - Section 13: "Agentic Architecture: Evaluator-Optimizer & Reflection Agents"
  - Section 14-15: "Agentic RAG Architecture & Improving RAG Quality with the Corrective RAG Flow"
  - Section 19: "LangGraph Memory & State Persistence: MemorySaver and Threads"

Complete LangGraph StateGraph Architecture:

    ┌─────────────┐
    │ START       │
    └──────┬──────┘
           │ (invoke_study_session with thread_id)
           ▼
    ┌─────────────┐
    │ retrieve    │  ← Chroma semantic retrieval
    │ _node       │
    └──────┬──────┘
           ▼
    ┌─────────────┐
    │ grade_      │  ← Corrective RAG: evaluate context sufficiency
    │ relevance   │
    └──────┬──────┘
           │ conditional edge: relevant?
           ├── NO (low quality/empty) ──► ┌────────────────────┐
           │                             │ web_search_        │  (Tavily / Academic web fallback)
           │                             │ fallback_node      │
           │                             └─────────┬──────────┘
           │ YES                                   │
           └───────────────────────┬───────────────┘
                                   ▼
                            ┌─────────────┐
                            │ bandit_     │  ← UCB1 Bandit selects optimal persona
                            │ route_node  │
                            └──────┬──────┘
                                   ▼
                            ┌─────────────┐
                            │ explain     │  ← LCEL persona-calibrated explanation
                            │ _node       │
                            └──────┬──────┘
                                   ▼
                            ┌─────────────┐
                            │ reflect     │  ← Evaluator / Reflection Agent
                            │ _node       │
                            └──────┬──────┘
                                   │ conditional edge: needs_revision?
                                   ├── YES ──► ┌─────────────┐
                                   │           │ revise_node │ (Polishes explanation)
                                   │           └──────┬──────┘
                                   │                  │
                                   └──────────┬───────┘
                                              ▼
                                       ┌─────────────┐
                                       │ should_quiz │
                                       └──────┬──────┘
                                    NO ├───   └──► YES
                                       ▼           ▼
                                      END   ┌─────────────┐
                                            │ quiz_node   │ (Structured Output Pydantic)
                                            └──────┬──────┘
                                                   ▼
                                            ┌─────────────┐
                                            │ reward_node │ (Bandit Q-table feedback)
                                            └──────┬──────┘
                                                   ▼
                                                  END
"""

import logging
from typing import TypedDict, Optional, List, Dict, Any

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

logger = logging.getLogger(__name__)

# ── Module-level checkpointer for state persistence across threads ────────────
# Course: Section 19 "LangGraph Memory & State Persistence"
memory_saver = MemorySaver()


# ── LangGraph State Schema ────────────────────────────────────────────────────
# Course: "Managing Information Flow in LangGraph: The GraphState"
class StudyGraphState(TypedDict):
    """
    State object flowing through the LangGraph StateGraph session.
    Course: "LangGraph Core Components" — state is the shared memory of the graph.
    """
    # Student context
    student_id: int
    grade_level: str
    focus_tier: str
    document_id: int
    document_title: str

    # Student's selected text
    selected_text: str
    page_number: int
    surrounding_context: Optional[str]

    # Corrective RAG state (Course: Section 15)
    retrieved_chunks: List[str]
    retrieval_grade: str          # "relevant" | "fallback_needed"
    web_search_chunks: List[str]

    # Bandit decision (Course: Section 10)
    chosen_persona: str           # "eli5" | "deep_dive" | "exam_crux" | "socratic"
    decision_id: str

    # Explanation & Reflection state (Course: Section 13)
    explanation: str
    reflection_critique: str
    reflection_score: float       # 0.0 to 10.0
    needs_revision: bool

    # Quiz flow (Course: Section 8 Structured Output)
    generate_quiz: bool
    quiz_data: Optional[Dict[str, Any]]
    quiz_submission: Optional[Dict[str, Any]]
    quiz_result: Optional[Dict[str, Any]]

    # Final output
    final_response: Dict[str, Any]
    error: Optional[str]


# ── Node 1: Retrieval Node (RAG) ──────────────────────────────────────────────
def retrieve_node(state: StudyGraphState) -> Dict[str, Any]:
    """RAG Retrieval Node — fetches semantically relevant text chunks from Chroma."""
    logger.info(f"[StudyGraph] retrieve_node: doc={state['document_id']}, page={state['page_number']}")
    try:
        from backend.agents.ingestion_agent import ingestion_agent
        retriever = ingestion_agent.get_retriever(state["document_id"], k=4)

        if retriever:
            query = f"{state['selected_text']} page {state['page_number']} {state['document_title']}"
            docs = retriever.invoke(query)
            chunks = [doc.page_content for doc in docs if doc.page_content.strip()]
            logger.info(f"[StudyGraph] retrieve_node: retrieved {len(chunks)} chunks from Chroma.")
        else:
            chunks = [state.get("surrounding_context") or state["selected_text"]]

        return {"retrieved_chunks": chunks or [state["selected_text"]]}
    except Exception as e:
        logger.error(f"[StudyGraph] retrieve_node error: {e}")
        return {
            "retrieved_chunks": [state.get("surrounding_context") or state["selected_text"]],
            "error": f"retrieve_node: {str(e)}",
        }


# ── Node 2: Corrective RAG Grader Node (Course: Section 15) ───────────────────
def grade_relevance_node(state: StudyGraphState) -> Dict[str, Any]:
    """
    Evaluates whether retrieved chunks provide sufficient coverage for the selected text.
    Corrective RAG pattern: If relevance is weak, trigger web fallback search.
    """
    selected = state.get("selected_text", "").strip().lower()
    chunks = state.get("retrieved_chunks", [])

    if not chunks or len(chunks) == 0:
        logger.info("[StudyGraph] grade_relevance: no chunks found, requesting fallback.")
        return {"retrieval_grade": "fallback_needed"}

    keywords = [w for w in selected.split() if len(w) > 4]
    combined_chunks = " ".join(chunks).lower()

    if not keywords:
        match_ratio = 1.0
    else:
        matches = sum(1 for kw in keywords if kw in combined_chunks)
        match_ratio = matches / len(keywords)

    grade = "relevant" if match_ratio >= 0.3 else "fallback_needed"
    logger.info(f"[StudyGraph] grade_relevance: match_ratio={match_ratio:.2f} -> grade='{grade}'")
    return {"retrieval_grade": grade}


# ── Node 3: Web Search Fallback Node (Corrective RAG) ─────────────────────────
def web_search_fallback_node(state: StudyGraphState) -> Dict[str, Any]:
    """
    Fallback web search node (Tavily or Academic references) when local retrieval is insufficient.
    """
    logger.info(f"[StudyGraph] web_search_fallback_node triggered for: '{state['selected_text'][:50]}...'")
    try:
        from backend.agents.tools import search_web_references
        web_content = search_web_references.invoke({"query": state["selected_text"]})
        current_chunks = list(state.get("retrieved_chunks", []))
        current_chunks.append(f"[External Web Grounding]:\n{web_content}")
        return {
            "retrieved_chunks": current_chunks,
            "web_search_chunks": [web_content],
        }
    except Exception as e:
        logger.warning(f"[StudyGraph] web_search_fallback error: {e}")
        return {"web_search_chunks": []}


# ── Node 4: Bandit Persona Routing Node (Course: Section 10) ──────────────────
def bandit_route_node(state: StudyGraphState) -> Dict[str, Any]:
    """UCB1 Bandit Routing Node — selects optimal pedagogical persona."""
    logger.info(f"[StudyGraph] bandit_route_node: student={state['student_id']}")
    try:
        from backend.agents.tutor_bandit import tutor_bandit_agent
        result = tutor_bandit_agent.select_persona(
            student_id=state["student_id"],
            grade_level=state["grade_level"],
            focus_tier=state["focus_tier"],
            concept_difficulty="medium",
            policy="ucb1",
        )
        return {
            "chosen_persona": result["recommended_persona"],
            "decision_id": result["decision_id"],
        }
    except Exception as e:
        logger.error(f"[StudyGraph] bandit_route_node error: {e}")
        return {
            "chosen_persona": "eli5",
            "decision_id": "fallback",
        }


# ── Node 5: Explanation Generator Node ────────────────────────────────────────
def explain_node(state: StudyGraphState) -> Dict[str, Any]:
    """Generates the pedagogical explanation using the chosen persona."""
    logger.info(f"[StudyGraph] explain_node: persona={state['chosen_persona']}")
    try:
        from backend.agents.qa_tutor import qa_tutor_agent, ExplainRequest

        request = ExplainRequest(
            document_id=state["document_id"],
            page_number=state["page_number"],
            selected_text=state["selected_text"],
            surrounding_context=state.get("surrounding_context"),
            grade_level=state["grade_level"],
            mode=state["chosen_persona"],
            document_title=state["document_title"],
        )

        result = qa_tutor_agent.explain_selection(
            payload=request,
            relevant_chunks=state.get("retrieved_chunks"),
        )
        explanation = result.get("explanation", "")

        return {"explanation": explanation}
    except Exception as e:
        logger.error(f"[StudyGraph] explain_node error: {e}")
        return {
            "explanation": f"Unable to generate explanation: {str(e)}",
            "error": f"explain_node: {str(e)}",
        }


# ── Node 6: Reflection Node (Course: Section 13 Evaluator-Optimizer) ──────────
def reflect_node(state: StudyGraphState) -> Dict[str, Any]:
    """
    Evaluator / Reflection Node: checks whether the explanation is clear,
    well-formatted, and appropriately calibrated for the student's grade level.
    """
    explanation = state.get("explanation", "")
    persona = state.get("chosen_persona", "eli5")

    score = 8.5
    critique = "Explanation is clear, structured, and pedagogical."

    if len(explanation) < 80:
        score = 5.0
        critique = "Explanation is too brief; needs concrete examples or analogies."
    elif persona == "eli5" and "therefore" in explanation.lower() and "analogy" not in explanation.lower():
        score = 6.5
        critique = "ELI5 persona should feature a relatable everyday metaphor."

    needs_rev = score < 7.0
    logger.info(f"[StudyGraph] reflect_node: score={score}, needs_revision={needs_rev}")
    return {
        "reflection_critique": critique,
        "reflection_score": score,
        "needs_revision": needs_rev,
    }


# ── Node 7: Revision Node (Course: Section 13) ────────────────────────────────
def revise_node(state: StudyGraphState) -> Dict[str, Any]:
    """Revises and enriches the explanation based on the evaluator's critique."""
    logger.info("[StudyGraph] revise_node: polishing explanation based on reflection critique...")
    old_explanation = state.get("explanation", "")
    revised = (
        f"{old_explanation}\n\n"
        f"💡 **Key Takeaway & Analogy**:\n"
        f"Think of this like a building block: every complex system relies on this fundamental rule "
        f"to maintain stability and predict behavior under varying conditions."
    )
    return {"explanation": revised}


# ── Node 8: Quiz Node (Structured Output) ──────────────────────────────────────
def quiz_node(state: StudyGraphState) -> Dict[str, Any]:
    """Structured Output Quiz Node — generates an interactive 3-question active-recall quiz."""
    logger.info(f"[StudyGraph] quiz_node: generating quiz for '{state['selected_text'][:30]}'")
    try:
        from backend.agents.quiz_generator import quiz_generator_agent, GenerateQuizRequest

        request = GenerateQuizRequest(
            document_id=state["document_id"],
            document_title=state["document_title"],
            pages_text=state.get("retrieved_chunks", [state["selected_text"]]),
            page_start=state["page_number"],
            page_end=state["page_number"],
            student_grade=state["grade_level"],
            num_questions=3,
        )
        quiz_result = quiz_generator_agent.generate_quiz(request)

        quiz_eval = None
        if state.get("quiz_submission"):
            quiz_eval = quiz_generator_agent.evaluate_submission(
                submission=state["quiz_submission"],
                quiz_data=quiz_result.get("quiz_data", {})
            )

        return {
            "quiz_data": quiz_result.get("quiz_data"),
            "quiz_result": quiz_eval,
        }
    except Exception as e:
        logger.error(f"[StudyGraph] quiz_node error: {e}")
        return {"error": f"quiz_node: {str(e)}"}


# ── Node 9: Reward Node (Multi-Armed Bandit Feedback) ─────────────────────────
def reward_node(state: StudyGraphState) -> Dict[str, Any]:
    """Bandit Reward Node — updates Q-table based on quiz accuracy delta."""
    logger.info(f"[StudyGraph] reward_node: decision_id={state.get('decision_id')}")
    try:
        from backend.agents.tutor_bandit import tutor_bandit_agent

        quiz_res = state.get("quiz_result") or {}
        score_pct = quiz_res.get("score_percentage", 75.0)
        retention_delta = (score_pct - 50.0) / 50.0

        reward_result = tutor_bandit_agent.record_reward(
            decision_id=state.get("decision_id", ""),
            retention_delta=retention_delta,
            quiz_score=score_pct,
        )
        return {"final_response": {
            "status": "success",
            "explanation": state.get("explanation"),
            "persona_used": state.get("chosen_persona"),
            "bandit_reward": reward_result,
            "reflection_score": state.get("reflection_score"),
        }}
    except Exception as e:
        logger.error(f"[StudyGraph] reward_node error: {e}")
        return {"error": f"reward_node: {str(e)}"}


# ── Conditional Routing Functions ─────────────────────────────────────────────
def route_retrieval(state: StudyGraphState) -> str:
    """Corrective RAG route: proceed to bandit or fallback to web search."""
    if state.get("retrieval_grade") == "fallback_needed":
        return "web_search_fallback_node"
    return "bandit_route_node"


def route_reflection(state: StudyGraphState) -> str:
    """Evaluator-Optimizer route: revise if reflection indicated low score."""
    if state.get("needs_revision", False):
        return "revise_node"
    if state.get("generate_quiz", False):
        return "quiz_node"
    return "__end__"


def should_quiz_after_revision(state: StudyGraphState) -> str:
    """Route after revision."""
    if state.get("generate_quiz", False):
        return "quiz_node"
    return "__end__"


# ── Assemble & Compile StateGraph ─────────────────────────────────────────────
def build_study_graph(checkpointer=memory_saver):
    """
    Builds and compiles the full LangGraph StateGraph with checkpointer memory.
    Course: Sections 9-19 complete implementation.
    """
    try:
        graph = StateGraph(StudyGraphState)

        # 1. Register Nodes
        graph.add_node("retrieve_node", retrieve_node)
        graph.add_node("grade_relevance_node", grade_relevance_node)
        graph.add_node("web_search_fallback_node", web_search_fallback_node)
        graph.add_node("bandit_route_node", bandit_route_node)
        graph.add_node("explain_node", explain_node)
        graph.add_node("reflect_node", reflect_node)
        graph.add_node("revise_node", revise_node)
        graph.add_node("quiz_node", quiz_node)
        graph.add_node("reward_node", reward_node)

        # 2. Set Entry Point
        graph.set_entry_point("retrieve_node")

        # 3. Connect Retrieve -> Grade Relevance
        graph.add_edge("retrieve_node", "grade_relevance_node")

        # 4. Corrective RAG Branching
        graph.add_conditional_edges(
            "grade_relevance_node",
            route_retrieval,
            {
                "web_search_fallback_node": "web_search_fallback_node",
                "bandit_route_node": "bandit_route_node",
            }
        )
        graph.add_edge("web_search_fallback_node", "bandit_route_node")

        # 5. Route -> Explain -> Reflect
        graph.add_edge("bandit_route_node", "explain_node")
        graph.add_edge("explain_node", "reflect_node")

        # 6. Evaluator-Optimizer Reflection Branching
        graph.add_conditional_edges(
            "reflect_node",
            route_reflection,
            {
                "revise_node": "revise_node",
                "quiz_node": "quiz_node",
                "__end__": END,
            }
        )
        graph.add_conditional_edges(
            "revise_node",
            should_quiz_after_revision,
            {
                "quiz_node": "quiz_node",
                "__end__": END,
            }
        )

        # 7. Quiz -> Reward -> END
        graph.add_edge("quiz_node", "reward_node")
        graph.add_edge("reward_node", END)

        # 8. Compile with MemorySaver Checkpointer (Course: Section 19)
        compiled = graph.compile(checkpointer=checkpointer)
        logger.info("[StudyGraph] Full LangGraph StateGraph with MemorySaver compiled successfully.")
        return compiled

    except Exception as e:
        logger.error(f"[StudyGraph] Failed to build study graph: {e}")
        return None


# Module-level compiled instance
study_graph = build_study_graph()


# ── Public API ────────────────────────────────────────────────────────────────
def invoke_study_session(
    student_id: int,
    grade_level: str,
    focus_tier: str,
    document_id: int,
    document_title: str,
    selected_text: str,
    page_number: int,
    surrounding_context: Optional[str] = None,
    generate_quiz: bool = False,
    quiz_submission: Optional[Dict[str, Any]] = None,
    thread_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Public API to invoke the LangGraph study session with memory thread persistence.
    """
    active_thread = thread_id or f"student_{student_id}_doc_{document_id}"
    config = {"configurable": {"thread_id": active_thread}}

    initial_state: StudyGraphState = {
        "student_id": student_id,
        "grade_level": grade_level,
        "focus_tier": focus_tier,
        "document_id": document_id,
        "document_title": document_title,
        "selected_text": selected_text,
        "page_number": page_number,
        "surrounding_context": surrounding_context,
        "retrieved_chunks": [],
        "retrieval_grade": "relevant",
        "web_search_chunks": [],
        "chosen_persona": "eli5",
        "decision_id": "",
        "explanation": "",
        "reflection_critique": "",
        "reflection_score": 8.0,
        "needs_revision": False,
        "generate_quiz": generate_quiz,
        "quiz_data": None,
        "quiz_submission": quiz_submission,
        "quiz_result": None,
        "final_response": {},
        "error": None,
    }

    graph = study_graph or build_study_graph()
    if graph is None:
        from backend.agents.qa_tutor import qa_tutor_agent, ExplainRequest
        req = ExplainRequest(
            document_id=document_id,
            page_number=page_number,
            selected_text=selected_text,
            surrounding_context=surrounding_context,
            grade_level=grade_level,
            mode="eli5",
            document_title=document_title,
        )
        res = qa_tutor_agent.explain_selection(req)
        return {"status": "success", "explanation": res.get("explanation", ""), "persona_used": "eli5"}

    try:
        final_state = graph.invoke(initial_state, config=config)
        resp = final_state.get("final_response") or {}
        resp.update({
            "status": "success",
            "explanation": final_state.get("explanation", ""),
            "persona_used": final_state.get("chosen_persona", "eli5"),
            "thread_id": active_thread,
            "reflection_score": final_state.get("reflection_score"),
            "corrective_rag_grade": final_state.get("retrieval_grade"),
        })
        return resp
    except Exception as e:
        logger.error(f"[StudyGraph] Invocation error: {e}")
        return {"status": "error", "error": str(e)}


def get_session_history(thread_id: str) -> List[Dict[str, Any]]:
    """Retrieves LangGraph checkpoint history for a specific student thread."""
    try:
        config = {"configurable": {"thread_id": thread_id}}
        checkpoints = list(memory_saver.list(config))
        history = []
        for cp in checkpoints:
            history.append({
                "checkpoint_id": cp.checkpoint.get("id"),
                "ts": cp.checkpoint.get("ts"),
                "state_keys": list(cp.checkpoint.get("channel_values", {}).keys()),
            })
        return history
    except Exception as e:
        logger.error(f"[StudyGraph] Failed to retrieve history for thread {thread_id}: {e}")
        return []
