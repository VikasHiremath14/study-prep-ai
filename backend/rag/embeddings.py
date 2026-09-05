"""Embedding provider abstraction (Gemini / Mock / Local fallback)."""
from typing import List
from backend.app.config import settings


class EmbeddingService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.api_key = settings.LLM_API_KEY

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a given text string."""
        # Standard 768-dim mock vector or API call
        if not self.api_key or self.provider == "mock":
            # Deterministic pseudo-embedding for testing / offline demo
            val = (sum(ord(c) for c in text) % 100) / 100.0
            return [val] * 128
        # Provider API implementation will be expanded in Phase 3
        return [0.0] * 128

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding generation."""
        return [self.embed_text(t) for t in texts]


embedding_service = EmbeddingService()
