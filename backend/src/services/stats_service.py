import calendar
from datetime import date, datetime, timedelta

from database import db
from models.course import Course
from models.daily_activity import (
    DailyActivity,
    DailyCourseActivity,
    DailySubjectActivity,
)
from models.subject import Subject

MONTH_NAMES_BR = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
]

DAY_NAMES_BR = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


class StatsService:
    @staticmethod
    def _get_today_date() -> date:
        try:
            from zoneinfo import ZoneInfo

            return datetime.now(ZoneInfo("America/Sao_Paulo")).date()
        except Exception:
            return date.today()

    @classmethod
    def _get_today_str(cls, target_date: str | None = None) -> str:
        if target_date:
            return target_date
        return cls._get_today_date().isoformat()

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
                subject_breakdown="{}",
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
        subject_id: int | None = None,
        subject_name: str | None = None,
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
            dca = DailyCourseActivity.query.filter_by(
                date=today_str, course_id=course_id
            ).first()
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

        # Subject tracking (relational + breakdown)
        resolved_subject_name = subject_name
        if subject_id is not None and not resolved_subject_name:
            sub = db.session.get(Subject, subject_id)
            if sub:
                resolved_subject_name = sub.name

        if subject_id is None:
            resolved_subject_name = resolved_subject_name or "Sem matéria"
        elif not resolved_subject_name:
            resolved_subject_name = f"Matéria #{subject_id}"

        dsa = DailySubjectActivity.query.filter_by(
            date=today_str, subject_id=subject_id
        ).first()
        if not dsa:
            dsa = DailySubjectActivity(
                date=today_str,
                subject_id=subject_id,
                subject_name=resolved_subject_name,
                study_seconds=0,
                pomodoros=0,
            )
            db.session.add(dsa)
        dsa.study_seconds += int(seconds)
        if resolved_subject_name:
            dsa.subject_name = resolved_subject_name

        sb = activity.get_subject_breakdown()
        s_key = str(subject_id) if subject_id is not None else "none"
        if s_key not in sb:
            sb[s_key] = {
                "id": subject_id,
                "name": resolved_subject_name,
                "study_seconds": 0,
                "pomodoros": 0,
            }
        sb[s_key]["study_seconds"] = sb[s_key].get("study_seconds", 0) + int(seconds)
        if resolved_subject_name:
            sb[s_key]["name"] = resolved_subject_name
        activity.set_subject_breakdown(sb)

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
            dca = DailyCourseActivity.query.filter_by(
                date=today_str, course_id=course_id
            ).first()
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
        study_seconds: int = 0,
        course_id: int | None = None,
        course_name: str | None = None,
        subject_id: int | None = None,
        subject_name: str | None = None,
        date_str: str | None = None,
        pomodoros: int = 1,
    ) -> DailyActivity:
        activity = cls.get_or_create_activity(date_str)
        today_str = cls._get_today_str(date_str)
        pomodoros_to_add = max(1, int(pomodoros))
        activity.pomodoros_completed += pomodoros_to_add

        # Pomodoro study seconds
        if study_seconds > 0:
            activity.study_seconds += int(study_seconds)

        # Legacy course tracking (optional)
        if course_id is not None:
            cb = activity.get_course_breakdown()
            cid = str(course_id)
            if cid not in cb:
                cb[cid] = {
                    "name": course_name or f"Curso #{course_id}",
                    "study_seconds": 0,
                    "pomodoros": 0,
                }
            cb[cid]["pomodoros"] = cb[cid].get("pomodoros", 0) + pomodoros_to_add
            if study_seconds > 0:
                cb[cid]["study_seconds"] = cb[cid].get("study_seconds", 0) + int(
                    study_seconds
                )
            if course_name:
                cb[cid]["name"] = course_name
            activity.set_course_breakdown(cb)

            dca = DailyCourseActivity.query.filter_by(
                date=today_str, course_id=course_id
            ).first()
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
            dca.pomodoros += pomodoros_to_add
            if study_seconds > 0:
                dca.study_seconds += int(study_seconds)
            if course_name:
                dca.course_name = course_name

        # Subject tracking (New Feature: Focus by Subject)
        # If subject_id is provided or explicitly none
        resolved_subject_name = subject_name
        if subject_id is not None and not resolved_subject_name:
            sub = db.session.get(Subject, subject_id)
            if sub:
                resolved_subject_name = sub.name

        if subject_id is None:
            resolved_subject_name = resolved_subject_name or "Sem matéria"
        elif not resolved_subject_name:
            resolved_subject_name = f"Matéria #{subject_id}"

        # 1. Update DailySubjectActivity relational table
        dsa = DailySubjectActivity.query.filter_by(
            date=today_str, subject_id=subject_id
        ).first()
        if not dsa:
            dsa = DailySubjectActivity(
                date=today_str,
                subject_id=subject_id,
                subject_name=resolved_subject_name,
                study_seconds=0,
                pomodoros=0,
            )
            db.session.add(dsa)
        dsa.pomodoros += pomodoros_to_add
        if study_seconds > 0:
            dsa.study_seconds += int(study_seconds)
        if resolved_subject_name:
            dsa.subject_name = resolved_subject_name

        # 2. Update subject_breakdown JSON in DailyActivity
        sb = activity.get_subject_breakdown()
        s_key = str(subject_id) if subject_id is not None else "none"
        if s_key not in sb:
            sb[s_key] = {
                "id": subject_id,
                "name": resolved_subject_name,
                "study_seconds": 0,
                "pomodoros": 0,
            }
        sb[s_key]["pomodoros"] = sb[s_key].get("pomodoros", 0) + pomodoros_to_add
        if study_seconds > 0:
            sb[s_key]["study_seconds"] = sb[s_key].get("study_seconds", 0) + int(
                study_seconds
            )
        if resolved_subject_name:
            sb[s_key]["name"] = resolved_subject_name
        activity.set_subject_breakdown(sb)

        db.session.commit()
        return activity

    @classmethod
    def get_heatmap_data(
        cls,
        days: int = 180,
        reference_date: date | None = None,
        course_id: int | None = None,
        subject_id: int | None = None,
    ) -> dict:
        ref = reference_date or cls._get_today_date()
        start_date = ref - timedelta(days=days - 1)
        start_str = start_date.isoformat()
        end_str = ref.isoformat()

        all_records = DailyActivity.query.order_by(DailyActivity.date.asc()).all()
        all_dca = DailyCourseActivity.query.all()
        dca_by_date_course = {(d.date, d.course_id): d for d in all_dca}

        all_dsa = DailySubjectActivity.query.all()
        dsa_by_date_subject = {(d.date, d.subject_id): d for d in all_dsa}

        # Available courses
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
            all_courses = Course.query.order_by(
                Course.position.asc(), Course.id.asc()
            ).all()
            for c in all_courses:
                if c.id not in course_map:
                    course_map[c.id] = c.name
        except Exception:
            pass

        available_courses = [
            {"id": cid, "name": name}
            for cid, name in sorted(course_map.items(), key=lambda x: str(x[1]))
        ]

        # Available subjects from database & daily activity
        all_db_subjects = Subject.query.order_by(
            Subject.is_archived.asc(), Subject.name.asc()
        ).all()
        subject_dict = {
            s.id: {
                "id": s.id,
                "name": s.name,
                "color": s.color,
                "is_archived": s.is_archived,
            }
            for s in all_db_subjects
        }

        # Check if unassigned pomodoros exist
        has_unassigned = any(d.subject_id is None for d in all_dsa)
        for r in all_records:
            sb = r.get_subject_breakdown()
            if "none" in sb:
                has_unassigned = True
            for skey, sval in sb.items():
                if skey != "none":
                    try:
                        sid = int(skey)
                        if sid not in subject_dict:
                            subject_dict[sid] = {
                                "id": sid,
                                "name": sval.get("name", f"Matéria #{sid}"),
                                "color": "#3b82f6",
                                "is_archived": False,
                            }
                    except ValueError:
                        pass

        available_subjects = list(subject_dict.values())
        if has_unassigned:
            available_subjects.append(
                {
                    "id": -1,
                    "name": "Sem matéria",
                    "color": "#64748b",
                    "is_archived": False,
                }
            )

        # Helper to compute daily stats considering filters
        def get_record_stats(r: DailyActivity | None):
            if not r:
                return 0, 0, 0

            # 1. Subject filter takes precedence if specified
            if subject_id is not None:
                # -1 means "Sem matéria" (subject_id is None)
                target_sub_id = None if subject_id == -1 else subject_id
                if (r.date, target_sub_id) in dsa_by_date_subject:
                    d = dsa_by_date_subject[(r.date, target_sub_id)]
                    return d.study_seconds, d.pomodoros, 0

                s_key = "none" if target_sub_id is None else str(target_sub_id)
                sb = r.get_subject_breakdown()
                s_data = sb.get(s_key)
                if not s_data:
                    return 0, 0, 0
                return (
                    s_data.get("study_seconds", 0),
                    s_data.get("pomodoros", 0),
                    0,
                )

            # 2. Course filter if specified
            if course_id is not None:
                try:
                    cid_int = int(course_id)
                except (ValueError, TypeError):
                    cid_int = None
                if cid_int is not None and (r.date, cid_int) in dca_by_date_course:
                    d = dca_by_date_course[(r.date, cid_int)]
                    return d.study_seconds, d.pomodoros, d.lessons

                cid_str = str(course_id)
                cb = r.get_course_breakdown()
                c_data = cb.get(cid_str)
                if not c_data:
                    return 0, 0, 0
                return (
                    c_data.get("study_seconds", 0),
                    c_data.get("pomodoros", 0),
                    0,
                )

            # 3. Overall stats
            return r.study_seconds, r.pomodoros_completed, r.lessons_completed

        # Calculate all-time totals
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
                            day_courses_dict[d.course_id]["seconds"] = max(
                                day_courses_dict[d.course_id]["seconds"],
                                d.study_seconds,
                            )
                            day_courses_dict[d.course_id]["pomodoros"] = max(
                                day_courses_dict[d.course_id]["pomodoros"],
                                d.pomodoros,
                            )
                        else:
                            day_courses_dict[d.course_id] = {
                                "id": d.course_id,
                                "name": (d.course_name or f"Curso {d.course_id}"),
                                "seconds": d.study_seconds,
                                "pomodoros": d.pomodoros,
                            }
                day_courses = list(day_courses_dict.values())
                day_courses.sort(key=lambda x: x["seconds"], reverse=True)

                # Parse subjects breakdown for tooltip
                day_subjects_dict = {}
                sb = act.get_subject_breakdown()
                for skey, sinfo in sb.items():
                    s_sec = sinfo.get("study_seconds", 0)
                    s_pom = sinfo.get("pomodoros", 0)
                    if s_sec > 0 or s_pom > 0:
                        sid = None if skey == "none" else int(skey)
                        color = (
                            subject_dict.get(sid, {}).get("color", "#3b82f6")
                            if sid
                            else "#64748b"
                        )
                        day_subjects_dict[sid] = {
                            "id": sid,
                            "name": sinfo.get(
                                "name",
                                "Sem matéria" if sid is None else f"Matéria #{sid}",
                            ),
                            "color": color,
                            "seconds": s_sec,
                            "pomodoros": s_pom,
                        }
                for d in all_dsa:
                    if d.date == ds and (d.study_seconds > 0 or d.pomodoros > 0):
                        color = (
                            subject_dict.get(d.subject_id, {}).get("color", "#3b82f6")
                            if d.subject_id
                            else "#64748b"
                        )
                        if d.subject_id in day_subjects_dict:
                            day_subjects_dict[d.subject_id]["seconds"] = max(
                                day_subjects_dict[d.subject_id]["seconds"],
                                d.study_seconds,
                            )
                            day_subjects_dict[d.subject_id]["pomodoros"] = max(
                                day_subjects_dict[d.subject_id]["pomodoros"],
                                d.pomodoros,
                            )
                        else:
                            day_subjects_dict[d.subject_id] = {
                                "id": d.subject_id,
                                "name": d.subject_name
                                or (
                                    "Sem matéria"
                                    if d.subject_id is None
                                    else f"Matéria #{d.subject_id}"
                                ),
                                "color": color,
                                "seconds": d.study_seconds,
                                "pomodoros": d.pomodoros,
                            }
                day_subjects = list(day_subjects_dict.values())
                day_subjects.sort(key=lambda x: x["seconds"], reverse=True)
            else:
                sec, pom, les = 0, 0, 0
                day_courses = []
                day_subjects = []

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
                    "subjects": day_subjects,
                }
            )
            cur += timedelta(days=1)

        # Calculate streaks
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
            {r.date for r in week_records if any(v > 0 for v in get_record_stats(r))}
        )

        # Previous calendar week
        last_week_start = week_start - timedelta(days=7)
        last_week_end = week_start - timedelta(days=1)
        last_week_records = [
            r
            for r in all_records
            if last_week_start.isoformat() <= r.date <= last_week_end.isoformat()
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
            "available_subjects": available_subjects,
            "days": days_data,
        }

    @classmethod
    def get_focus_bars_data(
        cls,
        period: str = "day",
        offset: int = 0,
        limit: int | None = None,
        reference_date: date | None = None,
    ) -> dict:
        """
        Computes stacked focus bars by subject for Dia, Semana, Mês, and Ano.
        Semana starts on Monday.
        """
        ref = reference_date or cls._get_today_date()
        valid_periods = ["day", "week", "month", "year"]
        if period not in valid_periods:
            period = "day"

        # 1. Determine bar intervals and overall date range
        intervals = []
        if period == "day":
            bar_count = limit if limit and limit > 0 else 14
            # Shift window by offset * bar_count days
            window_end = ref + timedelta(days=offset * bar_count)
            window_start = window_end - timedelta(days=bar_count - 1)

            cur = window_start
            while cur <= window_end:
                ds = cur.isoformat()
                intervals.append(
                    {
                        "key": ds,
                        "label": f"{cur.day} {MONTH_NAMES_BR[cur.month - 1]}",
                        "sublabel": DAY_NAMES_BR[cur.weekday()],
                        "start_date": ds,
                        "end_date": ds,
                    }
                )
                cur += timedelta(days=1)

            range_label = (
                f"{window_start.day} {MONTH_NAMES_BR[window_start.month - 1]} — "
                f"{window_end.day} {MONTH_NAMES_BR[window_end.month - 1]} {window_end.year}"
            )
            min_date = window_start.isoformat()
            max_date = window_end.isoformat()

        elif period == "week":
            bar_count = limit if limit and limit > 0 else 12
            # Week starts on Monday
            current_monday = ref - timedelta(days=ref.weekday())
            window_end_monday = current_monday + timedelta(days=offset * bar_count * 7)
            window_start_monday = window_end_monday - timedelta(
                days=(bar_count - 1) * 7
            )

            cur_monday = window_start_monday
            while cur_monday <= window_end_monday:
                cur_sunday = cur_monday + timedelta(days=6)
                s_ds = cur_monday.isoformat()
                e_ds = cur_sunday.isoformat()
                isocal = cur_monday.isocalendar()
                intervals.append(
                    {
                        "key": f"{s_ds}_{e_ds}",
                        "label": f"{cur_monday.day}/{cur_monday.month}–{cur_sunday.day}/{cur_sunday.month}",
                        "sublabel": f"Sem {isocal[1]}",
                        "start_date": s_ds,
                        "end_date": e_ds,
                    }
                )
                cur_monday += timedelta(days=7)

            window_end_sunday = window_end_monday + timedelta(days=6)
            range_label = (
                f"{window_start_monday.day} {MONTH_NAMES_BR[window_start_monday.month - 1]} — "
                f"{window_end_sunday.day} {MONTH_NAMES_BR[window_end_sunday.month - 1]} {window_end_sunday.year}"
            )
            min_date = window_start_monday.isoformat()
            max_date = window_end_sunday.isoformat()

        elif period == "month":
            bar_count = limit if limit and limit > 0 else 12
            # Total shift in months
            total_months = ref.year * 12 + (ref.month - 1) + offset * bar_count
            start_total_months = total_months - (bar_count - 1)

            for m_idx in range(start_total_months, total_months + 1):
                y = m_idx // 12
                m = (m_idx % 12) + 1
                _, last_day = calendar.monthrange(y, m)
                s_date = date(y, m, 1)
                e_date = date(y, m, last_day)
                intervals.append(
                    {
                        "key": f"{y}-{m:02d}",
                        "label": f"{MONTH_NAMES_BR[m - 1]}/{str(y)[2:]}",
                        "sublabel": str(y),
                        "start_date": s_date.isoformat(),
                        "end_date": e_date.isoformat(),
                    }
                )

            s_first = intervals[0]["start_date"]
            e_last = intervals[-1]["end_date"]
            range_label = f"{intervals[0]['label']} — {intervals[-1]['label']}"
            min_date = s_first
            max_date = e_last

        else:  # year
            bar_count = limit if limit and limit > 0 else 5
            end_year = ref.year + offset * bar_count
            start_year = end_year - (bar_count - 1)

            for y in range(start_year, end_year + 1):
                s_date = date(y, 1, 1)
                e_date = date(y, 12, 31)
                intervals.append(
                    {
                        "key": str(y),
                        "label": str(y),
                        "sublabel": "",
                        "start_date": s_date.isoformat(),
                        "end_date": e_date.isoformat(),
                    }
                )

            range_label = f"{start_year} — {end_year}"
            min_date = f"{start_year}-01-01"
            max_date = f"{end_year}-12-31"

        # 2. Fetch subject metadata
        all_subjects = Subject.query.order_by(
            Subject.is_archived.asc(), Subject.name.asc()
        ).all()
        meta_dict = {
            s.id: {
                "id": s.id,
                "name": s.name,
                "color": s.color,
                "is_archived": s.is_archived,
            }
            for s in all_subjects
        }
        # Fallback for "Sem matéria"
        meta_dict[None] = {
            "id": None,
            "name": "Sem matéria",
            "color": "#64748b",
            "is_archived": False,
        }

        # 3. Query all DailySubjectActivity in the range
        dsa_list = (
            DailySubjectActivity.query.filter(
                DailySubjectActivity.date >= min_date,
                DailySubjectActivity.date <= max_date,
            )
            .order_by(DailySubjectActivity.date.asc())
            .all()
        )

        # Also fallback to DailyActivity.subject_breakdown if relational rows were missing
        daily_records = (
            DailyActivity.query.filter(
                DailyActivity.date >= min_date,
                DailyActivity.date <= max_date,
            )
            .order_by(DailyActivity.date.asc())
            .all()
        )

        # Merge activity per (date, subject_id)
        activity_matrix = {}
        for d in dsa_list:
            key = (d.date, d.subject_id)
            activity_matrix[key] = {
                "seconds": d.study_seconds,
                "pomodoros": d.pomodoros,
                "name": d.subject_name
                or meta_dict.get(d.subject_id, {}).get("name", "Sem matéria"),
            }

        for r in daily_records:
            sb = r.get_subject_breakdown()
            for skey, sval in sb.items():
                sid = None if skey == "none" else int(skey)
                key = (r.date, sid)
                sec = sval.get("study_seconds", 0)
                pom = sval.get("pomodoros", 0)
                if key not in activity_matrix:
                    activity_matrix[key] = {
                        "seconds": sec,
                        "pomodoros": pom,
                        "name": sval.get(
                            "name",
                            meta_dict.get(sid, {}).get("name", "Sem matéria"),
                        ),
                    }
                else:
                    activity_matrix[key]["seconds"] = max(
                        activity_matrix[key]["seconds"], sec
                    )
                    activity_matrix[key]["pomodoros"] = max(
                        activity_matrix[key]["pomodoros"], pom
                    )

        # Reconcile any unassigned study_seconds or pomodoros on DailyActivity into "Sem matéria"
        for r in daily_records:
            assigned_sec = sum(
                info["seconds"]
                for (d_str, _), info in activity_matrix.items()
                if d_str == r.date
            )
            assigned_pom = sum(
                info["pomodoros"]
                for (d_str, _), info in activity_matrix.items()
                if d_str == r.date
            )
            diff_sec = max(0, (r.study_seconds or 0) - assigned_sec)
            diff_pom = max(0, (r.pomodoros_completed or 0) - assigned_pom)

            if diff_sec > 0 or diff_pom > 0:
                none_key = (r.date, None)
                if none_key not in activity_matrix:
                    activity_matrix[none_key] = {
                        "seconds": diff_sec,
                        "pomodoros": diff_pom,
                        "name": "Sem matéria",
                    }
                else:
                    activity_matrix[none_key]["seconds"] += diff_sec
                    activity_matrix[none_key]["pomodoros"] += diff_pom

        # 4. Map into bars
        bars = []
        overall_seconds = 0
        overall_pomodoros = 0
        active_subject_ids = set()

        for interval in intervals:
            s_date = interval["start_date"]
            e_date = interval["end_date"]

            bar_subject_map = {}
            bar_total_seconds = 0
            bar_total_pomodoros = 0

            for (d_str, sid), act_info in activity_matrix.items():
                if s_date <= d_str <= e_date:
                    sec = act_info["seconds"]
                    pom = act_info["pomodoros"]
                    if sec > 0 or pom > 0:
                        active_subject_ids.add(sid)
                        if sid not in bar_subject_map:
                            sub_info = meta_dict.get(
                                sid,
                                {
                                    "id": sid,
                                    "name": act_info["name"],
                                    "color": "#3b82f6",
                                },
                            )
                            bar_subject_map[sid] = {
                                "subject_id": sid,
                                "name": sub_info["name"],
                                "color": sub_info["color"],
                                "seconds": 0,
                                "pomodoros": 0,
                            }
                        bar_subject_map[sid]["seconds"] += sec
                        bar_subject_map[sid]["pomodoros"] += pom
                        bar_total_seconds += sec
                        bar_total_pomodoros += pom

            overall_seconds += bar_total_seconds
            overall_pomodoros += bar_total_pomodoros

            breakdown_list = list(bar_subject_map.values())
            breakdown_list.sort(key=lambda x: x["seconds"], reverse=True)

            bars.append(
                {
                    "key": interval["key"],
                    "label": interval["label"],
                    "sublabel": interval["sublabel"],
                    "start_date": s_date,
                    "end_date": e_date,
                    "total_seconds": bar_total_seconds,
                    "total_pomodoros": bar_total_pomodoros,
                    "breakdown": breakdown_list,
                }
            )

        # 5. Build active subjects list for the interactive legend
        subjects_payload = []
        for s in all_subjects:
            sid = s.id
            is_active = (
                sid in active_subject_ids or not s.is_archived
            )  # show active or present
            if is_active:
                tot_sec = sum(
                    b_item["seconds"]
                    for bar in bars
                    for b_item in bar["breakdown"]
                    if b_item["subject_id"] == sid
                )
                tot_pom = sum(
                    b_item["pomodoros"]
                    for bar in bars
                    for b_item in bar["breakdown"]
                    if b_item["subject_id"] == sid
                )
                subjects_payload.append(
                    {
                        "id": sid,
                        "name": s.name,
                        "color": s.color,
                        "is_archived": s.is_archived,
                        "study_seconds": tot_sec,
                        "pomodoros": tot_pom,
                    }
                )

        has_unassigned = any(sid is None for (_, sid) in activity_matrix.keys())
        if None in active_subject_ids or has_unassigned:
            tot_sec = sum(
                b_item["seconds"]
                for bar in bars
                for b_item in bar["breakdown"]
                if b_item["subject_id"] is None
            )
            tot_pom = sum(
                b_item["pomodoros"]
                for bar in bars
                for b_item in bar["breakdown"]
                if b_item["subject_id"] is None
            )
            subjects_payload.append(
                {
                    "id": None,
                    "name": "Sem matéria",
                    "color": "#64748b",
                    "is_archived": False,
                    "study_seconds": tot_sec,
                    "pomodoros": tot_pom,
                }
            )

        return {
            "period": period,
            "offset": offset,
            "range_label": range_label,
            "start_date": min_date,
            "end_date": max_date,
            "total_study_seconds": overall_seconds,
            "total_pomodoros": overall_pomodoros,
            "subjects": subjects_payload,
            "bars": bars,
        }
