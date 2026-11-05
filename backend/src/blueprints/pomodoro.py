from flask import Blueprint, jsonify, request
from services.pomodoro_service import PomodoroService

pomodoro_bp = Blueprint("pomodoro", __name__)


@pomodoro_bp.route("/api/pomodoro/sessions", methods=["GET"])
def list_sessions():
    date_str = request.args.get("date")
    sessions = PomodoroService.list_by_date(date_str)
    return jsonify([s.to_dict() for s in sessions])


@pomodoro_bp.route("/api/pomodoro/sessions", methods=["POST"])
def create_session():
    data = request.json or {}
    try:
        session = PomodoroService.create(data)
        return jsonify(session.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@pomodoro_bp.route("/api/pomodoro/sessions/<int:session_id>", methods=["PATCH"])
def update_session(session_id: int):
    data = request.json or {}
    try:
        session = PomodoroService.update_session(session_id, data)
        if not session:
            return jsonify({"error": "Sessão não encontrada"}), 404
        return jsonify(session.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@pomodoro_bp.route("/api/pomodoro/sessions/<int:session_id>", methods=["DELETE"])
def delete_session(session_id: int):
    success = PomodoroService.delete_session(session_id)
    if not success:
        return jsonify({"error": "Sessão não encontrada"}), 404
    return jsonify({"message": "Sessão excluída com sucesso"})

