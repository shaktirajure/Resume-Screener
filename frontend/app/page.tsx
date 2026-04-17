"use client";

import { useEffect, useState } from "react";
import { scoreResume, checkHealth, type ScoreResult } from "@/lib/api";
import { FileDrop } from "@/components/FileDrop";
import { DimensionRow } from "@/components/DimensionRow";

type HealthState =
  | { status: "checking" }
  | { status: "ok"; model: string }
  | { status: "error"; message: string };

const DIMENSIONS: Array<keyof ScoreResult["breakdown"]> = [
  "technical_skills",
  "experience_relevance",
  "education_fit",
  "domain_knowledge",
  "seniority_match",
  "red_flags",
];

const VERDICT_COPY: Record<ScoreResult["verdict"], string> = {
  strong_match: "Strong match",
  moderate_match: "Moderate match",
  weak_match: "Weak match",
  no_match: "Not a match",
};

export default function Page() {
  const [resume, setResume] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [useFile, setUseFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>({ status: "checking" });

  useEffect(() => {
    checkHealth()
      .then((h) => {
        if (h.ollama_reachable && h.target_model_present) {
          setHealth({ status: "ok", model: h.target_model || "" });
        } else if (h.ollama_reachable) {
          setHealth({
            status: "error",
            message: `Model not pulled: ${h.target_model}`,
          });
        } else {
          setHealth({
            status: "error",
            message: "Ollama unreachable. Run: ollama serve",
          });
        }
      })
      .catch(() =>
        setHealth({ status: "error", message: "Backend unreachable." })
      );
  }, []);

  async function onSubmit() {
    if (!resume) {
      setError("Upload a resume.");
      return;
    }
    if (!useFile && !jdText.trim()) {
      setError("Paste a job description or upload one.");
      return;
    }
    if (useFile && !jdFile) {
      setError("Upload a JD file or switch to paste mode.");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const r = await scoreResume({
        resume,
        jdText: useFile ? undefined : jdText,
        jdFile: useFile ? jdFile : undefined,
      });
      setResult(r);
    } catch (e: any) {
      setError(e.message || "Scoring failed.");
    } finally {
      setLoading(false);
    }
  }

  const ringP = result ? (result.final_score / 10) * 100 : 0;

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <div className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-medium">
              Resume / JD Matcher
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              v0.1 — local
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className={`w-1.5 h-1.5 rounded-full pulse-dot ${
                health.status === "ok"
                  ? "bg-accent"
                  : health.status === "error"
                  ? "bg-red-600"
                  : "bg-muted"
              }`}
            />
            <span className="text-muted">
              {health.status === "checking" && "checking…"}
              {health.status === "ok" && health.model}
              {health.status === "error" && health.message}
            </span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10 border-b border-line">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-6">
          Rubric-based screening · six dimensions · local inference
        </div>
        <h1 className="font-display text-6xl md:text-7xl leading-[0.95] tracking-tight mb-6">
          Score one resume
          <br />
          <span className="italic text-accent">against one role.</span>
        </h1>
        <p className="text-muted text-lg max-w-xl leading-relaxed">
          No cloud, no API keys, no training. Just a local llama doing
          structured scoring on a six-part rubric with evidence citations.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
        {/* JD */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-2xl">Job description</div>
            <div className="flex gap-1 font-mono text-[10px] uppercase tracking-widest">
              <button
                onClick={() => setUseFile(false)}
                className={`px-2 py-1 border ${
                  !useFile
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted"
                }`}
              >
                paste
              </button>
              <button
                onClick={() => setUseFile(true)}
                className={`px-2 py-1 border ${
                  useFile
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted"
                }`}
              >
                upload
              </button>
            </div>
          </div>
          {useFile ? (
            <FileDrop
              label="JD file (.pdf or .txt)"
              accept=".pdf,.txt,.md"
              file={jdFile}
              onFile={setJdFile}
            />
          ) : (
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here…"
              className="w-full h-64 p-4 border border-ink/30 focus:border-ink outline-none bg-transparent font-sans text-sm leading-relaxed resize-none"
            />
          )}
        </div>

        {/* Resume */}
        <div>
          <div className="font-display text-2xl mb-4">Resume</div>
          <FileDrop
            label="Resume (.pdf preferred)"
            accept=".pdf,.txt"
            file={resume}
            onFile={setResume}
          />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted mt-3">
            Image-only PDFs are not supported. OCR is not included.
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-6">
          <button
            onClick={onSubmit}
            disabled={loading || health.status !== "ok"}
            className="bg-ink text-paper px-8 py-4 font-display text-xl hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "scoring…" : "score resume →"}
          </button>
          {loading && (
            <div className="font-mono text-xs text-muted">
              CPU inference — this takes 30 to 90 seconds.
            </div>
          )}
          {error && (
            <div className="font-mono text-xs text-red-700">{error}</div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="border-t-2 border-ink">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="grid md:grid-cols-[auto,1fr] gap-12 items-start mb-16">
              <div
                className="score-ring rise"
                style={
                  {
                    ["--p" as any]: ringP,
                  } as React.CSSProperties
                }
              >
                <span>{result.final_score.toFixed(1)}</span>
              </div>
              <div className="rise" style={{ animationDelay: "100ms" }}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
                  Verdict
                </div>
                <div className="font-display text-5xl leading-tight mb-6">
                  {VERDICT_COPY[result.verdict]}.
                </div>
                <p className="text-muted leading-relaxed max-w-2xl">
                  {result.summary}
                </p>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted mt-6">
                  {result.processing_time_seconds}s · {result.model_used}
                </div>
              </div>
            </div>

            {/* Strengths & concerns */}
            <div className="grid md:grid-cols-2 gap-10 mb-16">
              <div className="rise" style={{ animationDelay: "200ms" }}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
                  Strengths
                </div>
                <ul className="space-y-3">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 font-display text-lg">
                      <span className="text-accent">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rise" style={{ animationDelay: "300ms" }}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-4">
                  Concerns
                </div>
                <ul className="space-y-3">
                  {result.concerns.map((s, i) => (
                    <li key={i} className="flex gap-3 font-display text-lg">
                      <span className="text-muted">−</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Breakdown */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-6">
                Breakdown — click any row for evidence
              </div>
              <div>
                {DIMENSIONS.map((dim, i) => (
                  <DimensionRow
                    key={dim}
                    name={dim}
                    data={result.breakdown[dim]}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-line">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
          <span>Built with Ollama · FastAPI · Next.js</span>
          <span>Not a hiring decision tool.</span>
        </div>
      </div>
    </main>
  );
}
