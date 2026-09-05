"""Document text chunker (~300 tokens/words with 50-word semantic overlap)."""
from typing import List, Dict, Any


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
    """Splits text into chunks of roughly chunk_size words with overlap."""
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


def chunk_page_contents(pages: List[Dict[str, Any]], chunk_size: int = 300, overlap: int = 50) -> List[Dict[str, Any]]:
    """Chunks a list of page objects while preserving page numbers and chunk indexing."""
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
                "word_count": len(c_text.split())
            })
            global_chunk_idx += 1

    return result_chunks
