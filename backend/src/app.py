from flask import Flask
from flask_cors import CORS
from sqlalchemy import text

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
    try:
        db.session.execute(
            text("ALTER TABLE course ADD COLUMN position INTEGER DEFAULT 0")
        )
        db.session.commit()
    except Exception:
        db.session.rollback()

    try:
        db.session.execute(text("""
            DELETE FROM lesson
            WHERE LOWER(video_url) LIKE '%.html'
               OR LOWER(video_url) LIKE '%.htm'
               OR LOWER(video_url) LIKE '%.txt'
               OR LOWER(pdf_url) LIKE '%.html'
               OR LOWER(pdf_url) LIKE '%.htm'
               OR LOWER(pdf_url) LIKE '%.txt'
        """))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erro ao limpar lições não-vídeo:", e)

if __name__ == "__main__":
    app.run(debug=True, port=9823, host="0.0.0.0")
