# Resume-JD Matcher

Local LLM-powered resume screening tool. Upload a job description and a resume, get a rubric-based score with explanations.

## What this is

A practical implementation of LLM-assisted resume screening using **local inference** (no API keys, no data leaves your machine).

**Stack:**
- **LLM:** Ollama running `llama3.2:3b` (CPU-friendly)
- **Embeddings:** `nomic-embed-text` via Ollama (optional RAG mode)
- **Backend:** FastAPI (Python)
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **PDF parsing:** `pypdf`

## What this is NOT

This is not a fine-tuned model. It does not claim production-grade accuracy. It is a prompting + structured output system built on a pretrained open-weight LLM.

**Honest scope:** single resume vs single JD, scored on 6 rubric dimensions, with explanations. Designed for local demo, not production hiring decisions.

## Rubric

The LLM scores each resume 0-10 on:
1. **Technical skills match** — keyword and semantic overlap with JD requirements
2. **Experience relevance** — past roles alignment with target role
3. **Education fit** — degree/field relevance
4. **Domain knowledge** — industry/domain familiarity
5. **Seniority match** — years and level alignment
6. **Red flags** — gaps, job hopping, inconsistencies (inverse score)

Final score is a weighted average. Weights are configurable in `backend/app/config.py`.

## Limitations (read before using)

- LLM judgments are inconsistent across runs. Temperature is set to 0 to reduce this, but non-determinism remains.
- The model can hallucinate skills or misread context. Always verify.
- Bias from pretraining data can affect scoring. This is not a fair-hiring tool.
- Automated resume screening is regulated in some jurisdictions (NYC Local Law 144, EU AI Act). This project is for learning and demos, not deployment.

## Setup

See `SETUP.md` for installation steps.

## Architecture

```
User uploads JD + Resume (PDF/TXT)
       ↓
  Next.js frontend
       ↓ (multipart POST)
  FastAPI /score endpoint
       ↓
  Parse PDFs → extract text
       ↓
  Build rubric prompt with JD + Resume
       ↓
  Ollama (llama3.2:3b) → structured JSON output
       ↓
  Validate + normalize scores
       ↓
  Return to frontend with breakdown
```
