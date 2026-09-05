from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.db.session import get_db
from backend.db.models import Student, Schedule, Backlog
from backend.agents.scheduler import (
    TimetableCalibrationRequest,
    RawScheduleDiagnosisRequest,
    scheduler_agent
)

router = APIRouter(prefix="/scheduler", tags=["Timetable & Scheduling"])


class CalendarExportRequest(BaseModel):
    student_name: str = "Student"
    slots: List[Dict[str, Any]]


class SlotProgressRequest(BaseModel):
    student_id: Optional[int] = None
    slot_id: str
    status: str  # "completed", "skipped", "in_progress"
    reason: Optional[str] = None
    slot_info: Dict[str, Any]


@router.post("/calibrate")
def calibrate_timetable(payload: TimetableCalibrationRequest, db: Session = Depends(get_db)):
    """Runs the Timetable Correction Agent to generate an optimal, retention-calibrated schedule."""
    result = scheduler_agent.run(payload)

    # If student_id is provided, save to database
    if payload.student_id:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
        if student:
            schedule = Schedule(
                student_id=student.id,
                wake_time=payload.wake_time,
                total_study_hours=result["actual_scheduled_study_hours"],
                slots=result["slots"],
                corrections_made=result["corrections_made"]
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)
            result["schedule_id"] = schedule.id

    return result


@router.post("/diagnose-raw")
def diagnose_raw_schedule(payload: RawScheduleDiagnosisRequest, db: Session = Depends(get_db)):
    """Audits a raw student schedule, detects cognitive burnout violations, and generates a calibrated fix."""
    result = scheduler_agent.diagnose_raw_schedule(payload)

    if payload.student_id and "calibrated_schedule" in result:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
        if student:
            calib = result["calibrated_schedule"]
            schedule = Schedule(
                student_id=student.id,
                wake_time=payload.wake_time,
                total_study_hours=calib["actual_scheduled_study_hours"],
                slots=calib["slots"],
                corrections_made=calib["corrections_made"]
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)
            result["calibrated_schedule"]["schedule_id"] = schedule.id

    return result


@router.post("/export-ics")
def export_ics(payload: CalendarExportRequest):
    """Generates an RFC 5545 standard .ics calendar file for the schedule slots."""
    ics_text = scheduler_agent.generate_ics_calendar(payload.slots, student_name=payload.student_name)
    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename=study_schedule_{payload.student_name.lower().replace(' ', '_')}.ics"
        }
    )


@router.post("/slot-progress")
def log_slot_progress(payload: SlotProgressRequest, db: Session = Depends(get_db)):
    """Logs completion or pushes a missed slot into the adaptive backlog queue."""
    if payload.student_id and payload.status == "skipped":
        backlog_entry = Backlog(
            student_id=payload.student_id,
            slot_info=payload.slot_info,
            reason=payload.reason or "Missed during scheduled time window",
            resolved=False
        )
        db.add(backlog_entry)
        db.commit()
        return {"status": "logged_to_backlog", "backlog_id": backlog_entry.id}

    return {"status": "progress_updated", "slot_id": payload.slot_id, "new_status": payload.status}


@router.get("/{student_id}")
def get_student_schedule(student_id: int, db: Session = Depends(get_db)):
    """Retrieves the latest calibrated timetable for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    schedule = (
        db.query(Schedule)
        .filter(Schedule.student_id == student_id)
        .order_by(Schedule.created_at.desc())
        .first()
    )
    if not schedule:
        # Fallback: Auto-generate based on student's retention profile
        profile = student.retention_profile
        break_mins = profile.break_interval_minutes if profile else 45
        req = TimetableCalibrationRequest(
            student_id=student.id,
            student_name=student.name,
            grade_level=student.grade_level,
            break_interval_minutes=break_mins,
            retention_score=profile.retention_score if profile else 0.7
        )
        return scheduler_agent.run(req)

    return {
        "status": "success",
        "student_id": student.id,
        "student_name": student.name,
        "grade_level": student.grade_level,
        "total_study_hours": schedule.total_study_hours,
        "slots": schedule.slots,
        "corrections_made": schedule.corrections_made,
        "created_at": schedule.created_at.isoformat() if schedule.created_at else None
    }
