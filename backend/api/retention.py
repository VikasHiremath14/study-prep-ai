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


@router.get("/{student_id}/forgetting-curve")
def get_student_forgetting_curve(student_id: int, max_hours: float = 168.0, db: Session = Depends(get_db)):
    """Retrieves trained Half-Life Regression forgetting curve and empirical test data points for a student."""
    from backend.ml.half_life_regression import hlr_model
    from backend.db.models import QuizAttempt

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    profile = db.query(RetentionProfile).filter(RetentionProfile.student_id == student_id).first()
    
    # Extract features from profile or use baseline defaults
    sart = profile.sustained_focus_score if profile else 0.80
    wm = profile.distraction_recovery_score if profile else 0.75
    recall = profile.details.get("signals", {}).get("delayed_recall_retention", {}).get("score", 0.70) if profile and profile.details else 0.70
    dopamine = profile.reel_watch_score if profile else 0.70

    # Count prior quiz attempts
    attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).all()
    n_attempts = len(attempts)
    avg_score = (sum(a.score for a in attempts) / (100.0 * n_attempts)) if n_attempts > 0 else 0.75

    features = hlr_model.extract_features(
        sart_vigilance=sart,
        digit_span_wm=wm,
        delayed_recall_base=recall,
        dopamine_tolerance=dopamine,
        repetition_count=max(1, n_attempts),
        prior_quiz_accuracy=avg_score
    )

    predicted_half_life = hlr_model.predict_half_life(features)
    decay_curve = hlr_model.generate_decay_curve(features, max_hours=max_hours, num_points=40)

    # Format empirical quiz points for graph overlay
    quiz_points = []
    for i, att in enumerate(attempts):
        hours_elapsed = (i + 1) * 24.0  # approximate elapsed spacing
        quiz_points.append({
            "attempt_id": att.id,
            "hours_elapsed": hours_elapsed,
            "actual_score_percent": att.score,
            "actual_recall_prob": round(att.score / 100.0, 3)
        })

    return {
        "status": "success",
        "student_id": student.id,
        "student_name": student.name,
        "predicted_half_life_hours": predicted_half_life,
        "predicted_half_life_days": round(predicted_half_life / 24.0, 2),
        "recall_prob_24h": hlr_model.predict_recall_probability(features, 24.0),
        "recall_prob_48h": hlr_model.predict_recall_probability(features, 48.0),
        "recall_prob_7d": hlr_model.predict_recall_probability(features, 168.0),
        "decay_curve": decay_curve,
        "empirical_quiz_points": quiz_points,
        "ml_model_info": {
            "technique": "Duolingo Half-Life Regression (Settles & Meeder 2016)",
            "metrics": hlr_model.last_metrics,
            "features_used": hlr_model.FEATURE_NAMES
        }
    }


@router.get("/ml/diagnostics")
def get_ml_diagnostics():
    """Returns Machine Learning validation metrics, loss history, and learned parameter weights."""
    from backend.ml.half_life_regression import hlr_model

    return {
        "status": "success",
        "model_name": "Duolingo Half-Life Regression (HLR)",
        "scientific_citation": "Settles, B., & Meeder, B. (ACL 2016). 'A Trainable Spaced Repetition Model for Language Learning.'",
        "mathematical_formula": "p_hat = 2^(-Delta_t / 2^(theta^T * x))",
        "loss_function": "Regularized L2 Loss with Adam Optimizer",
        "metrics": hlr_model.last_metrics,
        "learned_weights": {name: round(float(w), 4) for name, w in zip(hlr_model.FEATURE_NAMES, hlr_model.theta)},
        "training_epochs": len(hlr_model.training_history),
        "recent_loss_history": hlr_model.training_history[-20:]
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
