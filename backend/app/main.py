"""FastAPI application."""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .schemas import ScoreResponse
from .parsing import parse_upload
from .scoring import score_resume
from .ollama_client import health_check, OllamaError

app = FastAPI(title="Resume-JD Matcher", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return await health_check()


@app.post("/score", response_model=ScoreResponse)
async def score(
    resume: UploadFile = File(...),
    jd_text: str = Form(default=""),
    jd_file: UploadFile | None = File(default=None),
):
    # Resolve JD text: prefer uploaded file, fall back to pasted text
    if jd_file and jd_file.filename:
        try:
            jd_bytes = await jd_file.read()
            jd_content = parse_upload(jd_file.filename, jd_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"JD file: {e}")
    elif jd_text and jd_text.strip():
        jd_content = jd_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Provide either jd_text or jd_file.")

    # Parse resume
    try:
        resume_bytes = await resume.read()
        resume_content = parse_upload(resume.filename, resume_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Resume: {e}")

    # Score
    try:
        result = await score_resume(jd_content, resume_content)
    except OllamaError as e:
        raise HTTPException(status_code=503, detail=f"Ollama error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    return result


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
