import os

from flask import (
    Blueprint,
    abort,
    current_app,
    render_template,
    request,
    send_file,
    send_from_directory,
)

from utils import VIDEO_EXTENSIONS, translate_to_container_path
from video_utils import ensure_compatible_video

media_bp = Blueprint("media", __name__)


@media_bp.route("/")
def index():
    return render_template("index.html")


@media_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)


@media_bp.route("/serve-content", methods=["GET"])
def serve_lesson_content():
    path = request.args.get("path")
    if not path:
        abort(400)

    container_path = translate_to_container_path(path)
    if not os.path.exists(container_path):
        abort(404)

    file_ext = os.path.splitext(container_path)[1].lower()
    if file_ext in VIDEO_EXTENSIONS:
        serve_path, mimetype = ensure_compatible_video(container_path)
        if not serve_path or not os.path.exists(serve_path):
            serve_path = container_path
            mimetype = None
        return send_file(serve_path, conditional=True, mimetype=mimetype)

    return send_file(container_path, conditional=True)
