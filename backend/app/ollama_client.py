"""Thin async client for Ollama's /api/generate endpoint."""
import json
import httpx
from . import config


class OllamaError(Exception):
    pass


async def generate_json(prompt: str, system: str = "") -> dict:
    """Call Ollama with format=json for guaranteed JSON output."""
    payload = {
        "model": config.LLM_MODEL,
        "prompt": prompt,
        "system": system,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": config.LLM_TEMPERATURE,
            "num_ctx": config.LLM_NUM_CTX,
        },
    }

    timeout = httpx.Timeout(config.LLM_TIMEOUT_SECONDS)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{config.OLLAMA_HOST}/api/generate", json=payload
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.ConnectError as e:
        raise OllamaError(
            f"Cannot connect to Ollama at {config.OLLAMA_HOST}. "
            "Run `ollama serve` and ensure the model is pulled."
        ) from e
    except httpx.HTTPStatusError as e:
        raise OllamaError(f"Ollama returned {e.response.status_code}: {e.response.text}") from e

    raw = data.get("response", "").strip()
    if not raw:
        raise OllamaError("Empty response from Ollama.")

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise OllamaError(f"Model returned invalid JSON: {raw[:500]}") from e


async def health_check() -> dict:
    """Check if Ollama is reachable and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{config.OLLAMA_HOST}/api/tags")
            resp.raise_for_status()
            models = [m["name"] for m in resp.json().get("models", [])]
            model_ok = any(config.LLM_MODEL in m for m in models)
            return {
                "ollama_reachable": True,
                "available_models": models,
                "target_model_present": model_ok,
                "target_model": config.LLM_MODEL,
            }
    except Exception as e:
        return {"ollama_reachable": False, "error": str(e)}
