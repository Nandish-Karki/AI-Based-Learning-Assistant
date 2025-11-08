from flask import Blueprint, request, jsonify
from app.services.upload_service import (
    upload_document_to_firestore_storage,
    client,
    add_note,
    get_notes
)
from app.utils.jwt_handler import verify_token
from app.config.firebase import db # Import db

upload_bp = Blueprint("upload", __name__)

@upload_bp.route("/upload-doc", methods=["POST"])
def upload():

    # 1. Extract Bearer token
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ", 1)[1]

    # 2. Pull file & metadata from form
    uploaded_file = request.files.get("file")
    document_name = request.form.get("documentName")

    # 3. Delegate to the service layer
    result, status_code = upload_document_to_firestore_storage(
        token,
        uploaded_file,
        document_name
    )

    # 4. Return JSON + HTTP status
    return jsonify(result), status_code

@upload_bp.route("/index/<document_id>", methods=["GET"])
def get_resource_index(document_id):
    # returns count of modules
    collection = client.get_collection(name="llm_tutor_docs")
    results = collection.get(where={"document_id": document_id})
    modules = []
    for doc, metadata in zip(results["documents"], results["metadatas"]):
        modules.append({
            "module": metadata["module"],
            "preview": doc[:100] + "..." if len(doc) > 100 else doc,
            "length": len(doc)
        })

    return jsonify({
        "moduleCount": len(results["documents"]),
        "modules": sorted(modules, key=lambda x: x["module"])
    })

@upload_bp.route("/module/<document_id>/<int:module_number>", methods=["GET"])
def get_module_text(document_id, module_number):
    collection = client.get_collection(name="llm_tutor_docs")
    result = collection.get(where={"document_id": document_id}, limit=1,
                            where_document={"$contains": f"{module_number}"})

    print(result)
    if not result["documents"]:
        return jsonify({"error": "Module not found"}), 404

    return jsonify({
        "module": module_number,
        "text": result["documents"][0],
        "length": len(result["documents"][0])
    })
def get_user_email_from_request():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    decoded = verify_token(token)
    return decoded.get("email")


@upload_bp.route("/notes/<document_id>/<int:chapter>", methods=["POST"])
def post_note(document_id, chapter):
    user_email = get_user_email_from_request()
    note_text = request.json.get("note")
    if not note_text:
        return jsonify({"error": "Missing 'note' in request body"}), 400
    add_note(document_id, chapter, note_text,user_email)
    return jsonify({"status": "success"})

@upload_bp.route("/notes/<document_id>/<int:chapter>", methods=["GET"])
def get_all_notes(document_id, chapter):
    user_email = get_user_email_from_request()
    notes = get_notes(document_id, chapter, user_email)
    return jsonify({"notes": notes})

@upload_bp.route("/search", methods=["GET"])
def search_documents():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Missing 'query' parameter"}), 400

    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    decoded = verify_token(token)
    user_email = decoded.get("email")

    # Delegate to service layer for actual search logic
    from app.services.upload_service import search_documents_by_query
    results = search_documents_by_query(query, user_email)
    return jsonify({"results": results})

@upload_bp.route("/documents/<user_email>", methods=["GET"])
def get_user_documents(user_email):
    # 1. Verify token
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ", 1)[1]
    
    decoded = verify_token(token)
    if not decoded or decoded.get("email") != user_email:
        return jsonify({"error": "Unauthorized"}), 401

    # 2. Fetch documents from Firestore
    docs_ref = db.collection("documents").document(user_email)
    
    # Get all subcollections (document names) under the user's document
    document_names_stream = docs_ref.collections()
    
    documents = []
    for doc_name_collection in document_names_stream:
        # For each document name, get the actual document info (assuming it's under a doc_id)
        for doc_id_doc in doc_name_collection.stream():
            doc_data = doc_id_doc.to_dict()
            documents.append({
                "documentId": doc_data.get("documentId"),
                "documentName": doc_data.get("documentName"),
                "uploadedAt": doc_data.get("uploadedAt").isoformat() if doc_data.get("uploadedAt") else None,
                "url": doc_data.get("url")
            })
    
    return jsonify({"documents": documents}), 200
