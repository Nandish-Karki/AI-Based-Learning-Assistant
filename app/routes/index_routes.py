# from flask import Blueprint, request, jsonify
# from app.utils.jwt_handler import verify_token
# from app.services.index_service import get_resource_index
# index_bp = Blueprint("index", __name__)

# @index_bp.route("/get-index/<document_id>", methods=["GET"])
# def get_index_ofdoc(document_id):
#     auth_header = request.headers.get("Authorization", "")
#     token = None
#     token = request.headers.get("Authorization", "").replace("Bearer ", "")
#     decoded = verify_token(token)
#     user_email=decoded.get("email")
    

#     result = get_resource_index(document_id, user_email)

#     return result


# app/routes/index_routes.py
from flask import Blueprint, request, jsonify
from app.utils.jwt_handler import verify_token
from app.services.index_service import get_resource_index
from app.config.firebase import db  # ✅ FIX: import db

index_bp = Blueprint("index", __name__)

# Existing: get index for a single document_id
@index_bp.route("/get-index/<document_id>", methods=["GET"])
def get_index_ofdoc(document_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    decoded = verify_token(token)
    user_email = decoded.get("email")

    result, status_code = get_resource_index(document_id, user_email)
    return jsonify(result), status_code

# New: list all cached modules for the current user (used by the dashboard)
@index_bp.route("/get-index/all", methods=["GET"])
def get_all_indexes():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "Missing token"}), 401

    decoded = verify_token(token)
    email = decoded.get("email")
    if not email:
        return jsonify({"error": "Invalid token"}), 401

    # Under Indexes/{email}/ we keep a subcollection per document_id
    root = db.collection("Indexes").document(email)

    # List all subcollections (each subcollection ID is a document_id)
    try:
            subcols = list(root.collections())
    except Exception as e:
        return jsonify({"error": f"Failed to list indexes: {e}"}), 500

    modules_flat = []
    for sub in subcols:
        document_id = sub.id
        mdoc = sub.document("modules").get()
        if not mdoc.exists:
            continue
        modules = mdoc.to_dict().get("modules", [])
        for m in modules:
            modules_flat.append({
                "document_id": document_id,
                "module_number": m.get("module_number"),
                "module_name": m.get("module_name") or "Untitled"
            })

    return jsonify({"modules": modules_flat})
