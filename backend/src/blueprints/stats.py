from flask import Blueprint, jsonify, request

from services.stats_service import StatsService

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/api/stats/heatmap", methods=["GET"])
def get_heatmap():
    days = request.args.get("days", 180, type=int)
    course_id = request.args.get("course_id", type=int)
    data = StatsService.get_heatmap_data(days=days, course_id=course_id)
    return jsonify(data)


@stats_bp.route("/api/stats/pomodoro", methods=["POST"])
def record_pomodoro():
    payload = request.json or {}
    study_seconds = payload.get("study_seconds", 0)
    course_id = payload.get("course_id")
    course_name = payload.get("course_name")
    date_str = payload.get("date")
    activity = StatsService.record_pomodoro_completed(
        study_seconds=study_seconds,
        course_id=course_id,
        course_name=course_name,
        date_str=date_str,
    )
    return jsonify({"message": "Pomodoro registrado", "activity": activity.to_dict()})


@stats_bp.route("/api/stats/heartbeat", methods=["POST"])
def record_heartbeat():
    payload = request.json or {}
    seconds = payload.get("seconds", 0)
    course_id = payload.get("course_id")
    course_name = payload.get("course_name")
    date_str = payload.get("date")
    activity = StatsService.record_study_seconds(
        seconds=seconds,
        course_id=course_id,
        course_name=course_name,
        date_str=date_str,
    )
    return jsonify({"message": "Atividade registrada", "activity": activity.to_dict()})
