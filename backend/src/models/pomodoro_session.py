from datetime import datetime
from database import db


class PomodoroSession(db.Model):
    __tablename__ = "pomodoro_sessions"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False, index=True)  # 'YYYY-MM-DD'
    start_time = db.Column(db.String(5), nullable=True)  # 'HH:MM'
    end_time = db.Column(db.String(5), nullable=True)  # 'HH:MM'
    duration_seconds = db.Column(db.Integer, nullable=False, default=0)
    pomodoros = db.Column(db.Integer, nullable=False, default=1)
    subject_id = db.Column(
        db.Integer,
        db.ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    subject_name = db.Column(db.String(150), nullable=True)
    intention = db.Column(db.String(255), nullable=True)
    course_id = db.Column(
        db.Integer,
        db.ForeignKey("course.id", ondelete="SET NULL"),
        nullable=True,
    )
    course_name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subject = db.relationship("Subject", backref=db.backref("pomodoro_sessions", lazy=True))
    course = db.relationship("Course", backref=db.backref("pomodoro_sessions", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_seconds": self.duration_seconds,
            "pomodoros": self.pomodoros,
            "subject_id": self.subject_id,
            "subject_name": (
                self.subject.name
                if self.subject
                else (self.subject_name or "Sem matéria")
            ),
            "subject_color": self.subject.color if self.subject else "#64748b",
            "intention": self.intention,
            "course_id": self.course_id,
            "course_name": self.course.name if self.course else self.course_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

