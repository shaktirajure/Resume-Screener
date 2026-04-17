"""Parse uploaded files into plain text."""
import io
from pypdf import PdfReader


def parse_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)
    return "\n".join(pages).strip()


def parse_text(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


def parse_upload(filename: str, file_bytes: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        text = parse_pdf(file_bytes)
    elif name.endswith((".txt", ".md")):
        text = parse_text(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")

    if len(text) < 50:
        raise ValueError(
            f"Extracted text is too short ({len(text)} chars). "
            "The file may be an image-based PDF. OCR is not supported."
        )
    return text
