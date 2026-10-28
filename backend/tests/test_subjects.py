from datetime import date

from models.subject import Subject
from services.stats_service import StatsService
from services.subject_service import SubjectService


class TestSubjectService:
    def test_create_and_list_subjects(self, app):
        with app.app_context():
            sub1 = SubjectService.create(
                {
                    "name": "Estatística UFG",
                    "color": "#f59e0b",
                    "code": "INF0124",
                    "semester": "2026/2",
                }
            )
            assert sub1.id is not None
            assert sub1.name == "Estatística UFG"
            assert sub1.color == "#f59e0b"
            assert sub1.is_archived is False

            sub2 = SubjectService.create({"name": "Algoritmos", "color": "#3b82f6"})
            assert sub2.id is not None

            active_list = SubjectService.list_all(include_archived=False)
            names = [s.name for s in active_list]
            assert "Estatística UFG" in names
            assert "Algoritmos" in names

    def test_archive_and_update(self, app):
        with app.app_context():
            sub = SubjectService.create({"name": "Cálculo I", "color": "#10b981"})
            SubjectService.archive(sub.id, archive_state=True)

            active = SubjectService.list_all(include_archived=False)
            assert not any(s.id == sub.id for s in active)

            all_subs = SubjectService.list_all(include_archived=True)
            archived_sub = next(s for s in all_subs if s.id == sub.id)
            assert archived_sub.is_archived is True

            # Update name and color
            updated = SubjectService.update(
                sub.id, {"name": "Cálculo Avançado", "color": "#8b5cf6"}
            )
            assert updated.name == "Cálculo Avançado"
            assert updated.color == "#8b5cf6"

            # Delete
            deleted = SubjectService.delete(sub.id)
            assert deleted is True
            assert SubjectService.get_by_id(sub.id) is None


class TestSubjectsAPI:
    def test_api_crud_flow(self, client):
        # Create
        res = client.post(
            "/api/subjects",
            json={
                "name": "Física Geral",
                "color": "#06b6d4",
                "code": "FIS001",
                "semester": "2026/2",
            },
        )
        assert res.status_code == 201
        data = res.get_json()
        sub_id = data["id"]
        assert data["name"] == "Física Geral"
        assert data["color"] == "#06b6d4"

        # List
        res_list = client.get("/api/subjects")
        assert res_list.status_code == 200
        items = res_list.get_json()
        assert any(i["id"] == sub_id for i in items)

        # Update
        res_up = client.put(
            f"/api/subjects/{sub_id}",
            json={"name": "Física I e Experimental"},
        )
        assert res_up.status_code == 200
        assert res_up.get_json()["name"] == "Física I e Experimental"

        # Archive
        res_arc = client.patch(
            f"/api/subjects/{sub_id}/archive",
            json={"archive": True},
        )
        assert res_arc.status_code == 200
        assert res_arc.get_json()["is_archived"] is True

        # Delete
        res_del = client.delete(f"/api/subjects/{sub_id}")
        assert res_del.status_code == 200


class TestFocusBarsAndSubjectStats:
    def test_pomodoro_with_subject_and_focus_bars(self, app, client):
        with app.app_context():
            sub = Subject(name="Engenharia de Software", color="#f43f5e")
            from database import db

            db.session.add(sub)
            db.session.commit()
            sub_id = sub.id

            # Record pomodoro for subject
            StatsService.record_pomodoro_completed(
                study_seconds=1500,
                subject_id=sub_id,
                subject_name="Engenharia de Software",
                date_str="2026-10-25",
            )
            # Record unassigned pomodoro
            StatsService.record_pomodoro_completed(
                study_seconds=1500,
                subject_id=None,
                subject_name="Sem matéria",
                date_str="2026-10-25",
            )

            # Check focus bars by day
            bars_day = StatsService.get_focus_bars_data(
                period="day",
                offset=0,
                limit=14,
                reference_date=date(2026, 10, 26),
            )
            assert bars_day["period"] == "day"
            assert bars_day["total_study_seconds"] >= 3000
            assert bars_day["total_pomodoros"] >= 2
            assert len(bars_day["bars"]) == 14

            oct25_bar = next(
                b for b in bars_day["bars"] if b["start_date"] == "2026-10-25"
            )
            assert oct25_bar["total_seconds"] == 3000
            assert oct25_bar["total_pomodoros"] == 2
            assert len(oct25_bar["breakdown"]) == 2

            # Check focus bars by week (starting Monday)
            bars_week = StatsService.get_focus_bars_data(
                period="week",
                offset=0,
                limit=12,
                reference_date=date(2026, 10, 26),
            )
            assert bars_week["period"] == "week"
            assert len(bars_week["bars"]) == 12

            # Heatmap subject filter
            heat_sub = StatsService.get_heatmap_data(
                days=7,
                reference_date=date(2026, 10, 26),
                subject_id=sub_id,
            )
            oct25_heat = next(d for d in heat_sub["days"] if d["date"] == "2026-10-25")
            assert oct25_heat["study_seconds"] == 1500
            assert oct25_heat["pomodoros"] == 1

        # Test API endpoint
        res = client.get("/api/stats/focus-bars?period=day&offset=0&limit=14")
        assert res.status_code == 200
        data = res.get_json()
        assert "bars" in data
        assert "subjects" in data

    def test_video_heartbeat_does_not_create_sem_materia_in_focus_bars(
        self, app, client
    ):
        with app.app_context():
            from database import db

            sub = Subject(name="Cálculo II", color="#10b981")
            db.session.add(sub)
            db.session.commit()
            sub_id = sub.id

            # 1. User watches video course (heartbeat: 1200 seconds, course_id=10, no subject)
            StatsService.record_study_seconds(
                seconds=1200,
                course_id=10,
                course_name="Curso de Vídeo",
                date_str="2026-10-27",
            )

            # 2. User completes a Pomodoro linked to Cálculo II (study_seconds=1800 with overtime, 1 pomodoro)
            StatsService.record_pomodoro_completed(
                study_seconds=1800,
                subject_id=sub_id,
                subject_name="Cálculo II",
                date_str="2026-10-27",
                pomodoros=1,
            )

            # 3. Retrieve focus bars for this day
            bars_day = StatsService.get_focus_bars_data(
                period="day",
                offset=0,
                limit=14,
                reference_date=date(2026, 10, 27),
            )
            oct27_bar = next(
                b for b in bars_day["bars"] if b["start_date"] == "2026-10-27"
            )

            # The bar should only have Cálculo II and NOT "Sem matéria"
            assert oct27_bar["total_seconds"] == 1800
            assert oct27_bar["total_pomodoros"] == 1
            breakdown_names = [seg["name"] for seg in oct27_bar["breakdown"]]
            assert "Cálculo II" in breakdown_names
            assert "Sem matéria" not in breakdown_names
