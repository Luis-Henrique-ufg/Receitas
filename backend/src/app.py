from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

app = Flask(__name__, static_folder='../front-end/dist', static_url_path='')
app.config.from_object(Config)

db = SQLAlchemy(app)
CORS(app)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    path = db.Column(db.String(255), nullable=False)
    isCoverUrl = db.Column(db.Integer, default=0)
    fileCover = db.Column(db.String(255), nullable=True)
    urlCover = db.Column(db.String(255), nullable=True)
    position = db.Column(db.Integer, default=0)
    
class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    course = db.relationship('Course', backref=db.backref('lessons', lazy=True))
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.Text)
    hierarchy_path = db.Column(db.Text, nullable=False)
    video_url = db.Column(db.String(255))
    pdf_url = db.Column(db.String(255))
    progressStatus = db.Column(db.Text)
    isCompleted = db.Column(db.Integer)
    time_elapsed = db.Column(db.Text)
    duration = db.Column(db.Text, nullable=True)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    lesson = db.relationship('Lesson', backref=db.backref('notes', lazy=True, cascade="all, delete-orphan"))
    time = db.Column(db.Integer, nullable=False, default=0)
    content = db.Column(db.Text, nullable=False)

from routes import *

from sqlalchemy import text
with app.app_context():
    db.create_all()
    try:
        db.session.execute(text('ALTER TABLE course ADD COLUMN position INTEGER DEFAULT 0'))
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

if __name__ == '__main__':
    app.run(debug=True, port=9823, host="0.0.0.0")