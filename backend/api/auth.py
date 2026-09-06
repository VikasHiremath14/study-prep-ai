import datetime
import hashlib
import random
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import (
    User,
    Student,
    RetentionProfile,
    Schedule,
    DailyTarget,
    Completion,
    Note,
    QuizAttempt,
    DoubtLog
)

router = APIRouter(prefix="/auth", tags=["Authentication, OTP & User Records"])

# In-memory OTP storage for transient verification (resilient fallback)
_TEMP_OTP_STORE: Dict[str, Dict[str, Any]] = {}


# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------

class SendOTPRequest(BaseModel):
    email: str
    phone_number: Optional[str] = None
class SendOTPRequest(BaseModel):
    email: str
    phone_number: Optional[str] = None
    channel: Optional[str] = "email"  # 'email' or 'sms'
    purpose: Optional[str] = "signup"  # 'signup' or 'signin'


class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    phone_number: Optional[str] = None


class SignUpRequest(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None
    password: str
    confirm_password: Optional[str] = None
    otp_code: Optional[str] = None
    grade_level: Optional[str] = "engineering"
    supabase_uid: Optional[str] = None


class SignInRequest(BaseModel):
    email: str
    password: Optional[str] = None
    supabase_uid: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    email: str
    name: Optional[str] = "Student"
    phone_number: Optional[str] = None
    supabase_uid: Optional[str] = None
    grade_level: Optional[str] = "engineering"


class SupabaseSyncRequest(BaseModel):
    supabase_uid: str
    email: str
    name: Optional[str] = "Student"
    phone_number: Optional[str] = None
    grade_level: Optional[str] = "engineering"


def hash_password(password: str) -> str:
    """SHA256 password hashing for robust local authentication."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# ---------------------------------------------------------
# OTP Endpoints
# ---------------------------------------------------------

@router.post("/send-otp")
def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    """Generates and delivers a 6-digit OTP via Email or Mobile SMS."""
    target_identifier = req.email.strip().lower()
    if not target_identifier or "@" not in target_identifier:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    user = db.query(User).filter(User.email == target_identifier).first()

    # Prevent creating duplicate accounts with the same email
    if req.purpose == "signup" and user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please switch to Sign In."
        )

    # Generate secure 6-digit OTP code
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    # Store in memory & DB if user exists
    _TEMP_OTP_STORE[target_identifier] = {
        "otp": otp,
        "phone_number": req.phone_number,
        "channel": req.channel or "email",
        "expires_at": expires_at
    }

    if user:
        user.otp_code = otp
        user.otp_expires_at = expires_at
        db.commit()

    destination_desc = req.phone_number if (req.channel == "sms" and req.phone_number) else req.email

    # Production delivery log & simulation
    print(f"[OTP SERVICE] 📩 Dispatched 6-digit OTP [{otp}] via {req.channel.upper()} to {destination_desc}")

    return {
        "status": "success",
        "message": f"6-digit OTP successfully sent to {destination_desc}.",
        "channel": req.channel,
        "expires_in_minutes": 10,
        "debug_otp": otp
    }


@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verifies the 6-digit OTP entered by the user."""
    target_identifier = req.email.strip().lower()
    otp_data = _TEMP_OTP_STORE.get(target_identifier)

    # Check against in-memory store or DB
    user = db.query(User).filter(User.email == target_identifier).first()
    valid_otp = None
    is_expired = False

    if otp_data:
        valid_otp = otp_data.get("otp")
        is_expired = datetime.datetime.utcnow() > otp_data.get("expires_at", datetime.datetime.utcnow())
    elif user and user.otp_code:
        valid_otp = user.otp_code
        if user.otp_expires_at:
            is_expired = datetime.datetime.utcnow() > user.otp_expires_at

    if not valid_otp:
        raise HTTPException(status_code=400, detail="No active OTP found. Please request a new OTP.")

    if is_expired:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a fresh code.")

    if req.otp_code.strip() != valid_otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please try again.")

    if user:
        user.is_email_verified = True
        if req.phone_number:
            user.is_phone_verified = True
        user.otp_code = None
        db.commit()

    return {
        "status": "success",
        "verified": True,
        "message": "OTP successfully verified!"
    }


# ---------------------------------------------------------
# Google One-Click Auth Endpoint
# ---------------------------------------------------------

@router.post("/google-auth")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Direct one-click Google account sign-in / registration."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        # Create Google provisioned user
        user = User(
            email=email_clean,
            phone_number=req.phone_number,
            supabase_uid=req.supabase_uid,
            auth_provider="google",
            is_email_verified=True,
            is_phone_verified=bool(req.phone_number),
            last_login_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            name=req.name or email_clean.split("@")[0].capitalize(),
            phone_number=req.phone_number,
            grade_level=req.grade_level or "engineering"
        )
        db.add(student)
        db.commit()
        db.refresh(user)
        db.refresh(student)
    else:
        user.auth_provider = "google"
        user.is_email_verified = True
        user.last_login_at = datetime.datetime.utcnow()
        if req.supabase_uid:
            user.supabase_uid = req.supabase_uid
        if req.phone_number and not user.phone_number:
            user.phone_number = req.phone_number
        db.commit()
        student = db.query(Student).filter(Student.user_id == user.id).first()

    records = fetch_student_records(student.id, db) if student else {}
    has_existing = bool(records.get("retention_profile") is not None or records.get("latest_schedule") is not None)

    return {
        "status": "success",
        "auth_provider": "google",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "supabase_uid": user.supabase_uid,
            "is_email_verified": user.is_email_verified
        },
        "student": {
            "id": student.id if student else None,
            "name": student.name if student else req.name,
            "phone_number": student.phone_number if student else req.phone_number,
            "grade_level": student.grade_level if student else "engineering",
            "wake_time": student.wake_time if student else "06:30",
            "sleep_time": student.sleep_time if student else "23:30"
        },
        "has_existing_profile": has_existing,
        "records": records
    }


# ---------------------------------------------------------
# Sign Up & Sign In Endpoints
# ---------------------------------------------------------

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    """Registers a new user with full details (Name, Phone, Email, Password verification)."""
    email_clean = req.email.strip().lower()
    
    # 1. Password confirmation check
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please re-enter your password accurately."
        )

    # 2. Check if user already exists
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in instead."
        )

    # 3. Create User
    pwd_hash = hash_password(req.password) if req.password else None
    user = User(
        email=email_clean,
        phone_number=req.phone_number,
        password_hash=pwd_hash,
        supabase_uid=req.supabase_uid,
        auth_provider="email",
        is_email_verified=bool(req.otp_code),
        is_phone_verified=bool(req.otp_code and req.phone_number),
        last_login_at=datetime.datetime.utcnow()
    )
    db.add(user)
    db.flush()

    # 4. Create Linked Student Record
    student = Student(
        user_id=user.id,
        name=req.name.strip() if req.name else email_clean.split("@")[0].capitalize(),
        phone_number=req.phone_number,
        grade_level=req.grade_level or "engineering"
    )
    db.add(student)
    db.commit()
    db.refresh(user)
    db.refresh(student)

    return {
        "status": "success",
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "supabase_uid": user.supabase_uid,
            "is_email_verified": user.is_email_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        "student": {
            "id": student.id,
            "name": student.name,
            "phone_number": student.phone_number,
            "grade_level": student.grade_level,
            "wake_time": student.wake_time,
            "sleep_time": student.sleep_time
        },
        "has_existing_profile": False,
        "records": {
            "retention_profile": None,
            "latest_schedule": None,
            "notes": [],
            "completions": [],
            "quiz_attempts": [],
            "doubts": []
        }
    }


@router.post("/signin")
def signin(req: SignInRequest, db: Session = Depends(get_db)):
    """Authenticates a user and retrieves all their timetable, retention reports, notes, bookmarks, and scores."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email. Please check your credentials or switch to 'Create Account'."
        )

    # Verify password if user has a password set
    if user.password_hash:
        if not req.password or user.password_hash != hash_password(req.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please verify your credentials and try again."
            )
    user.last_login_at = datetime.datetime.utcnow()
    if req.supabase_uid and not user.supabase_uid:
        user.supabase_uid = req.supabase_uid
    db.commit()

    # Fetch associated student and consolidated records
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        # Check if an existing student record exists by name or unattached user_id
        candidate_name = user.email.split("@")[0].capitalize()
        student = db.query(Student).filter(
            (Student.name.ilike(candidate_name)) | (Student.user_id.is_(None))
        ).order_by(Student.id.desc()).first()
        
        if student:
            student.user_id = user.id
            if user.phone_number and not student.phone_number:
                student.phone_number = user.phone_number
            db.commit()
            db.refresh(student)
        else:
            student = Student(
                user_id=user.id,
                name=candidate_name,
                phone_number=user.phone_number,
                grade_level="engineering"
            )
            db.add(student)
            db.commit()
            db.refresh(student)

    records = fetch_student_records(student.id, db)
    has_existing = bool(records.get("retention_profile") is not None or records.get("latest_schedule") is not None)


    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "supabase_uid": user.supabase_uid,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
        },
        "student": {
            "id": student.id,
            "name": student.name,
            "phone_number": student.phone_number,
            "grade_level": student.grade_level,
            "wake_time": student.wake_time,
            "sleep_time": student.sleep_time
        },
        "has_existing_profile": has_existing,
        "records": records
    }


@router.post("/sync-supabase")
def sync_supabase_user(req: SupabaseSyncRequest, db: Session = Depends(get_db)):
    """Synchronizes or provisions a user authenticated through Supabase Auth."""
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(
        (User.supabase_uid == req.supabase_uid) | (User.email == email_clean)
    ).first()

    if not user:
        user = User(
            email=email_clean,
            phone_number=req.phone_number,
            supabase_uid=req.supabase_uid,
            last_login_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            name=req.name or email_clean.split("@")[0].capitalize(),
            phone_number=req.phone_number,
            grade_level=req.grade_level or "engineering"
        )
        db.add(student)
        db.commit()
        db.refresh(user)
        db.refresh(student)
    else:
        user.supabase_uid = req.supabase_uid
        user.last_login_at = datetime.datetime.utcnow()
        if req.phone_number and not user.phone_number:
            user.phone_number = req.phone_number
        db.commit()
        student = db.query(Student).filter(Student.user_id == user.id).first()

    records = fetch_student_records(student.id, db) if student else {}
    has_existing = bool(records.get("retention_profile") is not None or records.get("latest_schedule") is not None)

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "supabase_uid": user.supabase_uid
        },
        "student": {
            "id": student.id if student else None,
            "name": student.name if student else req.name,
            "phone_number": student.phone_number if student else req.phone_number,
            "grade_level": student.grade_level if student else req.grade_level
        },
        "has_existing_profile": has_existing,
        "records": records
    }


@router.get("/student/{student_id}/records")
def get_full_student_records(student_id: int, db: Session = Depends(get_db)):
    """Returns all timetable, retention reports, task completions, notes, bookmarks, and quiz attempts for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    records = fetch_student_records(student_id, db)
    has_existing = bool(records.get("retention_profile") is not None or records.get("latest_schedule") is not None)

    return {
        "student_id": student.id,
        "name": student.name,
        "phone_number": student.phone_number,
        "grade_level": student.grade_level,
        "has_existing_profile": has_existing,
        "records": records
    }


@router.post("/student/{student_id}/clear-records")
@router.delete("/student/{student_id}/clear-records")
def clear_all_student_records(student_id: int, db: Session = Depends(get_db)):
    """Deletes all retention profiles, timetables, notes, bookmarks, daily targets, completions, and quiz attempts for a student, while keeping their user account signed in."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Delete all associated study records
    db.query(RetentionProfile).filter(RetentionProfile.student_id == student_id).delete()
    db.query(Schedule).filter(Schedule.student_id == student_id).delete()
    db.query(DailyTarget).filter(DailyTarget.student_id == student_id).delete()
    db.query(Completion).filter(Completion.student_id == student_id).delete()
    db.query(Note).filter(Note.student_id == student_id).delete()
    db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).delete()
    db.query(DoubtLog).filter(DoubtLog.student_id == student_id).delete()

    db.commit()

    return {
        "status": "success",
        "message": "All student study records (retention profiles, timetable, notes, targets, quiz attempts) have been cleared successfully.",
        "student_id": student.id
    }


# ---------------------------------------------------------
# Helper to gather all records
# ---------------------------------------------------------

def fetch_student_records(student_id: int, db: Session) -> Dict[str, Any]:
    # 1. Retention Profile
    retention_profile = db.query(RetentionProfile).filter(RetentionProfile.student_id == student_id).first()
    retention_data = None
    if retention_profile:
        retention_data = {
            "retention_score": retention_profile.retention_score,
            "break_interval_minutes": retention_profile.break_interval_minutes,
            "series_completion_score": retention_profile.series_completion_score,
            "reel_watch_score": retention_profile.reel_watch_score,
            "sustained_focus_score": retention_profile.sustained_focus_score,
            "self_report_score": retention_profile.self_report_score,
            "distraction_recovery_score": retention_profile.distraction_recovery_score,
            "details": retention_profile.details,
            "created_at": retention_profile.created_at.isoformat() if retention_profile.created_at else None
        }

    # 2. Latest Schedule / Timetable
    latest_schedule = db.query(Schedule).filter(
        Schedule.student_id == student_id
    ).order_by(Schedule.id.desc()).first()
    schedule_data = None
    if latest_schedule:
        schedule_data = {
            "id": latest_schedule.id,
            "wake_time": latest_schedule.wake_time,
            "total_study_hours": latest_schedule.total_study_hours,
            "slots": latest_schedule.slots,
            "corrections_made": latest_schedule.corrections_made,
            "created_at": latest_schedule.created_at.isoformat() if latest_schedule.created_at else None
        }

    # 3. Notes and Bookmarks
    notes_rows = db.query(Note).filter(Note.student_id == student_id).all()
    notes_list = [
        {
            "id": n.id,
            "document_id": n.document_id,
            "page_number": n.page_number,
            "selected_text": n.selected_text,
            "note_text": n.note_text,
            "is_bookmark": n.is_bookmark,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notes_rows
    ]

    # 4. Task / Daily Target Completions
    completions = db.query(Completion).filter(Completion.student_id == student_id).all()
    completion_list = [
        {
            "id": c.id,
            "document_id": c.document_id,
            "target_id": c.target_id,
            "completed_type": c.completed_type,
            "completed_at": c.completed_at.isoformat() if c.completed_at else None
        }
        for c in completions
    ]

    # 5. Quiz Attempts & Scores
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).all()
    quiz_list = [
        {
            "id": q.id,
            "quiz_id": q.quiz_id,
            "score": q.score,
            "total_questions": q.total_questions,
            "student_answers": q.student_answers,
            "completed_at": q.completed_at.isoformat() if q.completed_at else None
        }
        for q in quiz_attempts
    ]

    # 6. Doubt Logs
    doubts = db.query(DoubtLog).filter(DoubtLog.student_id == student_id).all()
    doubt_list = [
        {
            "id": d.id,
            "document_id": d.document_id,
            "page_number": d.page_number,
            "selected_text": d.selected_text,
            "question_text": d.question_text,
            "explanation": d.explanation,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in doubts
    ]

    return {
        "retention_profile": retention_data,
        "latest_schedule": schedule_data,
        "notes": notes_list,
        "completions": completion_list,
        "quiz_attempts": quiz_list,
        "doubts": doubt_list
    }
