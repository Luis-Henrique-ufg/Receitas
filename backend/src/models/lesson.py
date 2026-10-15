from sqlalchemy.orm import synonym

from database import db


class Lesson(db.Model):
    __tablename__ = "lesson"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    course = db.relationship("Course", backref=db.backref("lessons", lazy=True))
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.Text)
    hierarchy_path = db.Column(db.Text, nullable=False)
    video_url = db.Column(db.String(255))
    pdf_url = db.Column(db.String(255))
    progress_status = db.Column("progressStatus", db.Text)
    is_completed = db.Column("isCompleted", db.Integer, default=0)
    time_elapsed = db.Column(db.Text)
    duration = db.Column(db.Text, nullable=True)

    # Compatibilidade retroativa para acessos legado
    progressStatus = synonym("progress_status")
    isCompleted = synonym("is_completed")

    def to_dict(self):
        return {
            "course_title": self.course.name if self.course else None,
            "id": self.id,
            "title": self.title,
            "module": self.module,
            "progressStatus": self.progress_status,
            "isCompleted": self.is_completed,
            "hierarchy_path": self.hierarchy_path,
            "time_elapsed": self.time_elapsed,
            "video_url": self.video_url,
            "duration": self.duration,
            "pdf_url": self.pdf_url,
        }
