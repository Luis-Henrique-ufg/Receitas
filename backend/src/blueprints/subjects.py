from flask import Blueprint, jsonify, request

from services.subject_service import SubjectService

subjects_bp = Blueprint("subjects", __name__)


@subjects_bp.route("/api/subjects", methods=["GET"])
def list_subjects():
    include_archived = request.args.get("include_archived", "false").lower() == "true"
    subjects = SubjectService.list_all(include_archived=include_archived)
    return jsonify([s.to_dict() for s in subjects])


@subjects_bp.route("/api/subjects", methods=["POST"])
def create_subject():
    data = request.json or {}
    try:
        subject = SubjectService.create(data)
        return jsonify(subject.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["GET"])
def get_subject(subject_id: int):
    subject = SubjectService.get_by_id(subject_id)
    if not subject:
        return jsonify({"error": "Matéria não encontrada"}), 404
    return jsonify(subject.to_dict())


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["PUT"])
def update_subject(subject_id: int):
    data = request.json or {}
    try:
        subject = SubjectService.update(subject_id, data)
        if not subject:
            return jsonify({"error": "Matéria não encontrada"}), 404
        return jsonify(subject.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@subjects_bp.route("/api/subjects/<int:subject_id>/archive", methods=["PATCH"])
def archive_subject(subject_id: int):
    data = request.json or {}
    archive_state = data.get("archive", True)
    subject = SubjectService.archive(subject_id, archive_state=archive_state)
    if not subject:
        return jsonify({"error": "Matéria não encontrada"}), 404
    return jsonify(subject.to_dict())


@subjects_bp.route("/api/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id: int):
    success = SubjectService.delete(subject_id)
    if not success:
        return jsonify({"error": "Matéria não encontrada"}), 404
    return jsonify({"message": "Matéria excluída com sucesso"})
