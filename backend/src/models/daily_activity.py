import json

from database import db


class DailyActivity(db.Model):
    __tablename__ = "daily_activity"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(
        db.String(10), unique=True, nullable=False, index=True
    )  # YYYY-MM-DD
    study_seconds = db.Column(db.Integer, default=0, nullable=False)
    lessons_completed = db.Column(db.Integer, default=0, nullable=False)
    pomodoros_completed = db.Column(db.Integer, default=0, nullable=False)
    course_breakdown = db.Column(db.Text, default="{}", nullable=False)

    def get_course_breakdown(self) -> dict:
        if not self.course_breakdown:
            return {}
        try:
            return json.loads(self.course_breakdown)
        except Exception:
            return {}

    def set_course_breakdown(self, data: dict):
        self.course_breakdown = json.dumps(data, ensure_ascii=False)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "study_seconds": self.study_seconds,
            "lessons_completed": self.lessons_completed,
            "pomodoros_completed": self.pomodoros_completed,
            "course_breakdown": self.get_course_breakdown(),
        }


class DailyCourseActivity(db.Model):
    __tablename__ = "daily_course_activity"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False, index=True)
    course_id = db.Column(db.Integer, nullable=False, index=True)
    course_name = db.Column(db.String(255), nullable=True)
    study_seconds = db.Column(db.Integer, default=0, nullable=False)
    pomodoros = db.Column(db.Integer, default=0, nullable=False)
    lessons = db.Column(db.Integer, default=0, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("date", "course_id", name="uq_daily_course"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "course_id": self.course_id,
            "course_name": self.course_name,
            "study_seconds": self.study_seconds,
            "pomodoros": self.pomodoros,
            "lessons": self.lessons,
        }

