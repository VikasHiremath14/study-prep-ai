"""Unit tests for Contextual Bandit Tutor Agent and Reinforcement Learning Closed Loop."""
import pytest
from backend.agents.tutor_bandit import ContextualBanditTutorAgent, PersonaAction


def test_bandit_action_selection_and_ucb():
    """Verifies that the bandit agent initializes optimistic priors and computes UCB values."""
    agent = ContextualBanditTutorAgent(ucb_c=1.414)
    decision = agent.select_persona(
        student_id=1,
        grade_level="engineering",
        focus_tier="Deep Focus Master",
        concept_difficulty="hard"
    )

    assert decision["status"] == "success"
    assert decision["recommended_persona"] in PersonaAction.ALL_ACTIONS
    assert "decision_id" in decision
    assert "estimated_retention_uplift" in decision
    assert len(decision["ucb_scores"]) == 4


def test_bandit_reward_learning_loop():
    """Verifies that positive rewards adjust action Q-values and cumulative rewards."""
    agent = ContextualBanditTutorAgent(alpha=0.20)
    decision = agent.select_persona(
        student_id=2,
        grade_level="10th",
        focus_tier="Sprint Pacing Rhythm",
        concept_difficulty="medium"
    )
    chosen = decision["recommended_persona"]
    context = decision["context"]
    old_q = agent.q_values[context][chosen]

    # Large post quiz score improvement (delta = 0.80 -> reward = 0.86)
    update_res = agent.update_reward(
        decision_id=decision["decision_id"],
        pre_quiz_score=0.20,
        post_quiz_score=1.0
    )

    assert update_res["status"] == "reward_updated"
    assert update_res["reward_signal"] > 0.50
    assert agent.q_values[context][chosen] >= old_q
    assert agent.total_cumulative_reward > 0


def test_bandit_analytics_and_statistics():
    """Verifies export of persona performance statistics and win-rates."""
    agent = ContextualBanditTutorAgent()
    for _ in range(5):
        d = agent.select_persona()
        agent.update_reward(decision_id=d["decision_id"], pre_quiz_score=0.5, post_quiz_score=0.8)

    stats = agent.get_bandit_analytics()
    assert stats["status"] == "success"
    assert stats["total_decisions"] >= 5
    assert len(stats["persona_performance"]) == 4
    assert len(stats["recent_decisions"]) >= 5


def test_agentic_explain_and_feedback_api(client):
    """Verifies POST /api/reader/agentic-explain, GET /api/reader/bandit-stats, and POST /api/quiz/bandit-feedback endpoints."""
    # Test agentic explain
    explain_res = client.post("/api/reader/agentic-explain", json={
        "document_id": 1,
        "page_number": 1,
        "selected_text": "Time complexity of balanced binary search tree operations is O(log n).",
        "grade_level": "engineering",
        "concept_difficulty": "hard",
        "student_id": 1
    })
    assert explain_res.status_code == 200
    explain_data = explain_res.json()
    assert explain_data.get("agentic_mode") is True
    assert "bandit_decision" in explain_data
    assert "recommended_persona" in explain_data["bandit_decision"]
    decision_id = explain_data["bandit_decision"].get("decision_id")

    # Test bandit stats endpoint
    stats_res = client.get("/api/reader/bandit-stats")
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert "persona_performance" in stats_data

    # Test explicit bandit feedback endpoint
    if decision_id:
        fb_res = client.post(f"/api/quiz/bandit-feedback?decision_id={decision_id}&pre_score=0.5&post_score=0.9")
        assert fb_res.status_code == 200
        fb_data = fb_res.json()
        assert fb_data["status"] == "reward_updated"
