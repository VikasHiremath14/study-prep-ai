from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import Student, RetentionProfile
from backend.agents.retention_profiler import (
    RetentionProfilingPayload,
    retention_profiler_agent
)

router = APIRouter(prefix="/students", tags=["Students & Retention"])


@router.post("/onboard")
def onboard_student(payload: RetentionProfilingPayload, db: Session = Depends(get_db)):
    """Runs the SART + Digit Span + Delayed Recall + Reels retention profiler and stores student profile."""
    # 1. Look up existing student or create new student record
    student = None
    if payload.student_id:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student and payload.user_id:
        student = db.query(Student).filter(Student.user_id == payload.user_id).first()
    if not student and payload.student_name:
        student = db.query(Student).filter(Student.name == payload.student_name).first()

    if not student:
        student = Student(
            user_id=payload.user_id,
            name=payload.student_name,
            grade_level=payload.grade_level,
            wake_time=payload.wake_time if hasattr(payload, 'wake_time') and payload.wake_time else "06:30",
            sleep_time=payload.sleep_time if hasattr(payload, 'sleep_time') and payload.sleep_time else "23:30"
        )
        db.add(student)
        db.flush()  # obtain student.id
    else:
        if payload.user_id and not student.user_id:
            student.user_id = payload.user_id
        student.name = payload.student_name
        student.grade_level = payload.grade_level
        if hasattr(payload, 'wake_time') and payload.wake_time:
            student.wake_time = payload.wake_time
        if hasattr(payload, 'sleep_time') and payload.sleep_time:
            student.sleep_time = payload.sleep_time


    # 2. Run Retention Profiling Agent
    profile_result = retention_profiler_agent.run(payload)

    # 3. Store or update retention_profiles table
    retention_profile = db.query(RetentionProfile).filter(RetentionProfile.student_id == student.id).first()
    if not retention_profile:
        retention_profile = RetentionProfile(
            student_id=student.id,
            retention_score=profile_result["retention_score"],
            break_interval_minutes=profile_result["break_interval_minutes"],
            series_completion_score=profile_result["signals"]["series_completion_habit"]["score"],
            reel_watch_score=profile_result["signals"]["instagram_reels_tolerance"]["score"],
            sustained_focus_score=profile_result["signals"]["sart_vigilance"]["score"],
            self_report_score=profile_result["signals"]["self_reported_baseline"]["score"],
            distraction_recovery_score=profile_result["signals"]["digit_span_working_memory"]["score"],
            details=profile_result
        )
        db.add(retention_profile)
    else:
        retention_profile.retention_score = profile_result["retention_score"]
        retention_profile.break_interval_minutes = profile_result["break_interval_minutes"]
        retention_profile.series_completion_score = profile_result["signals"]["series_completion_habit"]["score"]
        retention_profile.reel_watch_score = profile_result["signals"]["instagram_reels_tolerance"]["score"]
        retention_profile.sustained_focus_score = profile_result["signals"]["sart_vigilance"]["score"]
        retention_profile.self_report_score = profile_result["signals"]["self_reported_baseline"]["score"]
        retention_profile.distraction_recovery_score = profile_result["signals"]["digit_span_working_memory"]["score"]
        retention_profile.details = profile_result

    db.commit()
    db.refresh(student)
    db.refresh(retention_profile)

    return {
        "status": "success",
        "student_id": student.id,
        "name": student.name,
        "grade_level": student.grade_level,
        "profile": profile_result
    }


@router.get("/{student_id}/retention-profile")
def get_student_retention_profile(student_id: int, db: Session = Depends(get_db)):
    """Retrieves an existing student's retention profile."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(RetentionProfile).filter(RetentionProfile.student_id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Retention profile not found for this student")

    return {
        "student_id": student.id,
        "name": student.name,
        "grade_level": student.grade_level,
        "retention_score": profile.retention_score,
        "break_interval_minutes": profile.break_interval_minutes,
        "details": profile.details,
        "created_at": profile.created_at.isoformat() if profile.created_at else None
    }


@router.get("")
def list_students(db: Session = Depends(get_db)):
    """Lists all registered students with summary retention scores."""
    students = db.query(Student).all()
    results = []
    for s in students:
        score = s.retention_profile.retention_score if s.retention_profile else None
        interval = s.retention_profile.break_interval_minutes if s.retention_profile else None
        results.append({
            "id": s.id,
            "name": s.name,
            "grade_level": s.grade_level,
            "retention_score": score,
            "break_interval_minutes": interval,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return results
