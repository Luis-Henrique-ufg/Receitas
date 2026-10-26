from datetime import datetime

from database import db


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    color = db.Column(db.String(20), default="#3b82f6", nullable=False)
    code = db.Column(db.String(50), nullable=True)
    semester = db.Column(db.String(50), nullable=True)
    is_archived = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "code": self.code,
            "semester": self.semester,
            "is_archived": self.is_archived,
            "created_at": (self.created_at.isoformat() if self.created_at else None),
        }
