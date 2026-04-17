"""Configuration for the resume screener."""
import os
from pathlib import Path

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2:3b")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

# Rubric dimensions and weights. Must sum to 1.0.
RUBRIC_WEIGHTS = {
    "technical_skills": 0.30,
    "experience_relevance": 0.25,
    "education_fit": 0.10,
    "domain_knowledge": 0.15,
    "seniority_match": 0.15,
    "red_flags": 0.05,  # Inverse: high red_flags = low contribution
}

# Generation settings
LLM_TEMPERATURE = 0.0
LLM_TIMEOUT_SECONDS = 180
LLM_NUM_CTX = 4096  # Context window

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

assert abs(sum(RUBRIC_WEIGHTS.values()) - 1.0) < 1e-6, "Rubric weights must sum to 1.0"
