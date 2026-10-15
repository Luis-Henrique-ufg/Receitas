import logging

from flask import Flask
from flask_cors import CORS

from blueprints import courses_bp, lessons_bp, media_bp
from config import Config
from database import db
from models import Course, Lesson, Note

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s",
)

app = Flask(__name__, static_folder="../front-end/dist", static_url_path="")
app.config.from_object(Config)

db.init_app(app)
CORS(app)

app.register_blueprint(courses_bp)
app.register_blueprint(lessons_bp)
app.register_blueprint(media_bp)

__all__ = ["app", "db", "Course", "Lesson", "Note"]

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=9823, host="0.0.0.0")
