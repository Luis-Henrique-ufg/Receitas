import re
from datetime import date, datetime

from database import db
from models.course import Course
from models.study_event import StudyEvent
from models.subject import Subject


class EventService:
    @staticmethod
    def list_events(
        month: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        subject_id: int | None = None,
        course_id: int | None = None,
        upcoming_limit: int | None = None,
        include_done: bool = True,
    ) -> list[StudyEvent]:
        query = StudyEvent.query

        if month:
            # month expected as 'YYYY-MM'
            query = query.filter(StudyEvent.date.like(f"{month}-%"))

        if start_date:
            query = query.filter(StudyEvent.date >= start_date)

        if end_date:
            query = query.filter(StudyEvent.date <= end_date)

        if subject_id:
            query = query.filter(StudyEvent.subject_id == subject_id)

        if course_id:
            query = query.filter(StudyEvent.course_id == course_id)

        if upcoming_limit is not None and upcoming_limit > 0:
            today_str = date.today().strftime("%Y-%m-%d")
            query = query.filter(StudyEvent.date >= today_str)
            if not include_done:
                query = query.filter(StudyEvent.done.is_(False))
            return (
                query.order_by(StudyEvent.date.asc(), StudyEvent.time.asc().nullslast())
                .limit(upcoming_limit)
                .all()
            )

        if not include_done:
            query = query.filter(StudyEvent.done.is_(False))

        return query.order_by(
            StudyEvent.date.asc(), StudyEvent.time.asc().nullslast()
        ).all()

    @staticmethod
    def get_by_id(event_id: int) -> StudyEvent | None:
        return db.session.get(StudyEvent, event_id)

    @staticmethod
    def create_event(data: dict) -> StudyEvent:
        title = (data.get("title") or "").strip()
        if not title:
            raise ValueError("O título do evento é obrigatório.")

        event_date = (data.get("date") or "").strip()
        if not event_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", event_date):
            raise ValueError("Data inválida. Use o formato AAAA-MM-DD.")

        time_val = (data.get("time") or "").strip() or None
        if time_val and not re.match(r"^\d{2}:\d{2}$", time_val):
            time_val = None

        category = (data.get("category") or "lembrete").strip().lower()
        color = (data.get("color") or "").strip() or None
        notes = (data.get("notes") or "").strip() or None
        done = bool(data.get("done", False))

        subject_id = data.get("subject_id")
        if subject_id:
            sub = db.session.get(Subject, subject_id)
            if not sub:
                subject_id = None
            elif not color and sub.color:
                color = sub.color
        else:
            subject_id = None

        course_id = data.get("course_id")
        if course_id:
            course = db.session.get(Course, course_id)
            if not course:
                course_id = None
        else:
            course_id = None

        event = StudyEvent(
            title=title,
            date=event_date,
            time=time_val,
            category=category,
            color=color,
            notes=notes,
            done=done,
            subject_id=subject_id,
            course_id=course_id,
        )
        db.session.add(event)
        db.session.commit()
        return event

    @staticmethod
    def update_event(event_id: int, data: dict) -> StudyEvent | None:
        event = db.session.get(StudyEvent, event_id)
        if not event:
            return None

        if "title" in data:
            title = (data["title"] or "").strip()
            if not title:
                raise ValueError("O título do evento é obrigatório.")
            event.title = title

        if "date" in data:
            event_date = (data["date"] or "").strip()
            if not event_date or not re.match(r"^\d{4}-\d{2}-\d{2}$", event_date):
                raise ValueError("Data inválida. Use o formato AAAA-MM-DD.")
            event.date = event_date

        if "time" in data:
            time_val = (data["time"] or "").strip() or None
            if time_val and not re.match(r"^\d{2}:\d{2}$", time_val):
                time_val = None
            event.time = time_val

        if "category" in data:
            event.category = (data["category"] or "lembrete").strip().lower()

        if "color" in data:
            event.color = (data["color"] or "").strip() or None

        if "notes" in data:
            event.notes = (data["notes"] or "").strip() or None

        if "done" in data:
            event.done = bool(data["done"])

        if "subject_id" in data:
            s_id = data["subject_id"]
            if s_id:
                sub = db.session.get(Subject, s_id)
                event.subject_id = sub.id if sub else None
                if not event.color and sub and sub.color:
                    event.color = sub.color
            else:
                event.subject_id = None

        if "course_id" in data:
            c_id = data["course_id"]
            if c_id:
                course = db.session.get(Course, c_id)
                event.course_id = course.id if course else None
            else:
                event.course_id = None

        event.updated_at = datetime.utcnow()
        db.session.commit()
        return event

    @staticmethod
    def toggle_done(event_id: int) -> StudyEvent | None:
        event = db.session.get(StudyEvent, event_id)
        if not event:
            return None
        event.done = not event.done
        event.updated_at = datetime.utcnow()
        db.session.commit()
        return event

    @staticmethod
    def delete_event(event_id: int) -> bool:
        event = db.session.get(StudyEvent, event_id)
        if not event:
            return False
        db.session.delete(event)
        db.session.commit()
        return True

    @staticmethod
    def generate_ics(
        events: list[StudyEvent], cal_name: str = "Agenda de Estudos"
    ) -> str:
        """
        Gera conteúdo no formato padrão iCalendar RFC 5545 para exportação.
        """
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Receitas//Study Calendar//PT-BR",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            f"X-WR-CALNAME:{cal_name}",
            "X-WR-TIMEZONE:America/Sao_Paulo",
        ]

        now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

        for ev in events:
            # Escape commas, semicolons and backslashes for ICS
            clean_title = (
                (ev.title or "Evento")
                .replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
            )
            clean_notes = (
                (ev.notes or "")
                .replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\n", "\\n")
            )
            subj_text = (
                f"Matéria: {ev.subject.name}"
                if ev.subject
                else (f"Curso: {ev.course.name}" if ev.course else "")
            )
            desc = f"{subj_text}\\n{clean_notes}".strip("\\n")

            date_digits = ev.date.replace("-", "")

            lines.append("BEGIN:VEVENT")
            lines.append(f"UID:study-event-{ev.id}@receitas.local")
            lines.append(f"DTSTAMP:{now_str}")

            if ev.time:
                time_digits = ev.time.replace(":", "") + "00"
                lines.append(f"DTSTART:{date_digits}T{time_digits}")
                # Default duration 1 hour
                lines.append(f"DTEND:{date_digits}T{int(time_digits) + 10000:06d}")
            else:
                lines.append(f"DTSTART;VALUE=DATE:{date_digits}")

            lines.append(f"SUMMARY:{clean_title}")
            if desc:
                lines.append(f"DESCRIPTION:{desc}")
            lines.append(f"CATEGORIES:{ev.category.upper()}")
            lines.append("STATUS:" + ("COMPLETED" if ev.done else "CONFIRMED"))
            lines.append("END:VEVENT")

        lines.append("END:VCALENDAR")
        return "\r\n".join(lines) + "\r\n"
