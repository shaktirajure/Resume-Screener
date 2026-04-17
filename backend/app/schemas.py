"""Pydantic schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class DimensionScore(BaseModel):
    score: float = Field(..., ge=0, le=10)
    reasoning: str
    evidence: list[str] = Field(default_factory=list)


class ScoreBreakdown(BaseModel):
    technical_skills: DimensionScore
    experience_relevance: DimensionScore
    education_fit: DimensionScore
    domain_knowledge: DimensionScore
    seniority_match: DimensionScore
    red_flags: DimensionScore


class ScoreResponse(BaseModel):
    final_score: float = Field(..., ge=0, le=10)
    verdict: str  # strong_match | moderate_match | weak_match | no_match
    summary: str
    breakdown: ScoreBreakdown
    strengths: list[str]
    concerns: list[str]
    processing_time_seconds: float
    model_used: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
