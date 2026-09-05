"""End-to-end ingestion and RAG retrieval pipeline stub."""
from typing import List, Dict, Any


class RAGPipeline:
    def __init__(self):
        pass

    def ingest_document(self, document_id: int, text_pages: List[str]) -> Dict[str, Any]:
        return {"status": "ready", "document_id": document_id, "pages": len(text_pages)}


rag_pipeline = RAGPipeline()
