"""Tests for Active Document Reader & Grounded Line-Level QA Tutor (Phase 4 & 5)."""
import pytest
from backend.agents.qa_tutor import qa_tutor_agent, ExplainRequest, AskDoubtRequest


def test_qa_tutor_explain_selection_modes():
    """Verify QA tutor produces calibrated explanations for different pedagogical modes."""
    req_eli5 = ExplainRequest(
        document_id=1,
        page_number=1,
        selected_text="Big-O defines the upper bound of algorithm growth.",
        grade_level="10th",
        mode="eli5",
        document_title="DSA Core"
    )
    res_eli5 = qa_tutor_agent.explain_selection(req_eli5)
    assert res_eli5["status"] == "success"
    assert "explanation" in res_eli5
    assert len(res_eli5["explanation"]) > 20

    req_deep = ExplainRequest(
        document_id=1,
        page_number=5,
        selected_text="AVL trees maintain balance factors between -1 and +1 through rotations.",
        grade_level="engineering",
        mode="deep_dive",
        document_title="DSA Core"
    )
    res_deep = qa_tutor_agent.explain_selection(req_deep)
    assert res_deep["status"] == "success"
    assert res_deep["mode"] == "deep_dive"


def test_qa_tutor_resolve_doubt():
    """Verify QA tutor answers student doubt questions with high confidence."""
    req_doubt = AskDoubtRequest(
        document_id=1,
        page_number=11,
        selected_text="Dijkstra's algorithm computes single-source shortest paths in O((V + E) log V).",
        question="Why doesn't Dijkstra work with negative edge weights?",
        grade_level="engineering",
        document_title="DSA Core"
    )
    res_doubt = qa_tutor_agent.resolve_doubt(req_doubt)
    assert res_doubt["status"] == "success"
    assert "answer" in res_doubt
    assert res_doubt["confidence_score"] > 0.8


def test_reader_api_explain_endpoint(client):
    """Verify POST /api/reader/explain generates response via REST."""
    payload = {
        "document_id": 1,
        "page_number": 2,
        "selected_text": "Dynamic arrays double in size when capacity is reached.",
        "grade_level": "engineering",
        "mode": "eli5",
        "document_title": "DSA Core Curriculum"
    }
    res = client.post("/api/reader/explain", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "explanation" in data


def test_reader_api_ask_doubt_endpoint(client):
    """Verify POST /api/reader/ask-doubt resolves question via REST."""
    payload = {
        "document_id": 1,
        "page_number": 3,
        "selected_text": "Singly linked lists provide O(1) head insertion.",
        "question": "What happens if we need to insert at the tail without a tail pointer?",
        "grade_level": "12th",
        "document_title": "Data Structures"
    }
    res = client.post("/api/reader/ask-doubt", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "answer" in data


def test_reader_api_notes_and_bookmarks(client):
    """Verify note creation, retrieval, and bookmark toggling."""
    note_payload = {
        "student_id": 1,
        "document_id": 1,
        "page_number": 5,
        "selected_text": "AVL tree rotations",
        "note_text": "Remember: Left-Right rotation requires 2 steps.",
        "is_bookmark": False,
        "color_tag": "emerald"
    }
    res_note = client.post("/api/reader/notes", json=note_payload)
    assert res_note.status_code == 200
    assert res_note.json()["status"] == "success"

    bm_payload = {
        "student_id": 1,
        "document_id": 1,
        "page_number": 5
    }
    res_bm = client.post("/api/reader/bookmark", json=bm_payload)
    assert res_bm.status_code == 200
    assert res_bm.json()["status"] == "success"

    res_list = client.get("/api/reader/notes/1")
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["status"] == "success"
    assert isinstance(data["notes"], list)
    assert isinstance(data["doubts"], list)
