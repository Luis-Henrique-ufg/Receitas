from datetime import date

from models.daily_activity import DailyActivity
from services.stats_service import StatsService


class TestStatsService:
    def test_record_study_seconds_and_heatmap(self, app):
        with app.app_context():
            StatsService.record_study_seconds(1200, date_str="2026-10-20")
            StatsService.record_lesson_completed(date_str="2026-10-20")
            StatsService.record_pomodoro_completed(1500, date_str="2026-10-20")

            activity = DailyActivity.query.filter_by(date="2026-10-20").first()
            assert activity is not None
            assert activity.study_seconds == 2700  # 1200 + 1500
            assert activity.lessons_completed == 1
            assert activity.pomodoros_completed == 1

            # Test streak calculation
            StatsService.record_study_seconds(600, date_str="2026-10-21")
            StatsService.record_study_seconds(600, date_str="2026-10-22")

            heatmap = StatsService.get_heatmap_data(
                days=7, reference_date=date(2026, 10, 22)
            )
            assert heatmap["total_seconds"] == 3900
            assert heatmap["total_pomodoros"] == 1
            assert heatmap["total_lessons"] == 1
            assert heatmap["current_streak"] == 3
            assert heatmap["max_streak"] == 3
            assert len(heatmap["days"]) == 7
            assert "delta_week_seconds" in heatmap

            # Test full calendar year (Jan to Dec full week alignment)
            year_heat = StatsService.get_heatmap_data(
                year=2026, reference_date=date(2026, 10, 22)
            )
            # Days must be divisible by 7 (full weeks Monday through Sunday)
            assert len(year_heat["days"]) % 7 == 0
            assert (
                year_heat["days"][0]["date"] == "2025-12-29"
            )  # Monday of week containing Jan 1
            assert (
                year_heat["days"][-1]["date"] == "2027-01-03"
            )  # Sunday of week containing Dec 31
            assert year_heat["current_streak"] == 3

    def test_course_linking_and_filtering(self, app):
        with app.app_context():
            StatsService.record_study_seconds(
                1800, course_id=1, course_name="Estatística", date_str="2026-10-23"
            )
            StatsService.record_pomodoro_completed(
                1500, course_id=2, course_name="Linguagem C", date_str="2026-10-23"
            )

            # Global heatmap
            heat_all = StatsService.get_heatmap_data(
                days=7, reference_date=date(2026, 10, 23)
            )
            day_oct23 = next(d for d in heat_all["days"] if d["date"] == "2026-10-23")
            assert len(day_oct23["courses"]) == 2
            course_names = {c["name"] for c in day_oct23["courses"]}
            assert "Estatística" in course_names
            assert "Linguagem C" in course_names

            # Course 1 filtered heatmap
            heat_c1 = StatsService.get_heatmap_data(
                days=7, reference_date=date(2026, 10, 23), course_id=1
            )
            day_oct23_c1 = next(d for d in heat_c1["days"] if d["date"] == "2026-10-23")
            assert day_oct23_c1["study_seconds"] == 1800
            assert day_oct23_c1["pomodoros"] == 0

            # Course 2 filtered heatmap
            heat_c2 = StatsService.get_heatmap_data(
                days=7, reference_date=date(2026, 10, 23), course_id=2
            )
            day_oct23_c2 = next(d for d in heat_c2["days"] if d["date"] == "2026-10-23")
            assert day_oct23_c2["study_seconds"] == 1500
            assert day_oct23_c2["pomodoros"] == 1


class TestStatsAPI:
    def test_stats_api_endpoints(self, client):
        # 1. Post pomodoro with course info
        res_pom = client.post(
            "/api/stats/pomodoro",
            json={"study_seconds": 1500, "course_id": 10, "course_name": "Física"},
        )
        assert res_pom.status_code == 200
        assert res_pom.get_json()["activity"]["pomodoros_completed"] == 1
        assert "10" in res_pom.get_json()["activity"]["course_breakdown"]

        # 2. Post heartbeat with course info
        res_hb = client.post(
            "/api/stats/heartbeat",
            json={"seconds": 300, "course_id": 10, "course_name": "Física"},
        )
        assert res_hb.status_code == 200
        assert res_hb.get_json()["activity"]["study_seconds"] >= 1800

        # 3. Get heatmap with course_id filter
        res_heat = client.get("/api/stats/heatmap?days=30&course_id=10")
        assert res_heat.status_code == 200
        data = res_heat.get_json()
        assert "days" in data
        assert "current_streak" in data
        assert data["total_pomodoros"] >= 1
        assert "available_courses" in data
        assert "delta_week_seconds" in data


class TestMigrations:
    def test_migration_adds_missing_course_breakdown(self, tmp_path):
        import sqlite3

        from sqlalchemy import create_engine, inspect, text

        from migrations import run_migrations

        db_file = tmp_path / "legacy.sqlite"
        conn = sqlite3.connect(str(db_file))
        # Create legacy daily_activity table WITHOUT course_breakdown
        conn.execute("""
            CREATE TABLE daily_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date VARCHAR(10) NOT NULL UNIQUE,
                study_seconds INTEGER NOT NULL DEFAULT 0,
                lessons_completed INTEGER NOT NULL DEFAULT 0,
                pomodoros_completed INTEGER NOT NULL DEFAULT 0
            )
            """)
        conn.execute(
            "INSERT INTO daily_activity (date, study_seconds, lessons_completed, pomodoros_completed) VALUES ('2026-10-24', 600, 2, 0)"
        )
        conn.commit()
        conn.close()

        engine = create_engine(f"sqlite:///{db_file}")
        inspector_before = inspect(engine)
        cols_before = [
            c["name"] for c in inspector_before.get_columns("daily_activity")
        ]
        assert "course_breakdown" not in cols_before

        # Run migration
        run_migrations(engine)

        inspector_after = inspect(engine)
        cols_after = [c["name"] for c in inspector_after.get_columns("daily_activity")]
        assert "course_breakdown" in cols_after
        tables_after = inspector_after.get_table_names()
        assert "daily_course_activity" in tables_after

        # Verify old row is intact
        with engine.connect() as check_conn:
            row = check_conn.execute(
                text(
                    "SELECT date, study_seconds, course_breakdown FROM daily_activity WHERE date='2026-10-24'"
                )
            ).fetchone()
            assert row[0] == "2026-10-24"
            assert row[1] == 600
            assert row[2] == "{}"
