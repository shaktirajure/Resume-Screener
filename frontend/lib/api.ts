export type DimensionScore = {
  score: number;
  reasoning: string;
  evidence: string[];
};

export type ScoreResult = {
  final_score: number;
  verdict: "strong_match" | "moderate_match" | "weak_match" | "no_match";
  summary: string;
  breakdown: {
    technical_skills: DimensionScore;
    experience_relevance: DimensionScore;
    education_fit: DimensionScore;
    domain_knowledge: DimensionScore;
    seniority_match: DimensionScore;
    red_flags: DimensionScore;
  };
  strengths: string[];
  concerns: string[];
  processing_time_seconds: number;
  model_used: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function scoreResume(params: {
  resume: File;
  jdText?: string;
  jdFile?: File | null;
}): Promise<ScoreResult> {
  const form = new FormData();
  form.append("resume", params.resume);
  if (params.jdFile) {
    form.append("jd_file", params.jdFile);
  }
  if (params.jdText) {
    form.append("jd_text", params.jdText);
  }

  const res = await fetch(`${API_BASE}/score`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || data.error || detail;
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

export async function checkHealth(): Promise<{
  ollama_reachable: boolean;
  target_model_present?: boolean;
  target_model?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
