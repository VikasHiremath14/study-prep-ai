"""Anti-Web Search Quiz API Endpoints (Phase 5 & 6 Mastery Engine)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.session import get_db
from backend.db.models import Document, Page, Chunk, Note, DoubtLog, Quiz, QuizAttempt, DailyTarget
from backend.agents.quiz_generator import (
    quiz_generator_agent,
    GenerateQuizRequest,
    SubmitQuizRequest,
    FeynmanEvaluationRequest
)

router = APIRouter(prefix="/quiz", tags=["Anti-Web Search Active Recall Quizzes"])


@router.post("/generate")
def generate_anti_web_search_quiz(
    payload: GenerateQuizRequest,
    db: Session = Depends(get_db)
):
    """Generates passage-specific non-searchable scenario questions for read pages."""
    # Fetch page texts from DB if not passed directly
    if not payload.pages_text and payload.document_id:
        pages = db.query(Page).filter(
            Page.document_id == payload.document_id,
            Page.page_number >= payload.page_start,
            Page.page_number <= payload.page_end
        ).order_by(Page.page_number).all()
        payload.pages_text = [p.text for p in pages]

    # Fetch any student doubts to weight question generation
    if payload.document_id and not payload.doubts_context:
        doubts = db.query(DoubtLog).filter(
            DoubtLog.document_id == payload.document_id,
            DoubtLog.page_number >= payload.page_start,
            DoubtLog.page_number <= payload.page_end
        ).all()
        payload.doubts_context = [f"Page {d.page_number} Doubt: {d.question_text}" for d in doubts]

    return quiz_generator_agent.generate_quiz(payload)


@router.post("/submit")
def submit_anti_web_search_quiz(
    payload: SubmitQuizRequest,
    db: Session = Depends(get_db)
):
    """Evaluates student quiz answers and records score in QuizAttempt and marks DailyTarget as completed."""
    result = quiz_generator_agent.evaluate_submission(payload)

    # Persist attempt
    try:
        attempt = QuizAttempt(
            quiz_id=payload.quiz_id or 1,
            student_id=payload.student_id or 1,
            score=result["score_percent"],
            total_questions=result["total_questions"],
            student_answers=payload.student_answers
        )
        db.add(attempt)

        # If student passed (mastery >= 70%), mark daily target completed in DB
        if result.get("is_mastered") and payload.document_id:
            target = db.query(DailyTarget).filter(
                DailyTarget.document_id == payload.document_id,
                DailyTarget.day_number == (payload.day_number or 1)
            ).first()
            if target:
                target.is_completed = True

        # Closed-Loop Agentic Feedback: Update Contextual Bandit Tutor policy reward
        try:
            from backend.agents.tutor_bandit import tutor_bandit_agent
            score_norm = float(result["score_percent"]) / 100.0
            bandit_feedback = tutor_bandit_agent.update_reward(
                pre_quiz_score=0.50,
                post_quiz_score=score_norm
            )
            result["bandit_learning"] = {
                "status": "reward_updated",
                "reward_signal": bandit_feedback.get("reward_signal"),
                "total_cumulative_reward": bandit_feedback.get("total_cumulative_reward")
            }
        except Exception:
            pass

        db.commit()
        db.refresh(attempt)
        result["attempt_id"] = attempt.id
    except Exception as e:
        db.rollback()
        result["attempt_id"] = 1

    return result


@router.post("/bandit-feedback")
def submit_bandit_tutor_feedback(
    decision_id: str,
    pre_score: float = 0.50,
    post_score: float = 0.85
):
    """Explicitly feeds back quiz score improvements to the Contextual Bandit RL engine."""
    from backend.agents.tutor_bandit import tutor_bandit_agent
    return tutor_bandit_agent.update_reward(
        decision_id=decision_id,
        pre_quiz_score=pre_score,
        post_quiz_score=post_score
    )


@router.post("/feynman-evaluate")
def evaluate_feynman(
    payload: FeynmanEvaluationRequest
):
    """Evaluates a student's open-ended explanation using the Feynman Technique."""
    return quiz_generator_agent.evaluate_feynman_explanation(payload)
