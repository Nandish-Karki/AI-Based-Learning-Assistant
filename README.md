# LLM Tutor

LLM Tutor is a full-stack learning assistant that turns user documents into interactive study modules. Users upload PDFs/DOCX files, the backend cleans and chunks them, stores the content in Firebase + ChromaDB, and exposes workflows such as semantic search, RAG-powered Q&A, note taking, personalized roadmaps, and AWS Polly audio narration. A React dashboard wraps the entire experience.

---

## Feature Highlights

- **Authentication** – bcrypt + JWT sign-in/sign-up backed by Firestore (`app/services/auth_service.py`).
- **Document ingestion** – validates, parses, and uploads PDF/DOCX files, stores binaries in Firebase Storage, metadata in Firestore, and content in ChromaDB for retrieval (`app/services/upload_service.py`).
- **Automatic module builder** – cleans text with spaCy/TextStat/Ollama heuristics, titles modules with LLaMA 3.2 via Ollama, and caches structured modules per user (`app/services/index_service.py`).
- **RAG-powered Q&A** – retrieves the most relevant chunks from ChromaDB and feeds them to Gemini 2.5 Flash for grounded answers with emotional tone control (`app/services/qa_service.py`, `app/services/llm_service.py`).
- **Learning dashboard** – React + Tailwind UI for uploads, document browsing, module view, semantic search, and Q&A history (`frontend/src`).
- **Notes & personalization** – Firestore-backed notes per module and a roadmap capture flow (`app/routes/upload_routes.py`, `app/routes/roadmap_routes.py`).
- **Audio read-along** – generates SSML, calls AWS Polly, and stores public audio URLs for each module (`app/services/audio_service.py`).

---

## System Architecture

```
[React SPA (frontend/src)]
        ⇅ Axios / REST
[Flask API (main.py)]
        ⇅ Firebase Admin SDK
[Firestore] ─ stores users, documents, modules, notes, roadmaps, Q&A logs
[Firebase Storage] ─ raw uploads + generated audio
[ChromaDB + SentenceTransformers] ─ semantic chunks per document
        ⇅
[Gemini 2.5 Flash] ─ grounded answers
[Ollama LLaMA 3.2] ─ module titles + text filtering
[AWS Polly] ─ SSML → narration + speech marks
```

---

## Repository Layout

| Path | Notes |
| --- | --- |
| `main.py` | Flask entry point registering every blueprint. |
| `app/routes/` | HTTP surface for auth, upload/index, roadmap, audio, and QA. |
| `app/services/` | Core business logic (ingestion, RAG, LLM calls, audio, etc.). |
| `app/helpers/` | PDF/DOCX parsing, Firebase storage helpers, text cleaning, SSML helpers. |
| `app/utils/jwt_handler.py` | Token generation/verification (replace the hard-coded secret for production). |
| `frontend/` | React dashboard with Tailwind styling and MUI widgets. |
| `chroma_storage/` | Persistent ChromaDB collection. |
| `output/` | Local cache for generated audio/mp3 + speech-mark JSON. |
| `.aws/`, `firebase_token.json`, `.env` | Secrets; never commit them. Ensure `.gitignore` covers these. |

---

## Prerequisites

- Python 3.10+
- Node.js 18+ / npm
- Firebase project with Firestore & Storage enabled (service account JSON downloaded as `firebase_token.json`)
- Google Gemini API access
- Ollama running locally with `llama3.2:latest` pulled
  ```bash
  ollama pull llama3.2:latest
  ```
- AWS account with Polly enabled (export `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION=us-east-1`)
- spaCy English model (first-time setup)
  ```bash
  python -m spacy download en_core_web_sm
  ```

---

## Configuration

Create `.env` in the repo root (loaded in `app/services/llm_service.py`) and fill with placeholders:

```dotenv
GEMINI_API_KEY=your-google-generative-ai-key
JWT_SECRET=super-secret-string
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
OLLAMA_HOST=http://127.0.0.1:11434
```

Additional secrets:

- Place your Firebase service account JSON at `firebase_token.json` (already imported by `app/config/firebase.py` & helpers).
- Keep `~/.aws/credentials` or `.aws/credentials` populated for AWS SDK fallback.

---

## Backend Setup

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. (One-time) download the spaCy model
python -m spacy download en_core_web_sm

# 4. Launch the API
python main.py  # serves on http://localhost:8000
```

The Flask app auto-loads all blueprints (`main.py`) and serves the compiled React build from `frontend/` when deployed.

---

## Frontend Setup

```bash
cd frontend
npm install
npm start          # CRA dev server on http://localhost:3000
# or
npm run build      # produces production assets under frontend/build
```

During development, keep both the CRA dev server and Flask API running; CRA proxies API calls to `localhost:8000`.

---

## Typical Workflow

1. **Register / Login** at `/auth/register` and `/auth/login` to obtain a JWT (stored in `localStorage` by the frontend).
2. **Upload a document** from the Dashboard → Upload tab. The backend parses, validates, uploads to Firebase Storage, and indexes it in ChromaDB.
3. **Browse modules** in `/document/:documentId` to see AI-generated module names, similarity/confidence scores, and previews.
4. **Open a module** in `/document/:documentId/module/:moduleNumber` to read cleaned text, add notes, ask questions, request a learning roadmap, or trigger Polly audio.
5. **Ask questions** via the QA tab: Gemini consumes the retrieved chunks and returns grounded answers; history is available under `/qna`.
6. **Search & discover** using the semantic search tab, which queries ChromaDB for your documents only.
7. **Review generated audio** (stored under `audio/{email}/{documentId}/moduleN.mp3` in Firebase Storage) or download it for offline listening.

---

## API Reference (condensed)

| Method & Path | Description | Auth |
| --- | --- | --- |
| `POST /auth/register` | Email/password registration → JWT issued | No |
| `POST /auth/login` | Login → JWT issued | No |
| `POST /upload/upload-doc` | Multipart upload (`file`, `documentName`) | Bearer |
| `GET /upload/index/<document_id>` | Module count + previews from ChromaDB | Bearer |
| `GET /upload/module/<document_id>/<module_number>` | Raw chunk text | Bearer |
| `GET/POST /upload/notes/<document_id>/<module>` | Fetch or append notes | Bearer |
| `GET /upload/search?query=...` | Semantic search limited to user email | Bearer |
| `GET /upload/documents/<user_email>` | List all uploaded docs for the user | Bearer (must match user_email) |
| `GET /index/get-index/<document_id>` | Cached module metadata (names, similarity) | Bearer |
| `GET /index/get-index/all` | Flattened list of cached modules for dashboard widgets | Bearer |
| `POST /roadmap/generate-roadmap` | Persist roadmap requirements per document | Bearer |
| `POST /audio/generate-module-audio` | Produce SSML, Polly audio, and speech marks | Bearer |
| `POST /qa/ask-question` | RAG + Gemini answer for active document/module | Bearer |
| `GET /qa/history/<user_email>` | User’s Q&A history from Firestore | Bearer |

> **Note:** All protected endpoints expect `Authorization: Bearer <token>` and infer the user email from the token instead of trusting client payloads (`app/utils/jwt_handler.py`).

---

## Data & Storage

- **Firestore**  
  - `users/` – auth records  
  - `documents/{email}/{documentName}/{docId}` – metadata + extracted text  
  - `Indexes/{email}/{documentId}` – cached module list used by index service  
  - `notes/{email_documentId_module}` – note arrays  
  - `qna_history/` – stored answers (if enabled)  
  - `roadmapRequirement/{email}/roadmaps/{documentId}` – roadmap inputs  
  - `SSML/{email}/{documentId}` – Polly metadata

- **Firebase Storage**  
  - `documents/{email}/{documentName}/{docId}/...` – raw uploads  
  - `audio/{email}/{documentId}/moduleN.mp3` – Polly audio files  
  - `QA/audio_*.mp3` – optional QA narration (from `app/helpers/polly_helper.py`)

- **ChromaDB (`chroma_storage/`)**  
  - Collection `llm_tutor_docs` stores each chunk with metadata `{document_id, module, documentName, email}`.

- **Local cache (`output/`)**  
  - Temporary MP3 + speech-mark JSON files created before uploading to Storage.

---

## LLM & Speech Dependencies

- **Gemini 2.5 Flash** (`app/services/llm_service.py`) – requires `GEMINI_API_KEY`; returns markdown or JSON answers that are parsed defensively.  
- **Ollama LLaMA 3.2** – used both for quick module naming and filtering noisy text via `app/helpers/text_cleaner.py`. Ensure the Ollama daemon is reachable (`OLLAMA_HOST`) before requesting indexes.  
- **AWS Polly** – `app/services/audio_service.py` produces SSML with word-level `<mark>` tags so the frontend can sync text and speech.

---

## Development Tips & Troubleshooting

- **spaCy / Text cleaning** – If indexing fails with model errors, rerun `python -m spacy download en_core_web_sm`.  
- **ChromaDB resets** – Delete `chroma_storage/` to rebuild embeddings locally (only in dev).  
- **Large documents** – `upload_helpers.is_resume_parsable` requires >50 characters of extracted text; ensure PDFs are text-based or add OCR.  
- **JWT secrets** – Replace the placeholder `SECRET_KEY` in `app/utils/jwt_handler.py` with an environment variable before shipping.  
- **Frontend auth state** – The CRA app reads `localStorage.token` and `localStorage.userEmail`; clear them to test auth redirects quickly.  
- **AWS / Firebase credentials** – Keep `.aws/` and `firebase_token.json` outside version control (already covered in `.gitignore`); rotate keys regularly.

---

## Next Steps

- Commit this README and keep it updated as the feature set grows.
- Add automated tests or linting scripts once available.
- Move hard-coded secrets (e.g., JWT secret, bucket names) into environment variables for production builds.

Happy hacking!

