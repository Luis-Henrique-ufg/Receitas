from flask import Blueprint, jsonify, request

from services.stats_service import StatsService

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/api/stats/heatmap", methods=["GET"])
def get_heatmap():
    days = request.args.get("days", 180, type=int)
    data = StatsService.get_heatmap_data(days=days)
    return jsonify(data)


@stats_bp.route("/api/stats/pomodoro", methods=["POST"])
def record_pomodoro():
    payload = request.json or {}
    study_seconds = payload.get("study_seconds", 1500)
    activity = StatsService.record_pomodoro_completed(study_seconds=study_seconds)
    return jsonify({"message": "Pomodoro registrado", "activity": activity.to_dict()})


@stats_bp.route("/api/stats/heartbeat", methods=["POST"])
def record_heartbeat():
    payload = request.json or {}
    seconds = payload.get("seconds", 0)
    activity = StatsService.record_study_seconds(seconds=seconds)
    return jsonify({"message": "Atividade registrada", "activity": activity.to_dict()})
