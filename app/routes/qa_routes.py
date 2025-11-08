from flask import Blueprint, jsonify
from app.services.qa_service import handle_question

qa_bp = Blueprint('qa', __name__)

# POST /api/module/ask-question
@qa_bp.route('/ask-question', methods=['POST'])
def ask_question():
    return handle_question()

@qa_bp.route('/history/<user_email>', methods=['GET'])
def get_qna_history(user_email):
    from app.services.qa_service import get_user_qna_history
    history = get_user_qna_history(user_email)
    return jsonify({"qna_history": history}), 200
