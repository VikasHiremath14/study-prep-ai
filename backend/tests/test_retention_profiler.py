import pytest
from backend.agents.retention_profiler import (
    RetentionProfilingPayload,
    SARTTestResult,
    DigitSpanTestResult,
    DelayedRecallTestResult,
    ReelClipWatch,
    SeriesItem,
    SelfReportData,
    retention_profiler_agent
)


def test_high_focus_vs_low_focus_scoring():
    """Validates that SART, Digit Span, Delayed Recall, and Reels clearly differentiate focus levels."""
    
    # 1. High-Focus Synthetic Profile
    high_payload = RetentionProfilingPayload(
        student_name="Aarav Sharma",
        grade_level="engineering",
        sart_test=SARTTestResult(
            total_trials=18,
            commission_errors=0,
            omission_errors=0,
            average_reaction_time_ms=420.0
        ),
        digit_span_test=DigitSpanTestResult(
            max_span_capacity=8,
            working_memory_score=1.0
        ),
        delayed_recall_test=DelayedRecallTestResult(
            total_target_words=8,
            correct_recalled_count=8,
            recall_score=1.0
        ),
        reel_watches=[
            ReelClipWatch(clip_id="c1", title="Memory Hack", clip_type="short", duration_seconds=15, watched_seconds=15, completion_status="full"),
            ReelClipWatch(clip_id="c2", title="Transformer Attention", clip_type="medium", duration_seconds=30, watched_seconds=30, completion_status="full"),
            ReelClipWatch(clip_id="c3", title="Distributed Consensus", clip_type="long", duration_seconds=45, watched_seconds=45, completion_status="full")
        ],
        series_habits=[
            SeriesItem(title="Cosmos", status="completed"),
            SeriesItem(title="Dark", status="completed")
        ],
        self_report=SelfReportData(
            longest_session_minutes=90,
            typical_break_frequency_minutes=60,
            preferred_study_time="morning"
        )
    )

    high_result = retention_profiler_agent.run(high_payload)
    assert high_result["retention_score"] >= 0.80, f"Expected >= 0.80, got {high_result['retention_score']}"
    assert high_result["break_interval_minutes"] == 60
    assert high_result["focus_tier"] == "Deep Focus Master"

    # 2. Low-Focus / Distracted Synthetic Profile
    low_payload = RetentionProfilingPayload(
        student_name="Rahul V",
        grade_level="10th",
        sart_test=SARTTestResult(
            total_trials=18,
            commission_errors=4,  # Failed all No-Go 3s
            omission_errors=6,    # Missed many Go targets
            average_reaction_time_ms=680.0
        ),
        digit_span_test=DigitSpanTestResult(
            max_span_capacity=3,
            working_memory_score=0.20
        ),
        delayed_recall_test=DelayedRecallTestResult(
            total_target_words=8,
            correct_recalled_count=1,
            recall_score=0.125
        ),
        reel_watches=[
            ReelClipWatch(clip_id="c1", title="Memory Hack", clip_type="short", duration_seconds=15, watched_seconds=3, completion_status="dropped", skipped=True),
            ReelClipWatch(clip_id="c2", title="Transformer Attention", clip_type="medium", duration_seconds=30, watched_seconds=5, completion_status="dropped", skipped=True)
        ],
        series_habits=[
            SeriesItem(title="Stranger Things", status="dropped")
        ],
        self_report=SelfReportData(
            longest_session_minutes=20,
            typical_break_frequency_minutes=15,
            preferred_study_time="night"
        )
    )

    low_result = retention_profiler_agent.run(low_payload)
    assert low_result["retention_score"] < 0.40, f"Expected < 0.40, got {low_result['retention_score']}"
    assert low_result["break_interval_minutes"] == 20
    assert low_result["focus_tier"] == "Micro-Focus Recovery"

    # Clear empirical separation
    assert high_result["retention_score"] - low_result["retention_score"] > 0.45


def test_student_onboarding_api_flow(client):
    """Tests end-to-end API onboarding flow, database storage, and retrieval."""
    payload = {
        "student_name": "Priya Patel",
        "grade_level": "12th",
        "sart_test": {
            "total_trials": 18,
            "commission_errors": 0,
            "omission_errors": 1,
            "no_go_count": 4,
            "go_count": 14,
            "average_reaction_time_ms": 410.0,
            "sart_score": 0.95
        },
        "digit_span_test": {
            "max_span_capacity": 7,
            "working_memory_score": 0.85,
            "levels_attempted": 5
        },
        "delayed_recall_test": {
            "total_target_words": 8,
            "correct_recalled_count": 7,
            "intrusions_count": 0,
            "recall_score": 0.875
        },
        "reel_watches": [
            {"clip_id": "c1", "title": "Memory Hack", "clip_type": "short", "duration_seconds": 15, "watched_seconds": 15, "completion_status": "full", "skipped": False},
            {"clip_id": "c2", "title": "Transformer Attention", "clip_type": "medium", "duration_seconds": 30, "watched_seconds": 25, "completion_status": "halfway", "skipped": False}
        ],
        "series_habits": [
            {"title": "Money Heist", "status": "completed"}
        ],
        "self_report": {
            "longest_session_minutes": 60,
            "typical_break_frequency_minutes": 45,
            "preferred_study_time": "morning"
        }
    }

    # 1. Post to onboarding endpoint
    response = client.post("/api/students/onboard", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    student_id = data["student_id"]
    assert student_id > 0
    assert data["name"] == "Priya Patel"
    assert "profile" in data
    assert 0.0 <= data["profile"]["retention_score"] <= 1.0

    # 2. Fetch student retention profile by ID
    get_res = client.get(f"/api/students/{student_id}/retention-profile")
    assert get_res.status_code == 200
    profile_data = get_res.json()
    assert profile_data["student_id"] == student_id
    assert profile_data["name"] == "Priya Patel"
    assert profile_data["grade_level"] == "12th"
    assert profile_data["break_interval_minutes"] in [20, 30, 45, 60]
    assert "signals" in profile_data["details"]

    # 3. List students endpoint
    list_res = client.get("/api/students")
    assert list_res.status_code == 200
    students_list = list_res.json()
    assert len(students_list) >= 1
    assert any(s["id"] == student_id for s in students_list)
