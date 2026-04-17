"use client";

import { useState } from "react";
import type { DimensionScore } from "@/lib/api";

const LABELS: Record<string, string> = {
  technical_skills: "Technical skills",
  experience_relevance: "Experience relevance",
  education_fit: "Education fit",
  domain_knowledge: "Domain knowledge",
  seniority_match: "Seniority match",
  red_flags: "Red flags (inverse)",
};

export function DimensionRow({
  name,
  data,
  index,
}: {
  name: keyof typeof LABELS;
  data: DimensionScore;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const pct = (data.score / 10) * 100;
  const colorClass =
    data.score >= 7.5
      ? "bg-accent"
      : data.score >= 5
      ? "bg-ink"
      : "bg-muted";

  return (
    <div
      className="border-b border-line py-5 rise"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left group"
      >
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-muted">
              0{index + 1}
            </span>
            <span className="font-display text-xl">{LABELS[name]}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl tabular-nums">
              {data.score.toFixed(1)}
            </span>
            <span className="font-mono text-xs text-muted">/ 10</span>
            <span className="font-mono text-xs text-muted ml-2 group-hover:text-ink transition-colors">
              {open ? "−" : "+"}
            </span>
          </div>
        </div>
        <div className="h-[2px] bg-line relative overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 ${colorClass} transition-all duration-700 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {open && (
        <div className="mt-4 pl-8 rise space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            {data.reasoning}
          </p>
          {data.evidence.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
                Evidence
              </div>
              <ul className="space-y-1.5">
                {data.evidence.map((e, i) => (
                  <li
                    key={i}
                    className="text-sm border-l-2 border-accent pl-3 text-ink/80 italic"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
