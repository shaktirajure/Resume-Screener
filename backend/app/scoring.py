"""Scoring pipeline: prompt -> Ollama -> validate -> aggregate."""
import time
from . import config
from .ollama_client import generate_json, OllamaError
from .prompts import SYSTEM_PROMPT, build_scoring_prompt


DIMENSIONS = [
    "technical_skills",
    "experience_relevance",
    "education_fit",
    "domain_knowledge",
    "seniority_match",
    "red_flags",
]


def _clamp(x: float, lo: float = 0, hi: float = 10) -> float:
    return max(lo, min(hi, float(x)))


def _validate_and_normalize(raw: dict) -> dict:
    """Validate LLM output structure. Fill missing fields with defaults rather than crash."""
    for dim in DIMENSIONS:
        if dim not in raw or not isinstance(raw[dim], dict):
            raw[dim] = {"score": 0, "reasoning": "Missing from model output.", "evidence": []}
        d = raw[dim]
        d["score"] = _clamp(d.get("score", 0))
        d["reasoning"] = str(d.get("reasoning", ""))[:500]
        ev = d.get("evidence", [])
        if not isinstance(ev, list):
            ev = [str(ev)]
        d["evidence"] = [str(e)[:300] for e in ev[:5]]

    raw["summary"] = str(raw.get("summary", ""))[:800]
    raw["strengths"] = [str(s)[:200] for s in raw.get("strengths", [])[:5]]
    raw["concerns"] = [str(s)[:200] for s in raw.get("concerns", [])[:5]]
    return raw


def _weighted_final(breakdown: dict) -> float:
    total = 0.0
    for dim, weight in config.RUBRIC_WEIGHTS.items():
        total += breakdown[dim]["score"] * weight
    return round(total, 2)


def _verdict(score: float) -> str:
    if score >= 8.0:
        return "strong_match"
    if score >= 6.0:
        return "moderate_match"
    if score >= 4.0:
        return "weak_match"
    return "no_match"


async def score_resume(jd_text: str, resume_text: str) -> dict:
    """Run a single resume-JD scoring pass. Returns dict matching ScoreResponse schema."""
    t0 = time.perf_counter()
    prompt = build_scoring_prompt(jd_text, resume_text)

    raw = await generate_json(prompt=prompt, system=SYSTEM_PROMPT)
    normalized = _validate_and_normalize(raw)

    breakdown = {dim: normalized[dim] for dim in DIMENSIONS}
    final = _weighted_final(breakdown)

    elapsed = round(time.perf_counter() - t0, 2)

    return {
        "final_score": final,
        "verdict": _verdict(final),
        "summary": normalized["summary"],
        "breakdown": breakdown,
        "strengths": normalized["strengths"],
        "concerns": normalized["concerns"],
        "processing_time_seconds": elapsed,
        "model_used": config.LLM_MODEL,
    }
