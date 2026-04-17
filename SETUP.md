# Setup Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- Ollama installed ([https://ollama.com](https://ollama.com))
- 8GB+ RAM recommended

## Step 1: Pull Ollama models

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Verify Ollama is running:

```bash
ollama list
curl http://localhost:11434/api/tags
```

## Step 2: Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

## Step 3: Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Step 4: Test

1. Open `http://localhost:3000`
2. Paste a job description or upload a `.txt`/`.pdf`
3. Upload a resume PDF
4. Click "Score"
5. Wait 30-90 seconds (CPU inference is slow)

## Troubleshooting

**"Connection refused" errors:** Ollama is not running. Start it with `ollama serve`.

**Model is slow:** That's CPU inference. Expected. Use a smaller model like `llama3.2:1b` if unbearable, but quality drops.

**Scores look random:** Check the raw LLM output in the backend logs. The model may be failing to produce valid JSON. Lower temperature, simplify the prompt, or switch to a better model.
