from app.config.firebase import db
from app.utils.jwt_handler import verify_token

def save_roadmap_for_user(token: str, data: dict) -> tuple:
    decoded = verify_token(token)
    if not decoded or "email" not in decoded:
        return {"error": "Invalid or expired token"}, 401

    email = decoded["email"]
    # Ensure document_name is not empty or None to prevent double slashes in Firestore path
    document_name = data.get("documentName")
    if not document_name:
        return {"error": "Document name is required for roadmap."}, 400

    roadmap_payload = {
        "duration": data["duration"],
        "hoursPerDay": data["hoursPerDay"],
        "purpose": data["purpose"],
        "learningType": data["learningType"],
        "documentId": data["documentId"], # Include documentId in payload for completeness
        "documentName": document_name, # Include documentName in payload
        "userEmail": email # Ensure userEmail is explicitly in payload
    }

    # Use documentId as the document name under the user's email to avoid issues with special characters in documentName
    db.collection("roadmapRequirement") \
      .document(email) \
      .collection("roadmaps") \
      .document(data["documentId"]) \
      .set(roadmap_payload)

    return {"message": "Roadmap saved", "path": f"roadmapRequirement/{email}/{document_name}"}, 201
