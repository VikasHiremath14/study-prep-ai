"""Academic Content Ingestion & Retention-Scaled RAG Agent (Phase 3).

Extracts text from academic PDFs/notes, generates semantic chunks with vector embeddings,
and calculates retention-scaled daily reading page limits.
"""

from typing import List, Dict, Any, Optional
import io
import math
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent
from backend.rag.chunker import chunk_page_contents
from backend.rag.embeddings import embedding_service
from backend.app.llm import llm_service


class IngestDocumentRequest(BaseModel):
    title: str
    filename: Optional[str] = None
    text_content: Optional[str] = None
    pages: Optional[List[Dict[str, Any]]] = None
    student_id: Optional[int] = None
    retention_score: float = 0.75
    grade_level: str = "engineering"
    daily_allocated_hours: float = 1.5


class CalculateTargetsRequest(BaseModel):
    document_id: Optional[int] = None
    total_pages: int = 50
    retention_score: float = 0.75
    grade_level: str = "engineering"
    daily_allocated_hours: float = 1.5
    target_days: Optional[int] = None


class IngestionAgent(BaseAgent):
    """Orchestrates document extraction, vector indexing, and retention-scaled reading target calculation."""

    def __init__(self):
        super().__init__(
            name="Content Ingestion & RAG Agent",
            description="Extracts academic texts, indexes dense vectors, and calibrates retention-scaled daily page targets."
        )

    def extract_pdf_pages(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extracts text per page from raw PDF bytes using pypdf."""
        pages_data = []
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages_data.append({
                    "page_number": idx + 1,
                    "text": text.strip()
                })
        except Exception as e:
            # Fallback if PDF parsing encounters an error
            pages_data = [{
                "page_number": 1,
                "text": f"Document content (PDF extracted with notice: {str(e)})"
            }]
        return pages_data

    def calculate_daily_targets(
        self,
        total_pages: int,
        retention_score: float,
        grade_level: str = "engineering",
        daily_allocated_hours: float = 1.5
    ) -> Dict[str, Any]:
        """Calculates cognitive science grounded daily reading page limits based on retention score."""
        # 1. Base technical reading velocity (pages per focus hour) by academic level
        base_pages_per_hour = {
            "10th": 14.0,
            "12th": 11.0,
            "engineering": 8.5,
            "mtech": 6.5,
            "competitive": 9.0
        }.get(grade_level, 8.5)

        # 2. Retention Velocity Multiplier (Karpicke & Roediger 2006 / Sweller 1988)
        # High retention (>= 0.75) absorbs concepts 25% faster with less rereading friction
        # Low retention (< 0.50) requires micro-pacing with checkpoints to prevent illusory learning
        if retention_score >= 0.75:
            retention_multiplier = 1.15 + (retention_score - 0.75) * 0.4
            pacing_label = "Deep Synthesis Pacing (High Velocity)"
            break_density = "Standard 15m consolidation breaks"
        elif retention_score >= 0.50:
            retention_multiplier = 0.85 + (retention_score - 0.50) * 0.6
            pacing_label = "Balanced Analytical Pacing"
            break_density = "10m synaptic recovery breaks"
        else:
            retention_multiplier = 0.55 + max(0.0, retention_score) * 0.5
            pacing_label = "Micro-Comprehension Pacing (High Friction Protection)"
            break_density = "Frequent 10m micro-resets after every 4-5 pages"

        # Effective pages per day
        daily_pages_raw = base_pages_per_hour * daily_allocated_hours * retention_multiplier
        daily_pages = max(4, int(round(daily_pages_raw)))

        total_days = math.ceil(total_pages / daily_pages) if daily_pages > 0 else 1

        targets = []
        curr_page = 1
        for day in range(1, total_days + 1):
            end_page = min(total_pages, curr_page + daily_pages - 1)
            targets.append({
                "day_number": day,
                "start_page": curr_page,
                "end_page": end_page,
                "pages_count": (end_page - curr_page + 1),
                "estimated_focus_minutes": int(daily_allocated_hours * 60),
                "is_completed": False
            })
            curr_page = end_page + 1
            if curr_page > total_pages:
                break

        return {
            "total_pages": total_pages,
            "retention_score": retention_score,
            "pacing_label": pacing_label,
            "break_density": break_density,
            "recommended_daily_pages": daily_pages,
            "total_days_required": len(targets),
            "daily_targets": targets
        }

    def process_document(
        self,
        title: str,
        filename: str,
        pages_data: List[Dict[str, Any]],
        retention_score: float = 0.75,
        grade_level: str = "engineering",
        daily_allocated_hours: float = 1.5
    ) -> Dict[str, Any]:
        """Runs full ingestion pipeline: chunking, vector embeddings, and daily target calculation."""
        # 1. Chunk text pages
        chunks = chunk_page_contents(pages_data, chunk_size=300, overlap=50)

        # 2. Generate Vector Embeddings
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = embedding_service.embed_batch(chunk_texts)

        for c, emb in zip(chunks, embeddings):
            c["embedding"] = emb

        total_pages = len(pages_data)
        total_words = sum(len(p.get("text", "").split()) for p in pages_data)

        # 3. Calculate Retention-Scaled Daily Targets
        target_info = self.calculate_daily_targets(
            total_pages=total_pages,
            retention_score=retention_score,
            grade_level=grade_level,
            daily_allocated_hours=daily_allocated_hours
        )

        return {
            "status": "success",
            "title": title,
            "filename": filename,
            "total_pages": total_pages,
            "total_words": total_words,
            "total_chunks": len(chunks),
            "vector_dimension": embedding_service.embedding_dim,
            "pages": pages_data,
            "chunks": chunks,
            "target_plan": target_info
        }

    def run(self, payload: IngestDocumentRequest) -> Dict[str, Any]:
        """Executes the complete document ingestion, chunking, and target calculation."""
        pages = payload.pages or []
        if not pages and payload.text_content:
            words = payload.text_content.split()
            page_size = 350
            page_num = 1
            for i in range(0, len(words), page_size):
                p_text = " ".join(words[i:i + page_size])
                pages.append({"page_number": page_num, "text": p_text})
                page_num += 1

        if not pages:
            pages = [{"page_number": 1, "text": payload.title}]

        return self.process_document(
            title=payload.title,
            filename=payload.filename or f"{payload.title.lower().replace(' ', '_')}.pdf",
            pages_data=pages,
            retention_score=payload.retention_score,
            grade_level=payload.grade_level,
            daily_allocated_hours=payload.daily_allocated_hours
        )


ingestion_agent = IngestionAgent()
