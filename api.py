from pathlib import Path
from typing import Optional
import subprocess
import sys

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.rag_service import RAGService


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"

# Your frontend files are in the main project folder
INDEX_FILE = BASE_DIR / "index.html"
STYLE_FILE = BASE_DIR / "style.css"
SCRIPT_FILE = BASE_DIR / "script.js"

DATA_DIR.mkdir(exist_ok=True)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="Groq + ChromaDB RAG",
    description="AI RAG application using Groq and ChromaDB",
    version="2.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# GLOBAL RAG SERVICE
# =========================================================

rag_service: Optional[RAGService] = None


# =========================================================
# REQUEST MODEL
# =========================================================

class QuestionRequest(BaseModel):

    question: str = Field(
        ...,
        min_length=1,
        description="Question to ask the RAG system",
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of chunks to retrieve",
    )

    source: Optional[str] = Field(
        default=None,
        description="Optional document/source filter",
    )


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():

    global rag_service

    print("========================================")
    print("Initializing RAG service...")
    print("========================================")

    rag_service = RAGService()

    print("RAG service initialized successfully.")
    print("========================================")


# =========================================================
# FRONTEND
# =========================================================

@app.get("/")
def root():

    if INDEX_FILE.exists():
        return FileResponse(INDEX_FILE)

    return {
        "message": "Groq + ChromaDB RAG API is running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/style.css")
def style_css():

    if not STYLE_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="style.css not found."
        )

    return FileResponse(
        STYLE_FILE,
        media_type="text/css",
    )


@app.get("/script.js")
def script_js():

    if not SCRIPT_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="script.js not found."
        )

    return FileResponse(
        SCRIPT_FILE,
        media_type="application/javascript",
    )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    if rag_service is None:

        return {
            "status": "starting",
            "indexed_chunks": 0,
        }

    try:

        count = rag_service.store.count()

        return {
            "status": "ok",
            "indexed_chunks": count,
        }

    except Exception as exc:

        return {
            "status": "error",
            "message": str(exc),
        }


# =========================================================
# DOCUMENT UPLOAD
# =========================================================

@app.post("/ingest")
async def ingest_documents(
    files: list[UploadFile] = File(...)
):

    if not files:

        raise HTTPException(
            status_code=400,
            detail="No files uploaded.",
        )

    allowed_extensions = {
        ".pdf",
        ".txt",
        ".md",
        ".docx",
    }

    saved_files = []

    try:

        # -----------------------------------------
        # SAVE UPLOADED FILES
        # -----------------------------------------

        for upload in files:

            filename = Path(
                upload.filename or ""
            ).name

            extension = Path(
                filename
            ).suffix.lower()

            if not filename:
                continue

            if extension not in allowed_extensions:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unsupported file type: {extension}. "
                        f"Allowed: PDF, TXT, MD, DOCX"
                    ),
                )

            destination = DATA_DIR / filename

            content = await upload.read()

            destination.write_bytes(content)

            saved_files.append(filename)

        if not saved_files:

            raise HTTPException(
                status_code=400,
                detail="No valid files uploaded.",
            )

        # -----------------------------------------
        # RUN INGEST SCRIPT
        # -----------------------------------------

        ingest_file = BASE_DIR / "ingest.py"

        if not ingest_file.exists():

            return {
                "status": "saved",
                "message": (
                    "Files saved successfully, "
                    "but ingest.py was not found."
                ),
                "files": saved_files,
            }

        result = subprocess.run(
            [
                sys.executable,
                str(ingest_file),
            ],
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:

            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Document ingestion failed.",
                    "stdout": result.stdout[-4000:],
                    "stderr": result.stderr[-4000:],
                },
            )

        # -----------------------------------------
        # CHROMA COUNT
        # -----------------------------------------

        chunk_count = 0

        try:

            if rag_service:

                chunk_count = rag_service.store.count()

        except Exception:

            chunk_count = 0

        return {

            "status": "ok",

            "message": (
                "Documents uploaded and indexed successfully."
            ),

            "files": saved_files,

            "chunks": chunk_count,

            "output": result.stdout[-2000:],
        }

    except HTTPException:

        raise

    except subprocess.TimeoutExpired:

        raise HTTPException(
            status_code=504,
            detail=(
                "Document ingestion timed out "
                "after 5 minutes."
            ),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# =========================================================
# RAG QUERY
# =========================================================

@app.post("/rag/query")
def query_rag(
    payload: QuestionRequest
):

    if rag_service is None:

        raise HTTPException(
            status_code=503,
            detail=(
                "RAG service is not initialized."
            ),
        )

    try:

        result = rag_service.ask(
            question=payload.question,
            top_k=payload.top_k,
            source=payload.source,
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except RuntimeError as exc:

        raise HTTPException(
            status_code=409,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )