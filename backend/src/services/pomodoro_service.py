from datetime import datetime, date
from database import db
from models.daily_activity import DailyActivity, DailySubjectActivity
from models.pomodoro_session import PomodoroSession
from models.subject import Subject


class PomodoroService:
    @staticmethod
    def list_by_date(date_str: str | None = None) -> list[PomodoroSession]:
        if not date_str:
            date_str = date.today().isoformat()
        return (
            PomodoroSession.query.filter_by(date=date_str)
            .order_by(PomodoroSession.created_at.asc(), PomodoroSession.id.asc())
            .all()
        )

    @staticmethod
    def create(data: dict) -> PomodoroSession:
        date_str = data.get("date") or date.today().isoformat()
        duration_seconds = int(data.get("duration_seconds") or 0)
        pomodoros = int(data.get("pomodoros") or 1)
        subject_id = data.get("subject_id")
        subject_name = data.get("subject_name")
        course_id = data.get("course_id")
        course_name = data.get("course_name")
        intention = (data.get("intention") or "").strip() or None
        start_time = data.get("start_time")
        end_time = data.get("end_time")

        if not end_time:
            end_time = datetime.now().strftime("%H:%M")
        if not start_time:
            # Approximate start time from duration if not provided
            start_dt = datetime.now().timestamp() - duration_seconds
            start_time = datetime.fromtimestamp(start_dt).strftime("%H:%M")

        if subject_id is not None and not subject_name:
            sub = db.session.get(Subject, subject_id)
            if sub:
                subject_name = sub.name

        session = PomodoroSession(
            date=date_str,
            start_time=start_time,
            end_time=end_time,
            duration_seconds=duration_seconds,
            pomodoros=pomodoros,
            subject_id=subject_id,
            subject_name=subject_name or ("Sem matéria" if subject_id is None else None),
            intention=intention,
            course_id=course_id,
            course_name=course_name,
        )
        db.session.add(session)
        db.session.commit()
        return session

    @staticmethod
    def update_session(session_id: int, data: dict) -> PomodoroSession | None:
        session = db.session.get(PomodoroSession, session_id)
        if not session:
            return None

        old_subject_id = session.subject_id
        subject_changed = False

        if "subject_id" in data:
            new_subject_id = data.get("subject_id")
            if new_subject_id != old_subject_id:
                subject_changed = True
                new_sub_name = "Sem matéria"
                if new_subject_id is not None:
                    target_sub = db.session.get(Subject, new_subject_id)
                    if not target_sub:
                        raise ValueError("Matéria destino não encontrada.")
                    new_sub_name = target_sub.name

                session.subject_id = new_subject_id
                session.subject_name = new_sub_name

        if "intention" in data:
            session.intention = (data.get("intention") or "").strip() or None

        if subject_changed:
            # Reconcile DailySubjectActivity for session.date
            sec = session.duration_seconds or 0
            pom = session.pomodoros or 0
            d_str = session.date

            # Deduct from old subject activity
            old_dsa = DailySubjectActivity.query.filter_by(
                date=d_str, subject_id=old_subject_id
            ).first()
            if old_dsa:
                old_dsa.study_seconds = max(0, (old_dsa.study_seconds or 0) - sec)
                old_dsa.pomodoros = max(0, (old_dsa.pomodoros or 0) - pom)
                if old_dsa.study_seconds == 0 and old_dsa.pomodoros == 0:
                    db.session.delete(old_dsa)

            # Add to new subject activity
            new_dsa = DailySubjectActivity.query.filter_by(
                date=d_str, subject_id=session.subject_id
            ).first()
            if not new_dsa:
                new_dsa = DailySubjectActivity(
                    date=d_str,
                    subject_id=session.subject_id,
                    subject_name=session.subject_name,
                    study_seconds=0,
                    pomodoros=0,
                )
                db.session.add(new_dsa)
            new_dsa.study_seconds = (new_dsa.study_seconds or 0) + sec
            new_dsa.pomodoros = (new_dsa.pomodoros or 0) + pom
            new_dsa.subject_name = session.subject_name

            # Reconcile DailyActivity.subject_breakdown JSON
            act = DailyActivity.query.filter_by(date=d_str).first()
            if act:
                sb = act.get_subject_breakdown()
                old_key = str(old_subject_id) if old_subject_id is not None else "none"
                new_key = (
                    str(session.subject_id)
                    if session.subject_id is not None
                    else "none"
                )

                if old_key in sb:
                    sb[old_key]["study_seconds"] = max(
                        0, sb[old_key].get("study_seconds", 0) - sec
                    )
                    sb[old_key]["pomodoros"] = max(
                        0, sb[old_key].get("pomodoros", 0) - pom
                    )
                    if (
                        sb[old_key]["study_seconds"] == 0
                        and sb[old_key]["pomodoros"] == 0
                    ):
                        del sb[old_key]

                if new_key not in sb:
                    sb[new_key] = {
                        "id": session.subject_id,
                        "name": session.subject_name,
                        "study_seconds": sec,
                        "pomodoros": pom,
                    }
                else:
                    sb[new_key]["study_seconds"] = (
                        sb[new_key].get("study_seconds", 0) + sec
                    )
                    sb[new_key]["pomodoros"] = sb[new_key].get("pomodoros", 0) + pom
                    sb[new_key]["name"] = session.subject_name

                act.set_subject_breakdown(sb)

        db.session.commit()
        return session

    @staticmethod
    def delete_session(session_id: int) -> bool:
        session = db.session.get(PomodoroSession, session_id)
        if not session:
            return False

        sec = session.duration_seconds or 0
        pom = session.pomodoros or 0
        d_str = session.date
        sub_id = session.subject_id

        # Deduct from DailySubjectActivity
        dsa = DailySubjectActivity.query.filter_by(
            date=d_str, subject_id=sub_id
        ).first()
        if dsa:
            dsa.study_seconds = max(0, (dsa.study_seconds or 0) - sec)
            dsa.pomodoros = max(0, (dsa.pomodoros or 0) - pom)
            if dsa.study_seconds == 0 and dsa.pomodoros == 0:
                db.session.delete(dsa)

        # Deduct from DailyActivity
        act = DailyActivity.query.filter_by(date=d_str).first()
        if act:
            act.study_seconds = max(0, (act.study_seconds or 0) - sec)
            act.pomodoros_completed = max(0, (act.pomodoros_completed or 0) - pom)
            sb = act.get_subject_breakdown()
            s_key = str(sub_id) if sub_id is not None else "none"
            if s_key in sb:
                sb[s_key]["study_seconds"] = max(
                    0, sb[s_key].get("study_seconds", 0) - sec
                )
                sb[s_key]["pomodoros"] = max(0, sb[s_key].get("pomodoros", 0) - pom)
                if (
                    sb[s_key]["study_seconds"] == 0
                    and sb[s_key]["pomodoros"] == 0
                ):
                    del sb[s_key]
                act.set_subject_breakdown(sb)

        db.session.delete(session)
        db.session.commit()
        return True

