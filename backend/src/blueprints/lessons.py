from flask import Blueprint, jsonify, request, send_file

from services import LessonService

lessons_bp = Blueprint("lessons", __name__)


@lessons_bp.route("/api/courses/<int:course_id>/lessons", methods=["GET"])
def list_lessons_for_course(course_id):
    lessons_by_module = LessonService.list_by_course(course_id)
    return jsonify(lessons_by_module)


@lessons_bp.route("/api/lessons/<int:lesson_id>", methods=["GET"])
def get_lesson_elapsed_time(lesson_id):
    elapsed_time = LessonService.get_elapsed_time(lesson_id)
    return jsonify({"elapsedTime": elapsed_time})


@lessons_bp.route("/api/update-lesson-progress", methods=["POST"])
def update_lesson_progress():
    data = request.json or {}
    lesson_id = data.get("lessonId")
    progress_status = data.get("progressStatus")
    is_completed = data.get("isCompleted")
    time_elapsed = data.get("time_elapsed")

    lesson = LessonService.update_progress(
        lesson_id=lesson_id,
        progress_status=progress_status,
        is_completed=is_completed,
        time_elapsed=time_elapsed,
    )
    if not lesson:
        return jsonify({"error": "Lição não encontrada"}), 404

    return jsonify({"message": "Progresso da lição atualizado com sucesso"})


@lessons_bp.route("/api/lessons/<int:lesson_id>/attachments", methods=["GET"])
def get_lesson_attachments(lesson_id):
    attachments = LessonService.get_attachments(lesson_id)
    if attachments is None:
        return jsonify({"error": "Lição não encontrada"}), 404
    return jsonify(attachments)


@lessons_bp.route("/api/courses/<int:course_id>/notes", methods=["GET"])
def get_course_notes(course_id):
    notes = LessonService.list_notes_by_course(course_id)
    return jsonify(notes)


@lessons_bp.route("/api/lessons/<int:lesson_id>/notes", methods=["POST"])
def add_note_to_lesson(lesson_id):
    data = request.json or {}
    time = data.get("time", 0)
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Conteúdo da anotação não pode ser vazio"}), 400

    note = LessonService.create_note(lesson_id=lesson_id, time=time, content=content)
    return jsonify(note.to_dict()), 201


@lessons_bp.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    data = request.json or {}
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Conteúdo da anotação não pode ser vazio"}), 400

    note = LessonService.update_note(note_id=note_id, content=content)
    return jsonify(note.to_dict())


@lessons_bp.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    LessonService.delete_note(note_id)
    return jsonify({"message": "Anotação excluída com sucesso"})


@lessons_bp.route("/api/courses/<int:course_id>/notes/export", methods=["GET"])
def export_course_notes(course_id):
    export_format = request.args.get("format", "md").lower()
    mem, filename, mimetype = LessonService.export_notes(course_id, export_format)
    return send_file(
        mem,
        mimetype=mimetype,
        as_attachment=True,
        download_name=filename,
    )
