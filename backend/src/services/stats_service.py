from datetime import date, datetime, timedelta

from database import db
from models.daily_activity import DailyActivity


class StatsService:
    @staticmethod
    def _get_today_str(target_date: str | None = None) -> str:
        if target_date:
            return target_date
        return date.today().isoformat()

    @classmethod
    def get_or_create_activity(cls, date_str: str | None = None) -> DailyActivity:
        today_str = cls._get_today_str(date_str)
        activity = DailyActivity.query.filter_by(date=today_str).first()
        if not activity:
            activity = DailyActivity(
                date=today_str,
                study_seconds=0,
                lessons_completed=0,
                pomodoros_completed=0,
            )
            db.session.add(activity)
            db.session.commit()
        return activity

    @classmethod
    def record_study_seconds(
        cls, seconds: int, date_str: str | None = None
    ) -> DailyActivity:
        if seconds <= 0:
            return cls.get_or_create_activity(date_str)

        activity = cls.get_or_create_activity(date_str)
        activity.study_seconds += int(seconds)
        db.session.commit()
        return activity

    @classmethod
    def record_lesson_completed(cls, date_str: str | None = None) -> DailyActivity:
        activity = cls.get_or_create_activity(date_str)
        activity.lessons_completed += 1
        db.session.commit()
        return activity

    @classmethod
    def record_pomodoro_completed(
        cls, study_seconds: int = 1500, date_str: str | None = None
    ) -> DailyActivity:
        activity = cls.get_or_create_activity(date_str)
        activity.pomodoros_completed += 1
        if study_seconds > 0:
            activity.study_seconds += int(study_seconds)
        db.session.commit()
        return activity

    @classmethod
    def get_heatmap_data(
        cls, days: int = 180, reference_date: date | None = None
    ) -> dict:
        ref = reference_date or date.today()
        start_date = ref - timedelta(days=days - 1)
        start_str = start_date.isoformat()
        end_str = ref.isoformat()

        records = (
            DailyActivity.query.filter(
                DailyActivity.date >= start_str, DailyActivity.date <= end_str
            )
            .order_by(DailyActivity.date.asc())
            .all()
        )
        record_map = {r.date: r for r in records}

        # Calculate all-time totals
        all_records = DailyActivity.query.order_by(DailyActivity.date.asc()).all()
        total_seconds = sum(r.study_seconds for r in all_records)
        total_pomodoros = sum(r.pomodoros_completed for r in all_records)
        total_lessons = sum(r.lessons_completed for r in all_records)

        # Build day grid
        days_data = []
        cur = start_date
        while cur <= ref:
            ds = cur.isoformat()
            act = record_map.get(ds)
            sec = act.study_seconds if act else 0
            pom = act.pomodoros_completed if act else 0
            les = act.lessons_completed if act else 0

            # Level 0 to 4 based on activity
            if sec == 0 and pom == 0 and les == 0:
                level = 0
            elif sec < 900 and pom == 0:
                level = 1
            elif sec < 2700 or pom == 1:
                level = 2
            elif sec < 5400 or pom in (2, 3):
                level = 3
            else:
                level = 4

            days_data.append(
                {
                    "date": ds,
                    "study_seconds": sec,
                    "pomodoros": pom,
                    "lessons": les,
                    "level": level,
                }
            )
            cur += timedelta(days=1)

        # Calculate streaks using all history
        active_dates = {
            r.date
            for r in all_records
            if (
                r.study_seconds > 0
                or r.pomodoros_completed > 0
                or r.lessons_completed > 0
            )
        }

        current_streak = 0
        check_date = ref
        # If no activity today, streak can still be maintained from yesterday
        if ref.isoformat() not in active_dates:
            check_date = ref - timedelta(days=1)

        while check_date.isoformat() in active_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # Max streak
        max_streak = 0
        temp_streak = 0
        if all_records:
            sorted_dates = sorted(
                datetime.strptime(d, "%Y-%m-%d").date() for d in active_dates
            )
            for i, d in enumerate(sorted_dates):
                if i == 0:
                    temp_streak = 1
                else:
                    if d == sorted_dates[i - 1] + timedelta(days=1):
                        temp_streak += 1
                    else:
                        temp_streak = 1
                if temp_streak > max_streak:
                    max_streak = temp_streak

        return {
            "current_streak": current_streak,
            "max_streak": max(max_streak, current_streak),
            "total_seconds": total_seconds,
            "total_pomodoros": total_pomodoros,
            "total_lessons": total_lessons,
            "days": days_data,
        }
