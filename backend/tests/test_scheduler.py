import pytest
from backend.agents.scheduler import (
    TimetableCalibrationRequest,
    RawScheduleDiagnosisRequest,
    RawScheduleBlock,
    BusySlotItem,
    SubjectItem,
    scheduler_agent
)


def test_scheduler_agent_calibration():
    """Validates that the scheduler applies post-wake buffers, retention pacing, and block slicing."""
    # 1. High retention (0.80) -> 60m focus blocks
    req_high = TimetableCalibrationRequest(
        student_name="Vikash Sharma",
        grade_level="engineering",
        wake_time="06:30",
        sleep_time="23:30",
        target_study_hours=6.0,
        retention_score=0.80,
        busy_slots=[
            BusySlotItem(title="College Lectures", start_time="10:00", end_time="12:30", category="college")
        ],
        subjects=[
            SubjectItem(name="Advanced Mathematics", difficulty="hard", allocated_hours=2.0),
            SubjectItem(name="Operating Systems", difficulty="medium", allocated_hours=2.0),
            SubjectItem(name="English Communication", difficulty="light", allocated_hours=2.0)
        ]
    )

    result = scheduler_agent.run(req_high)
    assert result["status"] == "success"
    assert result["focus_block_minutes"] in [60, 70]
    assert len(result["slots"]) >= 6

    # Check that first study slot is after 45m wake buffer (07:15)
    first_slot = result["slots"][0]
    assert first_slot["type"] == "routine"
    assert first_slot["start"] == "06:30"
    assert first_slot["end"] == "07:15"

    # Check that busy college window is present
    assert any(s["type"] == "work" and "College" in s["title"] for s in result["slots"])

    # Check that meals (lunch or snack) are present
    assert any(s["type"] == "meal" for s in result["slots"])

    # 2. Medium retention (0.60) -> 45-50m focus blocks
    req_med = TimetableCalibrationRequest(
        student_name="Priya",
        grade_level="12th",
        wake_time="07:00",
        sleep_time="23:00",
        target_study_hours=4.5,
        retention_score=0.60
    )
    result_med = scheduler_agent.run(req_med)
    assert result_med["focus_block_minutes"] in [45, 50]


def test_diagnose_raw_schedule():
    """Validates delusion detection: continuous blocks, night cramming, sleep debt, and citations."""
    req = RawScheduleDiagnosisRequest(
        student_name="Ambitious Student",
        grade_level="engineering",
        wake_time="06:00",
        sleep_time="01:30",  # Only 4.5 hours sleep -> severe sleep debt
        break_interval_minutes=30,
        raw_blocks=[
            RawScheduleBlock(start_time="08:00", end_time="12:00", subject="Calculus", difficulty="hard"),  # 4h continuous -> overload
            RawScheduleBlock(start_time="13:00", end_time="18:00", subject="Algorithms", difficulty="hard"),  # 5h continuous -> overload
            RawScheduleBlock(start_time="23:30", end_time="02:00", subject="Late Night Cram", difficulty="hard")  # Night cramming
        ]
    )

    audit = scheduler_agent.diagnose_raw_schedule(req)
    assert audit["status"] == "success"
    assert audit["delusion_risk_score"] > 60.0
    assert audit["violations_count"] >= 3
    assert len(audit["violations"]) >= 3

    # Check for specific scientific citations
    citations = [v.get("citation", "") for v in audit["violations"]]
    assert any("Walker" in c or "Sweller" in c or "Gazzaley" in c for c in citations)

    # Check that an auto-calibrated schedule is returned
    assert "calibrated_schedule" in audit
    assert len(audit["calibrated_schedule"]["slots"]) > 0


def test_generate_ics_calendar():
    """Validates RFC 5545 iCalendar format generation."""
    slots = [
        {"start": "08:00", "end": "08:45", "type": "study", "title": "Maths Focus", "description": "Focus block"},
        {"start": "08:45", "end": "08:55", "type": "break", "title": "Break", "description": "Hydrate"}
    ]
    ics_str = scheduler_agent.generate_ics_calendar(slots, student_name="Vikash")
    assert "BEGIN:VCALENDAR" in ics_str
    assert "END:VCALENDAR" in ics_str
    assert "BEGIN:VEVENT" in ics_str
    assert "SUMMARY:Maths Focus" in ics_str
    assert "BEGIN:VALARM" in ics_str


def test_scheduler_api_endpoints(client):
    """Tests /api/scheduler/calibrate, /api/scheduler/diagnose-raw, and /api/scheduler/export-ics endpoints."""
    calib_payload = {
        "student_name": "Test Student",
        "grade_level": "12th",
        "wake_time": "07:00",
        "sleep_time": "23:00",
        "target_study_hours": 5.0,
        "retention_score": 0.80,
        "busy_slots": [
            {"title": "College", "start_time": "11:00", "end_time": "13:00", "category": "college"}
        ],
        "subjects": [
            {"name": "Physics", "difficulty": "hard", "allocated_hours": 2.0},
            {"name": "Chemistry", "difficulty": "medium", "allocated_hours": 1.5}
        ]
    }

    res = client.post("/api/scheduler/calibrate", json=calib_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "slots" in data
    assert "ai_rationale" in data

    # Test export-ics
    export_payload = {
        "student_name": "Test Student",
        "slots": data["slots"]
    }
    res_ics = client.post("/api/scheduler/export-ics", json=export_payload)
    assert res_ics.status_code == 200
    assert "text/calendar" in res_ics.headers.get("content-type", "")
    assert "BEGIN:VCALENDAR" in res_ics.text
