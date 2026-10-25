from datetime import date, datetime, timedelta

from database import db
from models.course import Course
from models.daily_activity import DailyActivity, DailyCourseActivity


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
                course_breakdown="{}",
            )
            db.session.add(activity)
            db.session.commit()
        return activity

    @classmethod
    def record_study_seconds(
        cls,
        seconds: int,
        course_id: int | None = None,
        course_name: str | None = None,
        date_str: str | None = None,
    ) -> DailyActivity:
        if seconds <= 0:
            return cls.get_or_create_activity(date_str)

        today_str = cls._get_today_str(date_str)
        activity = cls.get_or_create_activity(date_str)
        activity.study_seconds += int(seconds)

        if course_id is not None:
            cb = activity.get_course_breakdown()
            cid = str(course_id)
            if cid not in cb:
                cb[cid] = {
                    "name": course_name or f"Curso #{course_id}",
                    "study_seconds": 0,
                    "pomodoros": 0,
                }
            cb[cid]["study_seconds"] += int(seconds)
            if course_name:
                cb[cid]["name"] = course_name
            activity.set_course_breakdown(cb)

            # Relational record
            dca = DailyCourseActivity.query.filter_by(date=today_str, course_id=course_id).first()
            if not dca:
                dca = DailyCourseActivity(
                    date=today_str,
                    course_id=course_id,
                    course_name=course_name or f"Curso #{course_id}",
                    study_seconds=0,
                    pomodoros=0,
                    lessons=0,
                )
                db.session.add(dca)
            dca.study_seconds += int(seconds)
            if course_name:
                dca.course_name = course_name

        db.session.commit()
        return activity

    @classmethod
    def record_lesson_completed(
        cls,
        date_str: str | None = None,
        course_id: int | None = None,
        course_name: str | None = None,
    ) -> DailyActivity:
        activity = cls.get_or_create_activity(date_str)
        today_str = cls._get_today_str(date_str)
        activity.lessons_completed += 1

        if course_id is not None:
            cb = activity.get_course_breakdown()
            cid = str(course_id)
            if cid not in cb:
                cb[cid] = {
                    "name": course_name or f"Curso #{course_id}",
                    "study_seconds": 0,
                    "pomodoros": 0,
                }
            if course_name:
                cb[cid]["name"] = course_name
            activity.set_course_breakdown(cb)

            # Relational record
            dca = DailyCourseActivity.query.filter_by(date=today_str, course_id=course_id).first()
            if not dca:
                dca = DailyCourseActivity(
                    date=today_str,
                    course_id=course_id,
                    course_name=course_name or f"Curso #{course_id}",
                    study_seconds=0,
                    pomodoros=0,
                    lessons=0,
                )
                db.session.add(dca)
            dca.lessons += 1
            if course_name:
                dca.course_name = course_name

        db.session.commit()
        return activity

    @classmethod
    def record_pomodoro_completed(
        cls,
        study_seconds: int = 1500,
        course_id: int | None = None,
        course_name: str | None = None,
        date_str: str | None = None,
    ) -> DailyActivity:
        activity = cls.get_or_create_activity(date_str)
        today_str = cls._get_today_str(date_str)
        activity.pomodoros_completed += 1
        if study_seconds > 0:
            activity.study_seconds += int(study_seconds)

        if course_id is not None:
            cb = activity.get_course_breakdown()
            cid = str(course_id)
            if cid not in cb:
                cb[cid] = {
                    "name": course_name or f"Curso #{course_id}",
                    "study_seconds": 0,
                    "pomodoros": 0,
                }
            cb[cid]["pomodoros"] = cb[cid].get("pomodoros", 0) + 1
            if study_seconds > 0:
                cb[cid]["study_seconds"] = cb[cid].get("study_seconds", 0) + int(study_seconds)
            if course_name:
                cb[cid]["name"] = course_name
            activity.set_course_breakdown(cb)

            # Relational record
            dca = DailyCourseActivity.query.filter_by(date=today_str, course_id=course_id).first()
            if not dca:
                dca = DailyCourseActivity(
                    date=today_str,
                    course_id=course_id,
                    course_name=course_name or f"Curso #{course_id}",
                    study_seconds=0,
                    pomodoros=0,
                    lessons=0,
                )
                db.session.add(dca)
            dca.pomodoros += 1
            if study_seconds > 0:
                dca.study_seconds += int(study_seconds)
            if course_name:
                dca.course_name = course_name

        db.session.commit()
        return activity

    @classmethod
    def get_heatmap_data(
        cls,
        days: int = 180,
        reference_date: date | None = None,
        course_id: int | None = None,
    ) -> dict:
        ref = reference_date or date.today()
        start_date = ref - timedelta(days=days - 1)
        start_str = start_date.isoformat()
        end_str = ref.isoformat()

        all_records = DailyActivity.query.order_by(DailyActivity.date.asc()).all()
        all_dca = DailyCourseActivity.query.all()
        dca_by_date_course = {(d.date, d.course_id): d for d in all_dca}

        # Extract available courses across all activity records and Course table
        course_map = {}
        for r in all_records:
            cb = r.get_course_breakdown()
            for cid_key, cinfo in cb.items():
                try:
                    cid_num = int(cid_key)
                except ValueError:
                    cid_num = cid_key
                if cid_num not in course_map:
                    course_map[cid_num] = cinfo.get("name", f"Curso {cid_key}")

        for d in all_dca:
            if d.course_id not in course_map:
                course_map[d.course_id] = d.course_name or f"Curso {d.course_id}"

        try:
            all_courses = Course.query.order_by(Course.position.asc(), Course.id.asc()).all()
            for c in all_courses:
                if c.id not in course_map:
                    course_map[c.id] = c.name
        except Exception as e:
            pass

        available_courses = [
            {"id": cid, "name": name}
            for cid, name in sorted(course_map.items(), key=lambda x: str(x[1]))
        ]

        def get_record_stats(r: DailyActivity | None):
            if not r:
                return 0, 0, 0
            if course_id is None:
                return r.study_seconds, r.pomodoros_completed, r.lessons_completed
            # Check relational first
            try:
                cid_int = int(course_id)
            except (ValueError, TypeError):
                cid_int = None
            if cid_int is not None and (r.date, cid_int) in dca_by_date_course:
                d = dca_by_date_course[(r.date, cid_int)]
                return d.study_seconds, d.pomodoros, d.lessons
            # Fallback to course_breakdown JSON
            cid_str = str(course_id)
            cb = r.get_course_breakdown()
            c_data = cb.get(cid_str)
            if not c_data:
                return 0, 0, 0
            return c_data.get("study_seconds", 0), c_data.get("pomodoros", 0), 0

        # Calculate all-time totals (optionally course-specific)
        total_seconds = 0
        total_pomodoros = 0
        total_lessons = 0
        for r in all_records:
            sec, pom, les = get_record_stats(r)
            total_seconds += sec
            total_pomodoros += pom
            total_lessons += les

        records = [r for r in all_records if start_str <= r.date <= end_str]
        record_map = {r.date: r for r in records}

        # Build day grid
        days_data = []
        cur = start_date
        while cur <= ref:
            ds = cur.isoformat()
            act = record_map.get(ds)
            if act:
                sec, pom, les = get_record_stats(act)
                # Parse courses breakdown for tooltip
                day_courses_dict = {}
                cb = act.get_course_breakdown()
                for cid_key, cinfo in cb.items():
                    s = cinfo.get("study_seconds", 0)
                    p = cinfo.get("pomodoros", 0)
                    if s > 0 or p > 0:
                        try:
                            cid_num = int(cid_key)
                        except ValueError:
                            cid_num = cid_key
                        day_courses_dict[cid_num] = {
                            "id": cid_num,
                            "name": cinfo.get("name", f"Curso {cid_key}"),
                            "seconds": s,
                            "pomodoros": p,
                        }
                for d in all_dca:
                    if d.date == ds and (d.study_seconds > 0 or d.pomodoros > 0):
                        if d.course_id in day_courses_dict:
                            day_courses_dict[d.course_id]["seconds"] = max(day_courses_dict[d.course_id]["seconds"], d.study_seconds)
                            day_courses_dict[d.course_id]["pomodoros"] = max(day_courses_dict[d.course_id]["pomodoros"], d.pomodoros)
                        else:
                            day_courses_dict[d.course_id] = {
                                "id": d.course_id,
                                "name": d.course_name or f"Curso {d.course_id}",
                                "seconds": d.study_seconds,
                                "pomodoros": d.pomodoros,
                            }
                day_courses = list(day_courses_dict.values())
                day_courses.sort(key=lambda x: x["seconds"], reverse=True)
            else:
                sec, pom, les = 0, 0, 0
                day_courses = []

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
                    "courses": day_courses,
                }
            )
            cur += timedelta(days=1)

        # Calculate streaks using all history
        active_dates = set()
        for r in all_records:
            sec, pom, les = get_record_stats(r)
            if sec > 0 or pom > 0 or les > 0:
                active_dates.add(r.date)

        current_streak = 0
        check_date = ref
        if ref.isoformat() not in active_dates:
            check_date = ref - timedelta(days=1)

        while check_date.isoformat() in active_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # Max streak
        max_streak = 0
        temp_streak = 0
        if active_dates:
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

        today_record = record_map.get(ref.isoformat())
        today_seconds = get_record_stats(today_record)[0] if today_record else 0

        # Current calendar week (Monday to today)
        week_start = ref - timedelta(days=ref.weekday())
        week_records = [
            r for r in all_records if week_start.isoformat() <= r.date <= end_str
        ]
        week_seconds = sum(get_record_stats(r)[0] for r in week_records)
        week_active_days = len(
            {
                r.date
                for r in week_records
                if any(v > 0 for v in get_record_stats(r))
            }
        )

        # Previous calendar week (Monday to Sunday of previous week)
        last_week_start = week_start - timedelta(days=7)
        last_week_end = week_start - timedelta(days=1)
        last_week_records = [
            r for r in all_records if last_week_start.isoformat() <= r.date <= last_week_end.isoformat()
        ]
        last_week_seconds = sum(get_record_stats(r)[0] for r in last_week_records)
        delta_week_seconds = week_seconds - last_week_seconds

        return {
            "current_streak": current_streak,
            "max_streak": max(max_streak, current_streak),
            "total_seconds": total_seconds,
            "total_pomodoros": total_pomodoros,
            "total_lessons": total_lessons,
            "today_seconds": today_seconds,
            "week_seconds": week_seconds,
            "week_active_days": week_active_days,
            "last_week_seconds": last_week_seconds,
            "delta_week_seconds": delta_week_seconds,
            "available_courses": available_courses,
            "days": days_data,
        }


