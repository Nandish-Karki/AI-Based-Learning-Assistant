
# from flask import request, jsonify
# from app.helpers.polly_helper import synthesize_speech
# from app.services.llm_service import generate_answer
# from app.services.rag_service import retrieve_relevant_chunks  # ✅ RAG retriever

# def handle_question():
#     data = request.get_json()
#     question = data.get('question')
#     email = data.get("email")
#     document_id = data.get("documentId")
#     emotion = data.get('emotion', 'neutral')
#     print(data)
#     # Input validation
#     if not all([question, email, document_id]):
#         return jsonify({"error": "Missing required fields"}), 400

#     #  RAG: Retrieve top relevant chunks using ChromaDB
#     relevant_chunks = retrieve_relevant_chunks(question, document_id, top_k=5)
#     print(f"Retrieved {len(relevant_chunks)} relevant chunks")
#     if not relevant_chunks:
#         return jsonify({"error": "No relevant content found"}), 404

#     #  Combine retrieved chunks for LLM input
#     combined_context = "\n\n".join([c["chunk"] for c in relevant_chunks])

#     #  Generate LLM-based answer
#     answer_data = generate_answer(question, combined_context, emotion)

#     #  Optional TTS
#     # audio_url = synthesize_speech(answer_data["answer"], emotion)

#     #  Return full response
#     return jsonify({
#         "answer": answer_data["answer"],
#         "supporting_texts": answer_data.get("supporting_texts", []),
#         "emotion": emotion,
#         "mode": "rag",
#         "document_id": document_id,
#         "retrieved_chunks": relevant_chunks,  # Optional: remove this if you want a cleaner response
#         # "ssmlAudioURL": audio_url
#     })

# app/services/qa_service.py
from flask import request, jsonify
from app.utils.jwt_handler import verify_token
from app.services.rag_service import retrieve_relevant_chunks
from app.services.llm_service import generate_answer

def handle_question():
    data = request.get_json() or {}
    question = data.get('question')
    document_id = data.get('documentId') or data.get('document_id')  # be liberal in what you accept
    emotion = (data.get('emotion') or 'neutral').lower()

    # Derive user from JWT (do not trust body)
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    decoded = verify_token(token)
    email = decoded.get("email")

    if not question:
        return jsonify({"error": "Missing field: question"}), 400
    if not email:
        return jsonify({"error": "Invalid or missing token"}), 401
    if not document_id:
        return jsonify({"error": "No document is selected. Open a module first."}), 400

    # Retrieve relevant chunks via RAG
    relevant_chunks = retrieve_relevant_chunks(question, document_id, top_k=5)
    if not relevant_chunks:
        return jsonify({"error": "No relevant content found"}), 404

    combined_context = "\n\n".join([c["chunk"] for c in relevant_chunks])
    answer_data = generate_answer(question, combined_context, emotion)

    return jsonify({
        "answer": answer_data.get("answer", ""),
        "supporting_texts": answer_data.get("supporting_texts", []),
        "emotion": emotion,
        "mode": "rag",
        "document_id": document_id,
        # "retrieved_chunks": relevant_chunks,  # uncomment if you want to return them
    })

def get_user_qna_history(user_email: str):
    """
    Retrieves all Q&A history for a given user from Firestore.
    """
    from app.config.firebase import db # Import db here to avoid circular dependency if qa_service is imported by other services that also import db

    qna_history = []
    # Assuming Q&A history is stored under a 'qna_history' collection
    # and each document within it has an 'email' field
    docs = db.collection("qna_history").where("email", "==", user_email).stream()

    for doc in docs:
        qna_data = doc.to_dict()
        qna_history.append({
            "question": qna_data.get("question"),
            "answer": qna_data.get("answer"),
            "documentId": qna_data.get("document_id"),
            "moduleNumber": qna_data.get("module_number"), # Assuming module_number is stored
            "timestamp": qna_data.get("timestamp").isoformat() if qna_data.get("timestamp") else None
        })
    return qna_history
