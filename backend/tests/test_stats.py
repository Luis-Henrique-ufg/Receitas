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


class TestStatsAPI:
    def test_stats_api_endpoints(self, client):
        # 1. Post pomodoro
        res_pom = client.post("/api/stats/pomodoro", json={"study_seconds": 1500})
        assert res_pom.status_code == 200
        assert res_pom.get_json()["activity"]["pomodoros_completed"] == 1

        # 2. Post heartbeat
        res_hb = client.post("/api/stats/heartbeat", json={"seconds": 300})
        assert res_hb.status_code == 200
        assert res_hb.get_json()["activity"]["study_seconds"] >= 1800

        # 3. Get heatmap
        res_heat = client.get("/api/stats/heatmap?days=30")
        assert res_heat.status_code == 200
        data = res_heat.get_json()
        assert "days" in data
        assert "current_streak" in data
        assert data["total_pomodoros"] >= 1
