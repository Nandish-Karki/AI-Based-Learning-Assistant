from flask import Blueprint, request, jsonify
from app.services.roadmap_service import save_roadmap_for_user

roadmap_bp = Blueprint("roadmap", __name__)

@roadmap_bp.route("/generate-roadmap", methods=["POST"])
def generate_roadmap():
    # 1. Extract Bearer token
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ", 1)[1]

    # 2. Extract payload
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required = ["documentId", "documentName", "userEmail", "duration", "hoursPerDay", "purpose"]
    missing = [key for key in required if key not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # 3. Call service
    # The save_roadmap_for_user function expects 'token' and a 'data' dictionary.
    # We need to ensure the 'data' dictionary contains all necessary fields for the service.
    roadmap_data = {
        "documentId": data.get("documentId"),
        "documentName": data.get("documentName"),
        "userEmail": data.get("userEmail"),
        "duration": data.get("duration"),
        "hoursPerDay": data.get("hoursPerDay"),
        "purpose": data.get("purpose"),
        "learningType": data.get("learningType", "general") # Default to 'general' if not provided by frontend
    }
    result, status_code = save_roadmap_for_user(token, roadmap_data)

    # 4. Respond
    return jsonify(result), status_code
