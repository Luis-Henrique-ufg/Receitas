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

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "study_seconds": self.study_seconds,
            "lessons_completed": self.lessons_completed,
            "pomodoros_completed": self.pomodoros_completed,
        }
