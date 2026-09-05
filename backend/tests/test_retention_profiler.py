import pytest
from backend.agents.retention_profiler import (
    RetentionProfilingPayload,
    SeriesItem,
    ReelClipWatch,
    FocusTaskSubmission,
    DistractionTestResult,
    SelfReportData,
    retention_profiler_agent
)


def test_high_focus_vs_low_focus_scoring():
    """Validates that the scoring function clearly differentiates high vs low retention behaviors."""
    
    # 1. High-Focus Synthetic Profile
    high_payload = RetentionProfilingPayload(
        student_name="Aarav Sharma",
        grade_level="engineering",
        series_habits=[
            SeriesItem(title="Breaking Bad", status="completed"),
            SeriesItem(title="Dark", status="completed"),
            SeriesItem(title="Chernobyl", status="completed")
        ],
        reel_watches=[
            ReelClipWatch(clip_id="c1", title="Memory Hack", clip_type="short", duration_seconds=15, watched_seconds=15, completion_status="full"),
            ReelClipWatch(clip_id="c2", title="Transformer Attention", clip_type="medium", duration_seconds=30, watched_seconds=30, completion_status="full"),
            ReelClipWatch(clip_id="c3", title="Distributed Consensus", clip_type="long", duration_seconds=60, watched_seconds=58, completion_status="full")
        ],
        youtube_watch={"video_id": "yt1", "duration_seconds": 180, "watched_seconds": 180, "status": "full", "tab_switches_during_video": 0},
        focus_task=FocusTaskSubmission(
            total_time_seconds=320,
            tab_switch_count=0,
            unfocused_duration_seconds=0,
            answered_correctly=2,
            total_questions=2
        ),
        distraction_test=DistractionTestResult(
            reaction_delay_seconds=2.0  # Fast recovery
        ),
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
        series_habits=[
            SeriesItem(title="Stranger Things", status="dropped"),
            SeriesItem(title="One Piece", status="dropped"),
            SeriesItem(title="Lupin", status="dropped")
        ],
        reel_watches=[
            ReelClipWatch(clip_id="c1", title="Memory Hack", clip_type="short", duration_seconds=15, watched_seconds=3, completion_status="dropped", skipped=True),
            ReelClipWatch(clip_id="c2", title="Transformer Attention", clip_type="medium", duration_seconds=30, watched_seconds=6, completion_status="dropped", skipped=True),
            ReelClipWatch(clip_id="c3", title="Distributed Consensus", clip_type="long", duration_seconds=60, watched_seconds=10, completion_status="dropped", skipped=True)
        ],
        youtube_watch={"video_id": "yt1", "duration_seconds": 180, "watched_seconds": 25, "status": "dropped", "tab_switches_during_video": 3},
        focus_task=FocusTaskSubmission(
            total_time_seconds=120,
            tab_switch_count=4,  # Frequent tab switching
            unfocused_duration_seconds=45.0,
            answered_correctly=0,
            total_questions=2
        ),
        distraction_test=DistractionTestResult(
            reaction_delay_seconds=35.0  # Lingered on distraction
        ),
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

    # Clear separation
    assert high_result["retention_score"] - low_result["retention_score"] > 0.45


def test_student_onboarding_api_flow(client):
    """Tests end-to-end API onboarding flow, database storage, and retrieval."""
    payload = {
        "student_name": "Priya Patel",
        "grade_level": "12th",
        "series_habits": [
            {"title": "Money Heist", "status": "completed"},
            {"title": "Friends", "status": "partially_completed"}
        ],
        "reel_watches": [
            {"clip_id": "c1", "title": "Memory Hack", "clip_type": "short", "duration_seconds": 15, "watched_seconds": 14, "completion_status": "full", "skipped": False},
            {"clip_id": "c2", "title": "Transformer Attention", "clip_type": "medium", "duration_seconds": 30, "watched_seconds": 16, "completion_status": "halfway", "skipped": False}
        ],
        "youtube_watch": {
            "video_id": "yt1",
            "video_title": "How Memory and Attention Work in Learning",
            "duration_seconds": 180,
            "watched_seconds": 140,
            "tab_switches_during_video": 1,
            "completed_ratio": 0.77,
            "status": "halfway"
        },
        "focus_task": {
            "passage_id": "quantum_computing_intro",
            "total_time_seconds": 260,
            "tab_switch_count": 1,
            "unfocused_duration_seconds": 4.0,
            "answered_correctly": 2,
            "total_questions": 2
        },
        "distraction_test": {
            "distraction_type": "urgent_notification",
            "reaction_delay_seconds": 5.0
        },
        "self_report": {
            "longest_session_minutes": 50,
            "typical_break_frequency_minutes": 45,
            "preferred_study_time": "evening"
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
