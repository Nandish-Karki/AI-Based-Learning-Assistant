import uuid
import datetime
from flask import current_app
from app.config.firebase import db
from app.helpers.storage_helper import upload_file_to_storage
from app.helpers.upload_helpers import (
    is_resume_parsable,
    extract_text_from_pdf,
    extract_text_from_docx
)
from app.utils.jwt_handler import verify_token
from app.helpers.document_parser import download_and_read_file, chunk_text


# ChromaDB setup (Singleton client + consistent embedding function)
import chromadb
from chromadb.config import Settings
from chromadb import PersistentClient
from chromadb.utils import embedding_functions

client = PersistentClient(path="chroma_storage")
chroma_embedder  = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
collection = client.get_or_create_collection("llm_tutor_docs", embedding_function=chroma_embedder)

# In-memory notes store


def upload_document_to_firestore_storage(token: str, file, document_name: str):
    """
    Verify token, validate & parse the file, upload to Cloud Storage,
    extract its text, index it, and record metadata in Firestore.

    Returns: (payload: dict, http_status: int)
    """
    # 1️ Auth
    decoded = verify_token(token)
    email = decoded.get("email")
    if not email:
        return {"status": "failure", "message": "Invalid token"}, 401

    # 2️ File presence & name
    if file is None or not getattr(file, "filename", ""):
        return {"status": "failure", "message": "No file provided"}, 400

    filename = file.filename
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext not in ("pdf", "docx"):
        return {"status": "failure", "message": "Only PDF or DOCX allowed"}, 400

    # 3️ Check name‐collision
    user_docs_col = db \
        .collection("documents") \
        .document(email) \
        .collection(document_name)
    existing = list(user_docs_col.limit(1).stream())
    if existing:
        return {
            "status":  "failure",
            "message": f"Document name '{document_name}' already exists"
        }, 409

    # 4️ Parsability
    file.stream.seek(0)
    if not is_resume_parsable(file.stream, filename):
        return {"status": "failure", "message": "Document is not parsable"}, 422

    # 5️ Extract text
    file.stream.seek(0)
    if ext == "pdf":
        extracted_text = extract_text_from_pdf(file.stream)
    else:
        extracted_text = extract_text_from_docx(file.stream)

    # 5. Upload binary to GCS
    file.stream.seek(0)
    doc_id = str(uuid.uuid4())
    # include doc_id in storage path so files won’t collide
    storage_folder = f"documents/{email}/{document_name}/{doc_id}"
    public_url, storage_path = upload_file_to_storage(
        file,
        filename,
        folder=storage_folder
    )

    # 6. Write metadata to Firestore
    doc_ref = db.document(storage_folder)
    doc_ref.set({
        "email":         email,
        "documentName":  document_name,
        "documentId":    doc_id,
        "filename":      filename,
        "url":           public_url,
        "storagePath":   storage_path,
        "extractedText": extracted_text,
        "uploadedAt":    datetime.datetime.utcnow()
    })

    # 7. Index into ChromaDB
    try:
        chunks_data = index_document(doc_id, public_url, document_name, email)
        num_chunks = len(chunks_data)
        print(f" Indexed {num_chunks} chunks for document ID: {doc_id}")

        # Save module data to Firestore for audio service
        modules_data = []
        for idx, chunk_content in enumerate(chunks_data):
            modules_data.append({
                "module_number": idx,
                "module_content": chunk_content,
                "preview": chunk_content[:100] + "..." if len(chunk_content) > 100 else chunk_content,
                "length": len(chunk_content)
            })
        
        db.collection("Indexes").document(email).collection(document_id).document("modules").set({
            "modules": modules_data
        })

    except Exception as e:
        print("Error during indexing:", str(e))

    return {
        "status":      "success",
        "message":     "Document uploaded and indexed successfully",
        "documentUrl": public_url,
        "documentId":  doc_id
    }, 201


def index_document(document_id: str, document_url: str, document_name: str, user_email: str):
    """
    Download document, chunk text, and add to ChromaDB.
    Returns: list of chunk contents
    """
    print(f"Indexing document ID: {document_id}")
    text = download_and_read_file(document_url)
    if not text:
        raise ValueError("No text extracted from document")

    chunks = chunk_text(text)
    print(f" {len(chunks)} chunks extracted")

    for idx, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            metadatas=[{"document_id": document_id, "module": idx, "documentName": document_name, "email": user_email}],
            ids=[f"{document_id}_{idx}"]
        )
    return chunks # Return chunks content for Firestore saving


def add_note(document_id, module, note_text, user_email):
    doc_ref = db.collection("notes").document(f"{user_email}_{document_id}_{module}")
    doc = doc_ref.get()
    if doc.exists:
        notes = doc.to_dict().get("notes", [])
    else:
        notes = []
    notes.append(note_text)
    doc_ref.set({
        "notes": notes,
        "email": user_email,
        "documentId": document_id,
        "module": module
    })
    return {"status": "success", "message": "Note added"}

def get_notes(document_id, module, user_email):
    doc_ref = db.collection("notes").document(f"{user_email}_{document_id}_{module}")
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("notes", [])
    return []

def search_documents_by_query(query: str, user_email: str):
    """
    Searches ChromaDB for documents matching the query and user email.
    """
    results = collection.query(
        query_texts=[query],
        n_results=10,  # Limit to 10 results for now
        where={"email": user_email}
    )

    found_documents = []
    if results and results["ids"]:
        # Use a set to store unique document IDs to avoid duplicates in search results
        unique_document_ids = set()
        for doc_id_with_module, doc_content, metadata in zip(results["ids"][0], results["documents"][0], results["metadatas"][0]):
            document_id = metadata["document_id"]
            
            if document_id not in unique_document_ids:
                unique_document_ids.add(document_id)
                # Fetch document name from Firestore using document_id
                # This requires knowing the documentName to construct the path, which is a circular dependency.
                # A better approach is to store documentName directly in ChromaDB metadata.
                # Since we already added documentName to ChromaDB metadata, we can use it directly.
                document_name = metadata.get("documentName", "Unknown Document")

                found_documents.append({
                    "documentId": document_id,
                    "documentName": document_name,
                    "preview": doc_content[:100] + "..." if len(doc_content) > 100 else doc_content,
                })
    return found_documents
