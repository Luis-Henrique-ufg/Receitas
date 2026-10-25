from flask import Blueprint, Response, jsonify, request

from services.event_service import EventService

events_bp = Blueprint("events", __name__)


@events_bp.route("/api/events", methods=["GET"])
def list_events():
    month = request.args.get("month")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    course_id = request.args.get("course_id", type=int)
    upcoming_limit = request.args.get("upcoming", type=int)
    include_done = request.args.get("include_done", "true").lower() in (
        "true",
        "1",
        "yes",
    )

    events = EventService.list_events(
        month=month,
        start_date=start_date,
        end_date=end_date,
        course_id=course_id,
        upcoming_limit=upcoming_limit,
        include_done=include_done,
    )
    return jsonify([ev.to_dict() for ev in events])


@events_bp.route("/api/events", methods=["POST"])
def create_event():
    payload = request.json or {}
    try:
        event = EventService.create_event(payload)
        return jsonify(event.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@events_bp.route("/api/events/<int:event_id>", methods=["GET"])
def get_event(event_id: int):
    event = EventService.get_by_id(event_id)
    if not event:
        return jsonify({"error": "Evento não encontrado"}), 404
    return jsonify(event.to_dict())


@events_bp.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event(event_id: int):
    payload = request.json or {}
    try:
        event = EventService.update_event(event_id, payload)
        if not event:
            return jsonify({"error": "Evento não encontrado"}), 404
        return jsonify(event.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@events_bp.route("/api/events/<int:event_id>/toggle-done", methods=["PATCH"])
def toggle_done(event_id: int):
    event = EventService.toggle_done(event_id)
    if not event:
        return jsonify({"error": "Evento não encontrado"}), 404
    return jsonify(event.to_dict())


@events_bp.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id: int):
    success = EventService.delete_event(event_id)
    if not success:
        return jsonify({"error": "Evento não encontrado"}), 404
    return jsonify({"message": "Evento excluído com sucesso"})


@events_bp.route("/api/events/export.ics", methods=["GET"])
def export_ics():
    month = request.args.get("month")
    course_id = request.args.get("course_id", type=int)

    events = EventService.list_events(month=month, course_id=course_id)
    ics_data = EventService.generate_ics(events)

    return Response(
        ics_data,
        mimetype="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=agenda_estudos.ics",
            "Content-Type": "text/calendar; charset=utf-8",
        },
    )
