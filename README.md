# Groq + ChromaDB RAG

A professional Retrieval-Augmented Generation (RAG) application that combines **Groq-powered LLM inference** with **ChromaDB vector search** to provide intelligent, context-aware answers from user-provided documents.

The system allows users to upload documents, process and index their content, retrieve relevant information from the vector database, and ask natural-language questions through a modern AI interface.

---

## Overview

Traditional AI assistants may generate responses without having access to a user's private documents. This project addresses that limitation using a Retrieval-Augmented Generation architecture.

The application follows this workflow:

```text
User Documents
      │
      ▼
Document Upload
      │
      ▼
Document Ingestion
      │
      ▼
Text Processing & Chunking
      │
      ▼
Embeddings / Vector Storage
      │
      ▼
ChromaDB
      │
      ▼
Relevant Context Retrieval
      │
      ▼
Groq LLM
      │
      ▼
Grounded AI Response
```

This approach allows the application to answer questions using information retrieved from the indexed knowledge base.

---

## Key Features

### Document Intelligence

* Upload multiple documents at once
* Supported formats:

  * PDF
  * TXT
  * Markdown
  * DOCX
* Automatic document ingestion
* Content indexing into the vector database
* Indexed chunk tracking

### RAG Question Answering

* Natural-language question answering
* Semantic retrieval using ChromaDB
* Configurable number of retrieved chunks
* Optional source/document filtering
* Context-aware responses generated through Groq

### Modern Web Interface

* Professional AI dashboard
* Dark modern interface
* Document upload interface
* Interactive chat experience
* Retrieval settings
* Backend connection status
* Indexed chunk counter
* Retrieved source display
* Responsive design for desktop and mobile

### Backend API

The application is powered by FastAPI and exposes dedicated endpoints for:

* Frontend delivery
* Health monitoring
* Document ingestion
* RAG querying

---

## Technology Stack

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Python     | Core application language     |
| FastAPI    | Backend REST API              |
| Groq       | LLM inference                 |
| ChromaDB   | Vector database and retrieval |
| RAG        | Knowledge-grounded generation |
| HTML       | Frontend structure            |
| CSS        | UI styling                    |
| JavaScript | Frontend interaction          |
| Pydantic   | Request validation            |

---

## Project Structure

```text
Groq-ChromaDB-RAG/
│
├── api.py
├── ingest.py
│
├── app/
│   └── rag_service.py
│
├── data/
│   └── uploaded documents
│
├── index.html
├── style.css
├── script.js
│
├── requirements.txt
└── README.md
```

---

## RAG Architecture

The application separates the document ingestion and question-answering stages.

### 1. Document Ingestion

Users upload supported documents through the web interface.

The backend validates the uploaded file type and saves the documents inside the application's data directory.

Supported extensions include:

```text
.pdf
.txt
.md
.docx
```

The backend then executes the ingestion pipeline and indexes the processed document content.

---

### 2. Vector Retrieval

Once documents have been indexed, ChromaDB stores the vector representations of document chunks.

When a user asks a question, the RAG service retrieves the most relevant chunks from the knowledge base.

The number of retrieved chunks can be controlled using the `top_k` parameter.

---

### 3. Context-Aware Generation

The retrieved information is passed to the RAG service, which generates the final response using the configured Groq-powered language model.

This creates a workflow where retrieval happens before generation:

```text
Question
   ↓
Semantic Search
   ↓
Relevant Chunks
   ↓
Context
   ↓
Groq LLM
   ↓
Final Answer
```

---

# API Endpoints

## Health Check

```http
GET /health
```

Returns the current RAG service status and the number of indexed chunks.

Example:

```json
{
  "status": "ok",
  "indexed_chunks": 125
}
```

---

## Document Ingestion

```http
POST /ingest
```

Accepts multiple uploaded documents.

Example supported files:

```text
research.pdf
notes.txt
documentation.md
report.docx
```

The endpoint saves the files, executes the ingestion pipeline, and returns indexing information.

---

## RAG Query

```http
POST /rag/query
```

Used to ask questions about the indexed knowledge base.

Example request:

```json
{
  "question": "What are the main findings of the document?",
  "top_k": 5,
  "source": null
}
```

### Parameters

| Parameter  | Type          | Description                     |
| ---------- | ------------- | ------------------------------- |
| `question` | string        | User's question                 |
| `top_k`    | integer       | Number of chunks to retrieve    |
| `source`   | string / null | Optional document/source filter |

`top_k` supports values from **1 to 20**.

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

---

## 2. Create a Virtual Environment

### Windows

```powershell
python -m venv venv
```

Activate it:

```powershell
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
GROQ_API_KEY=your_groq_api_key
```

Do not commit your `.env` file to GitHub.

Add it to `.gitignore`:

```text
.env
venv/
__pycache__/
*.pyc
```

---

# Running the Application

Start the FastAPI server:

```bash
uvicorn api:app --reload
```

The application will be available at:

```text
http://127.0.0.1:8000
```

Open the address in your browser to access the RAG interface.

FastAPI's interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

# Using the Application

### Step 1 — Upload Documents

Click **Add Documents** and select one or multiple supported files.

```text
PDF
TXT
MD
DOCX
```

### Step 2 — Index Documents

The backend processes the uploaded files and adds their content to the RAG knowledge base.

### Step 3 — Ask Questions

Enter a natural-language question in the chat interface.

For example:

```text
What is the main objective of this research paper?
```

or:

```text
Summarize the key findings.
```

### Step 4 — Adjust Retrieval

Use the retrieval controls to change:

```text
Top K
Source Filter
```

This allows the user to control how much retrieved context is considered for the response.

---

# Example Use Cases

The architecture can be used for:

* Research paper analysis
* Personal document assistants
* Technical documentation search
* Academic knowledge bases
* Company knowledge assistants
* Study assistants
* Internal document search
* PDF question-answering systems
* Knowledge management applications

---

# Why RAG?

A standard LLM relies primarily on information encoded during training.

RAG introduces an additional retrieval layer:

```text
User Question
      ↓
Knowledge Retrieval
      ↓
Relevant Documents
      ↓
LLM Generation
```

This makes it possible to build assistants that work with information contained in a user's own document collection.

---

# Error Handling

The backend includes handling for common application failures, including:

* Missing uploaded files
* Unsupported file types
* Missing ingestion pipeline
* Document ingestion failures
* Ingestion timeout
* Uninitialized RAG service
* Invalid questions
* Runtime errors

This helps the application return structured API errors instead of silently failing.

---

# API Validation

The application uses Pydantic request models to validate RAG queries.

The question must contain at least one character, while `top_k` is restricted to a valid retrieval range.

This provides basic input validation before requests reach the RAG service.

---

# Performance Considerations

The system is designed around a retrieval-first architecture.

Instead of passing an entire document collection to the language model, relevant chunks are retrieved from ChromaDB and used as context.

Benefits include:

* Reduced unnecessary context
* More targeted retrieval
* Better scalability for document collections
* Lower context overhead
* More relevant responses

---

# Security Notes

For production deployment, consider adding:

* Authentication and authorization
* File size restrictions
* MIME-type validation
* Rate limiting
* API key protection
* Secure CORS configuration
* HTTPS
* User-specific document collections
* Persistent database configuration
* Logging and monitoring

The current development configuration allows all CORS origins, so this should be restricted before production deployment.

---

# Future Improvements

Potential extensions include:

* Streaming Groq responses
* Conversation history
* User authentication
* Persistent chat sessions
* Document management dashboard
* Delete/re-index documents
* Advanced source citations
* PDF preview
* Drag-and-drop uploads
* Metadata filtering
* Multi-user workspaces
* Retrieval evaluation
* RAG observability and analytics
* Deployment with Docker
* Cloud deployment

---

# Screenshots

Add screenshots of the application here:

```text
docs/
├── dashboard.png
├── upload.png
└── chat.png
```

Example:

```markdown
![Dashboard](docs/dashboard.png)
```

---

# Project Highlights

```text
FastAPI
   +
Document Ingestion
   +
Vector Search
   +
ChromaDB
   +
RAG Retrieval
   +
Groq LLM
   +
Modern Web UI
```

A complete pipeline for building a document-aware AI assistant.

---

# Disclaimer

This project is intended for educational, research, and portfolio purposes.

The quality of generated responses depends on the quality of the indexed documents, retrieval configuration, embeddings, and language model.

---

# Author

**Your Name**

AI / ML Developer
Python | RAG | LLM Applications | FastAPI | Vector Databases

---

## License

```text
MIT License
```
