"""LangChain Document Chunker — RecursiveCharacterTextSplitter.

Course reference: "RecursiveCharacterTextSplitter" lecture and
"Medium Analyzer - Class Review: Loaders, TextSplitter, OpenAIEmbeddings, Pinecone".

Replaces the manual word-count sliding-window chunker with LangChain's
RecursiveCharacterTextSplitter, which respects sentence/paragraph boundaries
for much higher-quality semantic chunks.

Public API is 100% backward compatible — chunk_text() and chunk_page_contents()
return the same shape as before.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# ── LangChain RecursiveCharacterTextSplitter ──────────────────────────────────
# Course: "RecursiveCharacterTextSplitter" lecture
# Splits on ["\n\n", "\n", ". ", " ", ""] in priority order so it always tries
# to keep paragraphs → sentences → words together before making a hard split.
try:
    from langchain_core.documents import Document
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    _LANGCHAIN_AVAILABLE = True
    logger.info("[Chunker] LangChain RecursiveCharacterTextSplitter loaded.")
except ImportError:
    _LANGCHAIN_AVAILABLE = False
    logger.warning("[Chunker] LangChain not available — using legacy word-count splitter fallback.")


def _legacy_chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
    """Legacy word-count splitter — used as fallback when LangChain is unavailable."""
    words = text.split()
    if not words:
        return []
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += (chunk_size - overlap)
        if i >= len(words) and len(chunks) > 1:
            break
    return chunks


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
    """
    Splits a raw text string into overlapping semantic chunks.

    When LangChain is available, delegates to RecursiveCharacterTextSplitter
    with character-based sizing (chunk_size * 5 chars ≈ chunk_size words).
    Falls back to the legacy word-count splitter for test environments.

    Args:
        text: Raw text content to split.
        chunk_size: Approximate number of words per chunk.
        overlap: Number of words to overlap between consecutive chunks.

    Returns:
        List of chunk strings.
    """
    if not text.strip():
        return []

    if _LANGCHAIN_AVAILABLE:
        # Convert word-count params to character-count approximations
        # (~5 chars/word average for technical/academic text)
        char_chunk_size = chunk_size * 5
        char_overlap = overlap * 5

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=char_chunk_size,
            chunk_overlap=char_overlap,
            separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " ", ""],
            length_function=len,
            is_separator_regex=False,
        )
        return splitter.split_text(text)

    return _legacy_chunk_text(text, chunk_size, overlap)


def chunk_page_contents(
    pages: List[Dict[str, Any]],
    chunk_size: int = 300,
    overlap: int = 50
) -> List[Dict[str, Any]]:
    """
    Chunks a list of page objects while preserving page numbers and chunk indexing.

    Internally wraps the LangChain splitter and returns the same dict schema
    as the original implementation so IngestionAgent works without changes.

    Args:
        pages: List of dicts with keys "page_number" and "text".
        chunk_size: Approximate words per chunk.
        overlap: Overlap words between chunks.

    Returns:
        List of chunk dicts with keys:
          page_number, chunk_index, local_index, chunk_text, word_count
    """
    result_chunks = []
    global_chunk_idx = 0

    for p in pages:
        page_num = p.get("page_number", 1)
        text = p.get("text", "")
        raw_chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)

        for local_idx, c_text in enumerate(raw_chunks):
            result_chunks.append({
                "page_number": page_num,
                "chunk_index": global_chunk_idx,
                "local_index": local_idx,
                "chunk_text": c_text,
                "word_count": len(c_text.split()),
            })
            global_chunk_idx += 1

    return result_chunks


def pages_to_langchain_documents(pages: List[Dict[str, Any]]) -> List["Document"]:
    """
    Converts raw page dicts into LangChain Document objects with metadata.
    Used by the IngestionAgent's Chroma vector store ingestion pipeline.
    Course: "Medium Analyzer - Ingestion Implementation"
    """
    if not _LANGCHAIN_AVAILABLE:
        raise ImportError("LangChain is required for pages_to_langchain_documents().")

    docs = []
    for p in pages:
        docs.append(Document(
            page_content=p.get("text", ""),
            metadata={"page_number": p.get("page_number", 1)},
        ))
    return docs
