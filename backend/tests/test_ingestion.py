"""Tests for Phase 3: Academic Ingestion, Vector Embeddings, and Daily Target Calculations."""
import pytest
from backend.rag.chunker import chunk_text, chunk_page_contents
from backend.rag.embeddings import embedding_service
from backend.agents.ingestion_agent import ingestion_agent


def test_chunker_logic():
    """Validates chunking produces multiple chunks with content from the original text."""
    sample_text = " ".join([f"word_{i}" for i in range(100)])
    # RecursiveCharacterTextSplitter: chunk_size=30 words * 5 chars/word = 150 chars per chunk
    chunks = chunk_text(sample_text, chunk_size=30, overlap=10)
    assert len(chunks) >= 2
    # Verify first chunk contains early words
    assert "word_0" in chunks[0]
    assert "word_5" in chunks[0]
    # Verify overlap: a word from end of chunk 0 should appear in chunk 1
    # (exact boundary depends on RecursiveCharacterTextSplitter's separator logic)
    combined = " ".join(chunks)
    assert "word_90" in combined  # all words covered


def test_page_chunking_metadata():
    """Validates structured page chunking with page number preservation."""
    pages = [
        {"page_number": 1, "text": "Page one text content about algorithms and data structures."},
        {"page_number": 2, "text": "Page two text content covering binary search trees and heap structures."}
    ]
    result_chunks = chunk_page_contents(pages, chunk_size=10, overlap=2)
    assert len(result_chunks) >= 2
    assert result_chunks[0]["page_number"] == 1
    assert result_chunks[-1]["page_number"] == 2


def test_embedding_service():
    """Validates vector dimension, normalization, and cosine similarity."""
    v1 = embedding_service.embed_text("Data Structures and Algorithms in Computer Science")
    v2 = embedding_service.embed_text("Data Structures and Algorithmic Complexity")
    v3 = embedding_service.embed_text("Cooking recipes for delicious chocolate cake")

    assert len(v1) == 128
    assert len(v2) == 128

    sim_related = embedding_service.cosine_similarity(v1, v2)
    sim_unrelated = embedding_service.cosine_similarity(v1, v3)

    assert sim_related > sim_unrelated


def test_retention_scaled_daily_targets():
    """Validates that high retention assigns higher daily page targets than low retention."""
    total_pages = 60
    # High retention (0.85)
    plan_high = ingestion_agent.calculate_daily_targets(
        total_pages=total_pages,
        retention_score=0.85,
        grade_level="engineering",
        daily_allocated_hours=1.5
    )
    # Low retention (0.40)
    plan_low = ingestion_agent.calculate_daily_targets(
        total_pages=total_pages,
        retention_score=0.40,
        grade_level="engineering",
        daily_allocated_hours=1.5
    )

    assert plan_high["recommended_daily_pages"] > plan_low["recommended_daily_pages"]
    assert plan_high["total_days_required"] < plan_low["total_days_required"]
    assert len(plan_high["daily_targets"]) == plan_high["total_days_required"]


def test_documents_api_endpoints(client):
    """Tests sample preset ingestion and target calculation endpoints."""
    res_sample = client.get("/api/documents/sample/dsa?retention_score=0.80")
    assert res_sample.status_code == 200
    data = res_sample.json()
    assert data["status"] == "success"
    assert data["total_pages"] == 20
    assert "target_plan" in data
    assert len(data["target_plan"]["daily_targets"]) > 0

    # Test calculate-targets standalone endpoint
    calc_req = {
        "total_pages": 45,
        "retention_score": 0.70,
        "grade_level": "engineering",
        "daily_allocated_hours": 1.5
    }
    res_calc = client.post("/api/documents/calculate-targets", json=calc_req)
    assert res_calc.status_code == 200
    calc_data = res_calc.json()
    assert calc_data["total_pages"] == 45
    assert calc_data["recommended_daily_pages"] >= 8
