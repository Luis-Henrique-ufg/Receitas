from database import db
from models.daily_activity import DailyActivity, DailySubjectActivity
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

    @staticmethod
    def reassign_unassigned_activity(target_subject_id: int) -> dict:
        target = db.session.get(Subject, target_subject_id)
        if not target:
            raise ValueError("Matéria destino não encontrada.")

        total_sec = 0
        total_pom = 0

        # 1. Update DailySubjectActivity relational table
        unassigned_dsa = DailySubjectActivity.query.filter(
            DailySubjectActivity.subject_id.is_(None)
        ).all()

        for dsa in unassigned_dsa:
            total_sec += dsa.study_seconds or 0
            total_pom += dsa.pomodoros or 0

            existing = DailySubjectActivity.query.filter_by(
                date=dsa.date, subject_id=target.id
            ).first()
            if existing:
                existing.study_seconds = (existing.study_seconds or 0) + (
                    dsa.study_seconds or 0
                )
                existing.pomodoros = (existing.pomodoros or 0) + (dsa.pomodoros or 0)
                existing.subject_name = target.name
                db.session.delete(dsa)
            else:
                dsa.subject_id = target.id
                dsa.subject_name = target.name

        # 2. Update DailyActivity.subject_breakdown JSON
        all_da = DailyActivity.query.all()
        target_key = str(target.id)

        for da in all_da:
            sb = da.get_subject_breakdown()
            if "none" in sb:
                none_info = sb.pop("none")
                n_sec = none_info.get("study_seconds", 0)
                n_pom = none_info.get("pomodoros", 0)
                if target_key not in sb:
                    sb[target_key] = {
                        "id": target.id,
                        "name": target.name,
                        "color": target.color,
                        "study_seconds": n_sec,
                        "pomodoros": n_pom,
                    }
                else:
                    sb[target_key]["study_seconds"] = (
                        sb[target_key].get("study_seconds", 0) + n_sec
                    )
                    sb[target_key]["pomodoros"] = (
                        sb[target_key].get("pomodoros", 0) + n_pom
                    )
                    sb[target_key]["name"] = target.name
                    sb[target_key]["color"] = target.color
                da.set_subject_breakdown(sb)

        db.session.commit()

        return {
            "message": f"Histórico sem matéria reatribuído para {target.name} com sucesso.",
            "reassigned_seconds": total_sec,
            "reassigned_pomodoros": total_pom,
            "target_subject_id": target.id,
            "target_subject_name": target.name,
        }
