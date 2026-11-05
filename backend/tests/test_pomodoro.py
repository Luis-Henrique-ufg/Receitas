from datetime import date
from models.subject import Subject
from services.pomodoro_service import PomodoroService
from services.stats_service import StatsService


class TestPomodoroSessions:
    def test_record_pomodoro_creates_session(self, app, client):
        with app.app_context():
            from database import db

            sub = Subject(name="Direito Penal", color="#ef4444")
            db.session.add(sub)
            db.session.commit()
            sub_id = sub.id

            today = date.today().isoformat()
            StatsService.record_pomodoro_completed(
                study_seconds=1500,
                subject_id=sub_id,
                date_str=today,
                pomodoros=1,
                intention="Resolver 10 questões de tipicidade",
                start_time="10:00",
                end_time="10:25",
            )

            sessions = PomodoroService.list_by_date(today)
            assert len(sessions) >= 1
            s = sessions[-1]
            assert s.duration_seconds == 1500
            assert s.subject_id == sub_id
            assert s.intention == "Resolver 10 questões de tipicidade"
            assert s.start_time == "10:00"
            assert s.end_time == "10:25"

    def test_update_session_subject_reconciles_stats(self, app, client):
        with app.app_context():
            from database import db
            from models.daily_activity import DailySubjectActivity

            today = "2026-11-03"
            sub1 = Subject(name="Cálculo I", color="#3b82f6")
            sub2 = Subject(name="Álgebra Linear", color="#10b981")
            db.session.add_all([sub1, sub2])
            db.session.commit()

            # Record session under sub1
            StatsService.record_pomodoro_completed(
                study_seconds=1800,
                subject_id=sub1.id,
                date_str=today,
                pomodoros=1,
                intention="Derivadas parciais",
            )

            sessions = PomodoroService.list_by_date(today)
            s_id = sessions[0].id

            # Verify sub1 has 1800s
            dsa1 = DailySubjectActivity.query.filter_by(
                date=today, subject_id=sub1.id
            ).first()
            assert dsa1.study_seconds == 1800

            # Reassign session to sub2
            res = client.patch(
                f"/api/pomodoro/sessions/{s_id}",
                json={"subject_id": sub2.id},
            )
            assert res.status_code == 200
            data = res.get_json()
            assert data["subject_id"] == sub2.id
            assert data["subject_name"] == "Álgebra Linear"

            # Check that dsa1 was deducted and dsa2 received the 1800s
            dsa1_after = DailySubjectActivity.query.filter_by(
                date=today, subject_id=sub1.id
            ).first()
            assert dsa1_after is None or dsa1_after.study_seconds == 0

            dsa2 = DailySubjectActivity.query.filter_by(
                date=today, subject_id=sub2.id
            ).first()
            assert dsa2 is not None
            assert dsa2.study_seconds == 1800
            assert dsa2.pomodoros == 1

    def test_update_session_intention(self, app, client):
        with app.app_context():
            today = "2026-11-04"
            session = PomodoroService.create({
                "date": today,
                "duration_seconds": 1500,
                "pomodoros": 1,
                "intention": "Rascunho inicial",
            })
            s_id = session.id

            res = client.patch(
                f"/api/pomodoro/sessions/{s_id}",
                json={"intention": "Finalizar resumo completo"},
            )
            assert res.status_code == 200
            assert res.get_json()["intention"] == "Finalizar resumo completo"

    def test_delete_session_deducts_stats(self, app, client):
        with app.app_context():
            from models.daily_activity import DailyActivity

            today = "2026-11-05"
            StatsService.record_pomodoro_completed(
                study_seconds=1500,
                subject_id=None,
                date_str=today,
                pomodoros=1,
            )

            sessions = PomodoroService.list_by_date(today)
            assert len(sessions) == 1
            s_id = sessions[0].id

            res = client.delete(f"/api/pomodoro/sessions/{s_id}")
            assert res.status_code == 200

            sessions_after = PomodoroService.list_by_date(today)
            assert len(sessions_after) == 0

            act = DailyActivity.query.filter_by(date=today).first()
            assert act.pomodoros_completed == 0

