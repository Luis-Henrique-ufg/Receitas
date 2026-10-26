import logging

from flask import Flask
from flask_cors import CORS

from blueprints import (
    courses_bp,
    events_bp,
    lessons_bp,
    media_bp,
    search_bp,
    stats_bp,
    subjects_bp,
)
from config import Config
from database import db
from migrations import run_migrations
from models import (
    Course,
    DailyActivity,
    DailyCourseActivity,
    DailySubjectActivity,
    Lesson,
    Note,
    StudyEvent,
    Subject,
)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s",
)

app = Flask(__name__, static_folder="../front-end/dist", static_url_path="")
app.config.from_object(Config)

db.init_app(app)
CORS(app)

app.register_blueprint(courses_bp)
app.register_blueprint(events_bp)
app.register_blueprint(lessons_bp)
app.register_blueprint(media_bp)
app.register_blueprint(search_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(subjects_bp)

__all__ = [
    "app",
    "db",
    "Course",
    "Lesson",
    "Note",
    "DailyActivity",
    "DailyCourseActivity",
    "DailySubjectActivity",
    "StudyEvent",
    "Subject",
]

with app.app_context():
    db.create_all()
    run_migrations(db.engine)

if __name__ == "__main__":
    app.run(debug=True, port=9823, host="0.0.0.0")
