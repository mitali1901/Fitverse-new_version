from flask import Blueprint, request, jsonify
from app.services.diet_service import DietService

diet_bp = Blueprint("diet_bp", __name__)

@diet_bp.route("/plan", methods=["POST"])
def create_diet_plan():
    try:
        data = request.get_json() or {}
        answers = data.get("answers") or data
        if not answers:
            return jsonify({"success": False, "error": "Diet questionnaire answers are required."}), 400

        plan = DietService.generate_plan(answers)
        return jsonify({"success": True, "plan": plan}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
