from flask import Blueprint, current_app, jsonify, request

from services import CourseService

courses_bp = Blueprint("courses", __name__)


@courses_bp.route("/api/courses", methods=["GET"])
def list_courses():
    return jsonify(CourseService.list_all())


@courses_bp.route("/api/courses/reorder", methods=["PUT"])
def reorder_courses():
    CourseService.reorder(request.json or [])
    return jsonify({"message": "Ordem salva"})


@courses_bp.route("/api/courses/<int:course_id>", methods=["GET"])
def get_course(course_id):
    course = CourseService.get_by_id(course_id)
    return jsonify({"id": course.id, "name": course.name, "path": course.path})


@courses_bp.route("/api/courses", methods=["POST"])
def add_course():
    name = request.form["name"]
    path = request.form["path"]
    image_url = request.form.get("imageURL")
    image_file = request.files.get("imageFile")

    course = CourseService.create(
        name=name,
        path=path,
        image_url=image_url,
        image_file=image_file,
        upload_folder=current_app.config["UPLOAD_FOLDER"],
    )
    return jsonify({"id": course.id, "name": course.name}), 201


@courses_bp.route("/api/courses/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    name = request.form["name"]
    path = request.form["path"]
    image_url = request.form.get("imageURL")
    image_file = request.files.get("imageFile")

    course = CourseService.update(
        course_id=course_id,
        name=name,
        path=path,
        image_url=image_url,
        image_file=image_file,
        upload_folder=current_app.config["UPLOAD_FOLDER"],
    )
    return jsonify(course.to_dict())


@courses_bp.route("/api/courses/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    CourseService.delete(course_id, upload_folder=current_app.config["UPLOAD_FOLDER"])
    return jsonify({"message": "Course and associated lessons deleted"})


@courses_bp.route("/api/courses/<int:course_id>/rescan", methods=["POST"])
def rescan_course(course_id):
    CourseService.rescan(course_id)
    return jsonify({"message": "Aulas rescaneadas com sucesso"}), 200


@courses_bp.route("/api/courses/add-all", methods=["POST"])
def add_all_courses():
    CourseService.auto_scan_all()
    return jsonify({}), 201


@courses_bp.route("/api/courses/<int:course_id>/completed_percentage", methods=["GET"])
def course_completed_percentage(course_id):
    stats = CourseService.get_completion_percentage(course_id)
    return jsonify(stats)
