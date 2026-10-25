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

