"""Academic Content Ingestion & Retention-Scaled RAG Agent — LangChain Edition (Phase 3).

Course reference:
  - "Medium Analyzer - Ingestion Implementation" (document loading + chunking)
  - "Batch Indexing" (Chroma vector store ingestion)
  - "RAG Implementation with Vector Stores Quiz"
  - "LangChain Vector Store Ingestion Pipeline (Unstructured, ChromaDB)"

Replaces the manual pypdf page-loop with LangChain's PyPDFLoader and
replaces the custom chunker call with the new RecursiveCharacterTextSplitter
chunker. Chunk embeddings are stored in a Chroma in-memory vector store so
the retrieval pipeline can do semantic search (used by study_graph.py).

The retention-scaled daily target calculation and all public method signatures
are 100% unchanged.
"""

import io
import math
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.agents.base import BaseAgent
from backend.rag.chunker import chunk_page_contents, pages_to_langchain_documents
from backend.rag.embeddings import embedding_service
from backend.app.llm import llm_service

logger = logging.getLogger(__name__)


# ── Pydantic Input Schemas (unchanged) ────────────────────────────────────────

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


# ── Ingestion Agent ────────────────────────────────────────────────────────────

class IngestionAgent(BaseAgent):
    """
    LangChain-powered Document Ingestion, Vector Indexing, and Target Calculation Agent.

    Pipeline (course: "Medium Analyzer - Ingestion Implementation"):
      1. LangChain PyPDFLoader → extract pages as LangChain Documents
      2. RecursiveCharacterTextSplitter → semantic chunks
      3. Chroma vector store → indexed embeddings for semantic retrieval
      4. Retention-scaled daily target calculation (pure Python, unchanged)
    """

    def __init__(self):
        super().__init__(
            name="Content Ingestion & RAG Agent",
            description="Extracts academic texts, indexes dense vectors with Chroma, and calibrates retention-scaled daily page targets."
        )
        # In-memory Chroma store — keyed by document_id
        # Course: "RAG Implementation with Vector Stores" — Chroma is the default vector store
        self._vector_stores: Dict[int, Any] = {}

    # ── Document Extraction ────────────────────────────────────────────────────

    def extract_pdf_pages(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extracts text per page from raw PDF bytes.
        Uses LangChain's PyPDFLoader when available, falls back to pypdf directly.
        Course: "Medium Analyzer - Class Review: Loaders, TextSplitter, OpenAIEmbeddings"
        """
        try:
            # LangChain PyPDFLoader path
            from langchain_community.document_loaders import PyPDFLoader
            import tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(pdf_bytes)
                tmp_path = tmp.name
            try:
                loader = PyPDFLoader(tmp_path)
                docs = loader.load()
                return [
                    {"page_number": i + 1, "text": doc.page_content.strip()}
                    for i, doc in enumerate(docs)
                ]
            finally:
                os.unlink(tmp_path)
        except Exception:
            pass

        # Fallback: raw pypdf (keeps test compatibility)
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            return [
                {"page_number": idx + 1, "text": (page.extract_text() or "").strip()}
                for idx, page in enumerate(reader.pages)
            ]
        except Exception as e:
            return [{"page_number": 1, "text": f"Document content (PDF extracted with notice: {str(e)})"}]

    # ── Chroma Vector Store Ingestion ─────────────────────────────────────────

    def _build_chroma_store(self, document_id: int, pages_data: List[Dict[str, Any]]) -> Optional[Any]:
        """
        Builds a Chroma in-memory vector store from ingested page documents.
        Course: "RAG Implementation with Vector Stores" and "Batch Indexing".
        Pattern: Chroma.from_documents(docs, embeddings)
        """
        lc_embeddings = embedding_service.get_langchain_embeddings()
        if lc_embeddings is None:
            logger.info(f"[IngestionAgent] No LangChain embeddings — skipping Chroma store for doc {document_id}.")
            return None

        try:
            from langchain_chroma import Chroma
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            # Convert pages → LangChain Documents
            raw_docs = pages_to_langchain_documents(pages_data)

            # Split into chunks using RecursiveCharacterTextSplitter
            # Course: "RecursiveCharacterTextSplitter" lecture
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=250,
                separators=["\n\n", "\n", ". ", " ", ""],
            )
            split_docs = splitter.split_documents(raw_docs)

            # Add document_id to metadata for filtered retrieval
            for doc in split_docs:
                doc.metadata["document_id"] = document_id

            # Create Chroma vector store — course: "Batch Indexing" lecture
            # Chroma.from_documents ingests all chunks in one efficient batch call
            store = Chroma.from_documents(
                documents=split_docs,
                embedding=lc_embeddings,
                collection_name=f"studyprep_doc_{document_id}",
            )
            self._vector_stores[document_id] = store
            logger.info(f"[IngestionAgent] Chroma store built for doc {document_id} with {len(split_docs)} chunks.")
            return store
        except Exception as e:
            logger.warning(f"[IngestionAgent] Chroma build failed: {e}")
            return None

    def get_retriever(self, document_id: int, k: int = 4):
        """
        Returns a LangChain Retriever for a given document's vector store.
        Course: "Retrieval Agent Implementation" — as_retriever() wraps Chroma.
        Used by study_graph.py retrieve_node.
        """
        store = self._vector_stores.get(document_id)
        if store is None:
            return None
        return store.as_retriever(search_kwargs={"k": k})

    # ── Daily Target Calculation (pure Python, 100% unchanged) ────────────────

    def calculate_daily_targets(
        self,
        total_pages: int,
        retention_score: float,
        grade_level: str = "engineering",
        daily_allocated_hours: float = 1.5
    ) -> Dict[str, Any]:
        """Calculates cognitive science grounded daily reading page limits (unchanged)."""
        base_pages_per_hour = {
            "10th": 14.0, "12th": 11.0, "engineering": 8.5,
            "mtech": 6.5, "competitive": 9.0
        }.get(grade_level, 8.5)

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
                "is_completed": False,
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
            "daily_targets": targets,
        }

    # ── Main Processing Pipeline ───────────────────────────────────────────────

    def process_document(
        self,
        title: str,
        filename: str,
        pages_data: List[Dict[str, Any]],
        retention_score: float = 0.75,
        grade_level: str = "engineering",
        daily_allocated_hours: float = 1.5,
        document_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Runs the full LangChain ingestion pipeline:
          1. Chunk text pages with RecursiveCharacterTextSplitter
          2. Embed chunks (GoogleGenerativeAIEmbeddings or deterministic fallback)
          3. Index into Chroma vector store
          4. Calculate retention-scaled daily reading targets

        Course: "Medium Analyzer - Ingestion Implementation" end-to-end.
        """
        # 1. Chunk pages with LangChain RecursiveCharacterTextSplitter (via chunker.py)
        chunks = chunk_page_contents(pages_data, chunk_size=300, overlap=50)

        # 2. Generate embeddings (LangChain GoogleGenerativeAIEmbeddings or deterministic)
        chunk_texts = [c["chunk_text"] for c in chunks]
        embeddings = embedding_service.embed_batch(chunk_texts)
        for c, emb in zip(chunks, embeddings):
            c["embedding"] = emb

        # 3. Build Chroma vector store (async-safe, in-memory per document)
        if document_id is not None:
            self._build_chroma_store(document_id, pages_data)

        total_pages = len(pages_data)
        total_words = sum(len(p.get("text", "").split()) for p in pages_data)

        # 4. Calculate retention-scaled daily targets
        target_info = self.calculate_daily_targets(
            total_pages=total_pages,
            retention_score=retention_score,
            grade_level=grade_level,
            daily_allocated_hours=daily_allocated_hours,
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
            "target_plan": target_info,
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
            daily_allocated_hours=payload.daily_allocated_hours,
        )


ingestion_agent = IngestionAgent()
