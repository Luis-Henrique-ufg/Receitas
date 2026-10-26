from database import db
from models.subject import Subject


class SubjectService:
    @staticmethod
    def list_all(include_archived: bool = False) -> list[Subject]:
        query = Subject.query
        if not include_archived:
            query = query.filter_by(is_archived=False)
        return query.order_by(Subject.is_archived.asc(), Subject.name.asc()).all()

    @staticmethod
    def get_by_id(subject_id: int) -> Subject | None:
        return db.session.get(Subject, subject_id)

    @staticmethod
    def create(data: dict) -> Subject:
        name = (data.get("name") or "").strip()
        if not name:
            raise ValueError("O nome da matéria é obrigatório.")

        color = (data.get("color") or "#3b82f6").strip()
        code = (data.get("code") or "").strip() or None
        semester = (data.get("semester") or "").strip() or None

        subject = Subject(
            name=name,
            color=color,
            code=code,
            semester=semester,
            is_archived=False,
        )
        db.session.add(subject)
        db.session.commit()
        return subject

    @staticmethod
    def update(subject_id: int, data: dict) -> Subject | None:
        subject = db.session.get(Subject, subject_id)
        if not subject:
            return None

        if "name" in data:
            name = (data.get("name") or "").strip()
            if not name:
                raise ValueError("O nome da matéria não pode ser vazio.")
            subject.name = name

        if "color" in data:
            subject.color = (data.get("color") or "#3b82f6").strip()

        if "code" in data:
            code = (data.get("code") or "").strip() or None
            subject.code = code

        if "semester" in data:
            semester = (data.get("semester") or "").strip() or None
            subject.semester = semester

        if "is_archived" in data:
            subject.is_archived = bool(data.get("is_archived"))

        db.session.commit()
        return subject

    @staticmethod
    def archive(subject_id: int, archive_state: bool = True) -> Subject | None:
        subject = db.session.get(Subject, subject_id)
        if not subject:
            return None
        subject.is_archived = archive_state
        db.session.commit()
        return subject

    @staticmethod
    def delete(subject_id: int) -> bool:
        subject = db.session.get(Subject, subject_id)
        if not subject:
            return False
        db.session.delete(subject)
        db.session.commit()
        return True
