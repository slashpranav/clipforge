from typing import List, Optional
from app.core.logging import logger

_model = None


def get_semantic_model():
    """Lazy loader for sentence-transformers embedding model if installed."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Lazy loading sentence-transformers model...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError:
            logger.debug("sentence-transformers is not installed; semantic embeddings skipped.")
            return None
    return _model


def compute_semantic_similarity(text_a: str, text_b: str) -> Optional[float]:
    """Compute cosine similarity between two sentences if model is available."""
    model = get_semantic_model()
    if model is None:
        return None
    try:
        from sentence_transformers import util
        emb_a = model.encode(text_a, convert_to_tensor=True)
        emb_b = model.encode(text_b, convert_to_tensor=True)
        sim = float(util.cos_sim(emb_a, emb_b)[0][0])
        return round(sim, 3)
    except Exception:
        return None
