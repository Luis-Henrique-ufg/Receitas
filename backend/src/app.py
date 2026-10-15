from flask import Flask
from flask_cors import CORS

from config import Config
from database import db
from models import Course, Lesson, Note

app = Flask(__name__, static_folder="../front-end/dist", static_url_path="")
app.config.from_object(Config)

db.init_app(app)
CORS(app)

__all__ = ["app", "db", "Course", "Lesson", "Note"]

import routes  # noqa: E402, F401

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=9823, host="0.0.0.0")
