from datetime import datetime
import json
import logging
import urllib.error
import urllib.request

from database import db
from models.course import Course
from models.daily_activity import (
    DailyActivity,
    DailyCourseActivity,
    DailySubjectActivity,
)
from models.lesson import Lesson
from models.note import Note
from models.study_event import StudyEvent
from models.subject import Subject

logger = logging.getLogger(__name__)


class SyncService:
    @staticmethod
    def export_data() -> dict:
        """
        Exports all study metrics, progress, notes, calendar events,
        and subjects into a structured, portable JSON dictionary.
        Uses course and lesson titles/hierarchy so IDs don't conflict
        between different machines.
        """
        subjects = [s.to_dict() for s in Subject.query.all()]
        daily_activities = [a.to_dict() for a in DailyActivity.query.all()]
        daily_course_activities = [
            a.to_dict() for a in DailyCourseActivity.query.all()
        ]
        daily_subject_activities = [
            a.to_dict() for a in DailySubjectActivity.query.all()
        ]
        study_events = [e.to_dict() for e in StudyEvent.query.all()]

        # Only export lessons that have progress or are completed
        lessons_progress = []
        active_lessons = Lesson.query.filter(
            (Lesson.is_completed == 1) | (Lesson.time_elapsed.isnot(None))
        ).all()
        for l in active_lessons:
            try:
                elapsed = float(l.time_elapsed) if l.time_elapsed else 0.0
            except (ValueError, TypeError):
                elapsed = 0.0

            if l.is_completed or elapsed > 0:
                lessons_progress.append(
                    {
                        "course_name": l.course.name if l.course else None,
                        "lesson_title": l.title,
                        "module": l.module,
                        "hierarchy_path": l.hierarchy_path,
                        "is_completed": bool(l.is_completed),
                        "time_elapsed": elapsed,
                        "progress_status": l.progress_status,
                    }
                )

        notes = []
        for n in Note.query.all():
            notes.append(
                {
                    "course_name": (
                        n.lesson.course.name
                        if n.lesson and n.lesson.course
                        else None
                    ),
                    "lesson_title": n.lesson.title if n.lesson else None,
                    "module": n.lesson.module if n.lesson else None,
                    "hierarchy_path": n.lesson.hierarchy_path if n.lesson else None,
                    "time": n.time,
                    "content": n.content,
                }
            )

        return {
            "version": 1,
            "app": "receitas",
            "exported_at": datetime.utcnow().isoformat(),
            "data": {
                "subjects": subjects,
                "daily_activities": daily_activities,
                "daily_course_activities": daily_course_activities,
                "daily_subject_activities": daily_subject_activities,
                "study_events": study_events,
                "lessons_progress": lessons_progress,
                "notes": notes,
            },
        }

    @staticmethod
    def import_data(payload: dict) -> dict:
        """
        Safely merges study metrics, progress, and calendar events
        into the local database without overwriting or deleting data.
        """
        if not isinstance(payload, dict):
            raise ValueError("Payload inválido. Esperado objeto JSON.")

        # Accept either root object or payload under 'data'
        data = payload.get("data", payload)

        stats = {
            "subjects_synced": 0,
            "days_synced": 0,
            "course_activities_synced": 0,
            "subject_activities_synced": 0,
            "lessons_updated": 0,
            "notes_added": 0,
            "events_synced": 0,
        }

        # 1. Merge Subjects
        incoming_subjects = data.get("subjects") or []
        local_subjects = {s.name.strip().lower(): s for s in Subject.query.all()}
        subject_name_to_id = {s.name.strip().lower(): s.id for s in Subject.query.all()}

        for sub_data in incoming_subjects:
            name = (sub_data.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()
            if key in local_subjects:
                existing = local_subjects[key]
                if not existing.color and sub_data.get("color"):
                    existing.color = sub_data["color"]
                if not existing.code and sub_data.get("code"):
                    existing.code = sub_data["code"]
                if not existing.semester and sub_data.get("semester"):
                    existing.semester = sub_data["semester"]
                subject_name_to_id[key] = existing.id
            else:
                new_sub = Subject(
                    name=name,
                    color=sub_data.get("color", "#3b82f6"),
                    code=sub_data.get("code"),
                    semester=sub_data.get("semester"),
                    is_archived=bool(sub_data.get("is_archived", False)),
                )
                db.session.add(new_sub)
                db.session.flush()
                local_subjects[key] = new_sub
                subject_name_to_id[key] = new_sub.id
                stats["subjects_synced"] += 1

        # Pre-cache courses for fast lookup
        courses_by_name = {
            c.name.strip().lower(): c for c in Course.query.all()
        }

        # 2. Merge DailyCourseActivity
        incoming_course_acts = data.get("daily_course_activities") or []
        for dca in incoming_course_acts:
            date_str = dca.get("date")
            course_name = (dca.get("course_name") or "").strip()
            if not date_str:
                continue

            matched_course = courses_by_name.get(course_name.lower()) if course_name else None
            effective_course_id = matched_course.id if matched_course else dca.get("course_id", 0)

            existing = DailyCourseActivity.query.filter_by(
                date=date_str, course_id=effective_course_id
            ).first()

            in_seconds = int(dca.get("study_seconds", 0))
            in_poms = int(dca.get("pomodoros", 0))
            in_lessons = int(dca.get("lessons", 0))

            if existing:
                existing.study_seconds = max(existing.study_seconds, in_seconds)
                existing.pomodoros = max(existing.pomodoros, in_poms)
                existing.lessons = max(existing.lessons, in_lessons)
                if not existing.course_name and course_name:
                    existing.course_name = course_name
            else:
                new_dca = DailyCourseActivity(
                    date=date_str,
                    course_id=effective_course_id,
                    course_name=course_name or (matched_course.name if matched_course else None),
                    study_seconds=in_seconds,
                    pomodoros=in_poms,
                    lessons=in_lessons,
                )
                db.session.add(new_dca)
                stats["course_activities_synced"] += 1

        # 3. Merge DailySubjectActivity
        incoming_subj_acts = data.get("daily_subject_activities") or []
        for dsa in incoming_subj_acts:
            date_str = dsa.get("date")
            subj_name = (dsa.get("subject_name") or "").strip()
            if not date_str:
                continue

            subj_key = subj_name.lower() if subj_name else None
            effective_subj_id = (
                subject_name_to_id.get(subj_key)
                if subj_key
                else dsa.get("subject_id")
            )

            existing = DailySubjectActivity.query.filter_by(
                date=date_str, subject_id=effective_subj_id
            ).first()

            in_seconds = int(dsa.get("study_seconds", 0))
            in_poms = int(dsa.get("pomodoros", 0))

            if existing:
                existing.study_seconds = max(existing.study_seconds, in_seconds)
                existing.pomodoros = max(existing.pomodoros, in_poms)
                if not existing.subject_name and subj_name:
                    existing.subject_name = subj_name
            else:
                new_dsa = DailySubjectActivity(
                    date=date_str,
                    subject_id=effective_subj_id,
                    subject_name=subj_name,
                    study_seconds=in_seconds,
                    pomodoros=in_poms,
                )
                db.session.add(new_dsa)
                stats["subject_activities_synced"] += 1

        # 4. Merge DailyActivity
        incoming_daily = data.get("daily_activities") or []
        for da in incoming_daily:
            date_str = da.get("date")
            if not date_str:
                continue

            existing = DailyActivity.query.filter_by(date=date_str).first()
            in_seconds = int(da.get("study_seconds", 0))
            in_poms = int(da.get("pomodoros_completed", 0))
            in_lessons = int(da.get("lessons_completed", 0))

            in_course_bk = da.get("course_breakdown") or {}
            in_subj_bk = da.get("subject_breakdown") or {}
            if isinstance(in_course_bk, str):
                try:
                    in_course_bk = json.loads(in_course_bk)
                except Exception:
                    in_course_bk = {}
            if isinstance(in_subj_bk, str):
                try:
                    in_subj_bk = json.loads(in_subj_bk)
                except Exception:
                    in_subj_bk = {}

            if existing:
                existing.study_seconds = max(existing.study_seconds, in_seconds)
                existing.pomodoros_completed = max(
                    existing.pomodoros_completed, in_poms
                )
                existing.lessons_completed = max(
                    existing.lessons_completed, in_lessons
                )

                # Merge breakdowns by taking max value for each key
                curr_c_bk = existing.get_course_breakdown()
                for k, v in in_course_bk.items():
                    curr_c_bk[str(k)] = max(int(curr_c_bk.get(str(k), 0)), int(v))
                existing.set_course_breakdown(curr_c_bk)

                curr_s_bk = existing.get_subject_breakdown()
                for k, v in in_subj_bk.items():
                    curr_s_bk[str(k)] = max(int(curr_s_bk.get(str(k), 0)), int(v))
                existing.set_subject_breakdown(curr_s_bk)
            else:
                new_da = DailyActivity(
                    date=date_str,
                    study_seconds=in_seconds,
                    pomodoros_completed=in_poms,
                    lessons_completed=in_lessons,
                )
                new_da.set_course_breakdown(in_course_bk)
                new_da.set_subject_breakdown(in_subj_bk)
                db.session.add(new_da)
                stats["days_synced"] += 1

        # 5. Merge Lesson Progress
        incoming_progress = data.get("lessons_progress") or []
        for lp in incoming_progress:
            c_name = (lp.get("course_name") or "").strip()
            l_title = (lp.get("lesson_title") or "").strip()
            h_path = (lp.get("hierarchy_path") or "").strip()

            course = courses_by_name.get(c_name.lower()) if c_name else None
            if not course:
                continue

            query = Lesson.query.filter_by(course_id=course.id)
            matched_lesson = None
            if h_path:
                matched_lesson = query.filter_by(hierarchy_path=h_path).first()
            if not matched_lesson and l_title:
                matched_lesson = query.filter_by(title=l_title).first()

            if matched_lesson:
                changed = False
                if lp.get("is_completed") and not matched_lesson.is_completed:
                    matched_lesson.is_completed = 1
                    changed = True

                in_elapsed = float(lp.get("time_elapsed") or 0.0)
                try:
                    curr_elapsed = float(matched_lesson.time_elapsed or 0.0)
                except (ValueError, TypeError):
                    curr_elapsed = 0.0

                if in_elapsed > curr_elapsed:
                    matched_lesson.time_elapsed = in_elapsed
                    changed = True

                if lp.get("progress_status") and not matched_lesson.progress_status:
                    matched_lesson.progress_status = lp["progress_status"]
                    changed = True

                if changed:
                    stats["lessons_updated"] += 1

        # 6. Merge Notes
        incoming_notes = data.get("notes") or []
        for n_data in incoming_notes:
            c_name = (n_data.get("course_name") or "").strip()
            l_title = (n_data.get("lesson_title") or "").strip()
            h_path = (n_data.get("hierarchy_path") or "").strip()
            content = (n_data.get("content") or "").strip()
            time_val = int(n_data.get("time") or 0)

            if not content:
                continue

            course = courses_by_name.get(c_name.lower()) if c_name else None
            if not course:
                continue

            matched_lesson = None
            query = Lesson.query.filter_by(course_id=course.id)
            if h_path:
                matched_lesson = query.filter_by(hierarchy_path=h_path).first()
            if not matched_lesson and l_title:
                matched_lesson = query.filter_by(title=l_title).first()

            if matched_lesson:
                # Check for existing note at ~same time with identical content
                existing_note = Note.query.filter(
                    Note.lesson_id == matched_lesson.id,
                    Note.content == content,
                    Note.time >= time_val - 2,
                    Note.time <= time_val + 2,
                ).first()

                if not existing_note:
                    new_note = Note(
                        lesson_id=matched_lesson.id,
                        time=time_val,
                        content=content,
                    )
                    db.session.add(new_note)
                    stats["notes_added"] += 1

        # 7. Merge Study Events
        incoming_events = data.get("study_events") or []
        for ev in incoming_events:
            title = (ev.get("title") or "").strip()
            date_str = ev.get("date")
            if not title or not date_str:
                continue

            existing_ev = StudyEvent.query.filter_by(
                title=title, date=date_str
            ).first()

            c_name = (ev.get("course_name") or "").strip()
            matched_course = courses_by_name.get(c_name.lower()) if c_name else None
            course_id = matched_course.id if matched_course else None

            if existing_ev:
                # If marked done in either device, mark done
                if ev.get("done") and not existing_ev.done:
                    existing_ev.done = True
                if not existing_ev.time and ev.get("time"):
                    existing_ev.time = ev["time"]
                if not existing_ev.notes and ev.get("notes"):
                    existing_ev.notes = ev["notes"]
            else:
                new_ev = StudyEvent(
                    title=title,
                    date=date_str,
                    time=ev.get("time"),
                    category=ev.get("category", "lembrete"),
                    color=ev.get("color"),
                    notes=ev.get("notes"),
                    done=bool(ev.get("done", False)),
                    course_id=course_id,
                )
                db.session.add(new_ev)
                stats["events_synced"] += 1

        db.session.commit()
        return {
            "success": True,
            "message": "Dados sincronizados com sucesso!",
            "summary": stats,
        }

    @staticmethod
    def peer_sync(remote_url: str) -> dict:
        """
        Connects to another device running this software over the local network (Wi-Fi),
        pulls remote data, merges locally, and sends merged data back to the remote device
        so both machines stay in sync with one click.
        """
        remote_url = remote_url.strip().rstrip("/")
        if not remote_url.startswith("http://") and not remote_url.startswith("https://"):
            remote_url = f"http://{remote_url}"

        # 1. Fetch remote data
        export_endpoint = f"{remote_url}/api/sync/export"
        try:
            req = urllib.request.Request(
                export_endpoint,
                headers={"User-Agent": "Receitas-Sync-Client/1.0"},
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status != 200:
                    raise ValueError(
                        f"O servidor remoto respondeu com status {response.status}"
                    )
                remote_data = json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as e:
            raise ConnectionError(
                f"Não foi possível conectar ao notebook no endereço '{remote_url}'. "
                f"Verifique se o aplicativo está rodando no notebook e se ambos estão na mesma rede Wi-Fi. (Detalhe: {e.reason})"
            )
        except Exception as e:
            raise RuntimeError(f"Erro ao obter dados remotos: {str(e)}")

        # 2. Merge remote into local
        import_result = SyncService.import_data(remote_data)

        # 3. Export combined local data and push back to remote for 2-way sync
        push_endpoint = f"{remote_url}/api/sync/import"
        pushed_back = False
        try:
            merged_export = SyncService.export_data()
            post_data = json.dumps(merged_export).encode("utf-8")
            post_req = urllib.request.Request(
                push_endpoint,
                data=post_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Receitas-Sync-Client/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(post_req, timeout=12) as post_res:
                if post_res.status == 200:
                    pushed_back = True
        except Exception as e:
            logger.warning("Falha ao reenviar dados mesclados ao notebook: %s", e)

        return {
            "success": True,
            "two_way": pushed_back,
            "message": (
                "Sincronização bidirecional concluída com sucesso! Ambos os dispositivos agora possuem as mesmas métricas."
                if pushed_back
                else "Métricas do notebook recebidas e mescladas com sucesso!"
            ),
            "summary": import_result.get("summary", {}),
        }
