from datetime import datetime

from database import db


class StudyEvent(db.Model):
    __tablename__ = "study_events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(10), nullable=False, index=True)  # 'YYYY-MM-DD'
    time = db.Column(db.String(5), nullable=True)  # 'HH:MM'
    category = db.Column(db.String(50), nullable=False, default="lembrete")
    color = db.Column(db.String(30), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    done = db.Column(db.Boolean, nullable=False, default=False)
    subject_id = db.Column(
        db.Integer,
        db.ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
    )
    course_id = db.Column(
        db.Integer,
        db.ForeignKey("course.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    subject = db.relationship("Subject", backref=db.backref("events", lazy=True))
    course = db.relationship("Course", backref=db.backref("events", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "date": self.date,
            "time": self.time,
            "category": self.category,
            "color": self.color or (self.subject.color if self.subject else None),
            "notes": self.notes,
            "done": self.done,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "subject_color": self.subject.color if self.subject else None,
            "course_id": self.course_id,
            "course_name": self.course.name if self.course else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
