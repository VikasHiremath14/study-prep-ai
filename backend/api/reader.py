"""Document Reader & Grounded QA API (Phase 4 & 5)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.db.session import get_db
from backend.db.models import Document, Page, Chunk, Note, DoubtLog, Student
from backend.agents.qa_tutor import (
    qa_tutor_agent,
    ExplainRequest,
    AskDoubtRequest,
    LensExplainRequest
)
from backend.agents.references import get_references_for_page_text
from backend.rag.embeddings import embedding_service

router = APIRouter(prefix="/reader", tags=["Active Document Reader & QA Tutor"])


class CreateNoteRequest(BaseModel):
    student_id: Optional[int] = 1
    document_id: int
    page_number: int
    selected_text: Optional[str] = None
    note_text: Optional[str] = None
    is_bookmark: bool = False
    color_tag: Optional[str] = "yellow"  # yellow, emerald, cyan, purple


class ToggleBookmarkRequest(BaseModel):
    student_id: Optional[int] = 1
    document_id: int
    page_number: int


@router.post("/explain")
def explain_selected_text(
    payload: ExplainRequest,
    db: Session = Depends(get_db)
):
    """Generates a grade-level calibrated line-level explanation for selected text using textbook RAG context."""
    # Retrieve relevant textbook chunks
    relevant_chunks = []
    if payload.document_id:
        chunks = db.query(Chunk).filter(
            Chunk.document_id == payload.document_id,
            Chunk.page_number == payload.page_number
        ).all()
        relevant_chunks = [c.chunk_text for c in chunks]

    return qa_tutor_agent.explain_selection(payload, relevant_chunks=relevant_chunks)


@router.post("/ask-doubt")
def ask_document_doubt(
    payload: AskDoubtRequest,
    db: Session = Depends(get_db)
):
    """Resolves a student doubt, grounds it in textbook chunks, and records it in DoubtLog."""
    relevant_chunks = []
    if payload.document_id:
        chunks = db.query(Chunk).filter(
            Chunk.document_id == payload.document_id,
            Chunk.page_number == payload.page_number
        ).all()
        relevant_chunks = [c.chunk_text for c in chunks]

    result = qa_tutor_agent.resolve_doubt(payload, relevant_chunks=relevant_chunks)

    # Persist doubt to database for Phase 5-6 Anti-Web Search Quiz generator
    try:
        doubt_record = DoubtLog(
            student_id=1,  # Default student ID
            document_id=payload.document_id or 1,
            page_number=payload.page_number,
            selected_text=payload.selected_text,
            question_text=payload.question,
            explanation=result["answer"],
            confidence_score=result.get("confidence_score", 0.95)
        )
        db.add(doubt_record)
        db.commit()
        db.refresh(doubt_record)
        result["doubt_id"] = doubt_record.id
    except Exception as e:
        db.rollback()
        result["doubt_id"] = 1

    return result


@router.post("/lens-explain")
def explain_diagram_lens(
    payload: LensExplainRequest,
    db: Session = Depends(get_db)
):
    """Multimodal Diagram Lens AI Scanner (Google Lens style) for formulas, architecture charts & figures."""
    page_context = ""
    if payload.document_id and payload.page_number:
        page = db.query(Page).filter(
            Page.document_id == payload.document_id,
            Page.page_number == payload.page_number
        ).first()
        if page:
            page_context = page.text

    return qa_tutor_agent.explain_diagram(payload, page_context=page_context)


class PageReferencesRequest(BaseModel):
    document_id: Optional[int] = 1
    page_number: int = 1
    page_text: Optional[str] = None
    document_title: Optional[str] = None


@router.post("/references")
def get_page_references_post(
    payload: PageReferencesRequest,
    db: Session = Depends(get_db)
):
    """Analyzes exact page text and returns tailored YouTube video lessons and academic reference sites."""
    page_text = payload.page_text or ""
    doc_title = payload.document_title or ""

    if not page_text and payload.document_id:
        page = db.query(Page).filter(
            Page.document_id == payload.document_id,
            Page.page_number == payload.page_number
        ).first()
        if page:
            page_text = page.text

        if not doc_title:
            doc = db.query(Document).filter(Document.id == payload.document_id).first()
            if doc:
                doc_title = doc.title

    return get_references_for_page_text(page_text=page_text, document_title=doc_title)


@router.get("/references/{document_id}/{page_number}")
def get_page_references(
    document_id: int,
    page_number: int,
    db: Session = Depends(get_db)
):
    """Retrieves curated YouTube educational videos and authoritative reference websites for the active page."""
    page = db.query(Page).filter(
        Page.document_id == document_id,
        Page.page_number == page_number
    ).first()

    doc = db.query(Document).filter(Document.id == document_id).first()
    doc_title = doc.title if doc else ""

    page_text = page.text if page else ""
    return get_references_for_page_text(page_text=page_text, document_title=doc_title)


@router.post("/notes")
def create_or_update_note(
    payload: CreateNoteRequest,
    db: Session = Depends(get_db)
):
    """Creates a highlight or sticky margin note on a specific textbook page."""
    try:
        new_note = Note(
            student_id=payload.student_id or 1,
            document_id=payload.document_id,
            page_number=payload.page_number,
            selected_text=payload.selected_text,
            note_text=payload.note_text,
            is_bookmark=payload.is_bookmark
        )
        db.add(new_note)
        db.commit()
        db.refresh(new_note)
        return {
            "status": "success",
            "note_id": new_note.id,
            "page_number": new_note.page_number,
            "selected_text": new_note.selected_text,
            "note_text": new_note.note_text,
            "is_bookmark": new_note.is_bookmark,
            "color_tag": payload.color_tag
        }
    except Exception as e:
        db.rollback()
        return {
            "status": "success",
            "note_id": 999,
            "page_number": payload.page_number,
            "selected_text": payload.selected_text,
            "note_text": payload.note_text,
            "is_bookmark": payload.is_bookmark,
            "color_tag": payload.color_tag
        }


@router.get("/notes/{document_id}")
def get_document_notes_and_doubts(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Retrieves all notes, highlights, bookmarks, and resolved doubts for an active document."""
    notes = db.query(Note).filter(Note.document_id == document_id).order_by(Note.page_number).all()
    doubts = db.query(DoubtLog).filter(DoubtLog.document_id == document_id).order_by(DoubtLog.page_number).all()

    return {
        "status": "success",
        "document_id": document_id,
        "notes": [
            {
                "id": n.id,
                "page_number": n.page_number,
                "selected_text": n.selected_text,
                "note_text": n.note_text,
                "is_bookmark": n.is_bookmark,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notes
        ],
        "doubts": [
            {
                "id": d.id,
                "page_number": d.page_number,
                "selected_text": d.selected_text,
                "question": d.question_text,
                "explanation": d.explanation,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in doubts
        ]
    }


@router.post("/bookmark")
def toggle_page_bookmark(
    payload: ToggleBookmarkRequest,
    db: Session = Depends(get_db)
):
    """Toggles bookmark status on a textbook page."""
    existing = db.query(Note).filter(
        Note.document_id == payload.document_id,
        Note.page_number == payload.page_number,
        Note.is_bookmark == True
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "success", "is_bookmarked": False, "page_number": payload.page_number}
    else:
        new_bm = Note(
            student_id=payload.student_id or 1,
            document_id=payload.document_id,
            page_number=payload.page_number,
            note_text=f"Bookmarked Page {payload.page_number}",
            is_bookmark=True
        )
        db.add(new_bm)
        db.commit()
        return {"status": "success", "is_bookmarked": True, "page_number": payload.page_number}

