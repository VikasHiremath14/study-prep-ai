"""Embedding provider abstraction (Gemini Embeddings / Mock / Local deterministic vector fallback)."""
from typing import List
import math
from backend.app.config import settings


class EmbeddingService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.api_key = settings.LLM_API_KEY
        self.embedding_dim = 128

    def _deterministic_vector(self, text: str) -> List[float]:
        """Generates a normalized 128-dimensional embedding vector based on text n-grams."""
        if not text:
            return [0.0] * self.embedding_dim

        vec = [0.0] * self.embedding_dim
        # Hash character tri-grams across dimensions
        clean_text = text.lower()
        for i in range(len(clean_text) - 2):
            tri = clean_text[i:i+3]
            h = sum(ord(c) * (31 ** idx) for idx, c in enumerate(tri))
            dim = h % self.embedding_dim
            vec[dim] += 1.0

        # L2 Normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a given text string."""
        if not self.api_key or self.provider == "mock":
            return self._deterministic_vector(text)

        # Attempt Gemini embedding if configured
        try:
            from google import genai
            client = genai.Client(api_key=self.api_key)
            result = client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
            if hasattr(result, "embedding") and hasattr(result.embedding, "values"):
                vals = result.embedding.values
                return vals[:self.embedding_dim] if len(vals) >= self.embedding_dim else vals
        except Exception:
            pass

        return self._deterministic_vector(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding generation."""
        return [self.embed_text(t) for t in texts]

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Calculates cosine similarity between two vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)


embedding_service = EmbeddingService()
