from database import db


class Note(db.Model):
    __tablename__ = "note"

    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lesson.id"), nullable=False)
    lesson = db.relationship(
        "Lesson", backref=db.backref("notes", lazy=True, cascade="all, delete-orphan")
    )
    time = db.Column(db.Integer, nullable=False, default=0)
    content = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "lesson_title": self.lesson.title if self.lesson else None,
            "module": self.lesson.module if self.lesson else None,
            "time": self.time,
            "content": self.content,
        }
