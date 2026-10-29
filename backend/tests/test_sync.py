from models.course import Course
from models.daily_activity import DailyActivity, DailyCourseActivity
from models.lesson import Lesson
from models.note import Note
from models.study_event import StudyEvent
from models.subject import Subject
from services.sync_service import SyncService


class TestSyncService:
    def test_export_and_import_merge(self, app):
        with app.app_context():
            # Create sample data on "Machine A"
            course = Course(name="Calculo 1", path="/courses/calculo1")
            from database import db

            db.session.add(course)
            db.session.flush()

            lesson = Lesson(
                course_id=course.id,
                title="01 - Limites",
                module="Modulo 1",
                hierarchy_path="/courses/calculo1/01.mp4",
                is_completed=1,
                time_elapsed="300",
            )
            db.session.add(lesson)
            db.session.flush()

            note = Note(
                lesson_id=lesson.id, time=120, content="Definicao de epsilon-delta"
            )
            db.session.add(note)

            subject = Subject(name="Matematica", color="#3b82f6")
            db.session.add(subject)
            db.session.flush()

            activity = DailyActivity(
                date="2026-10-25",
                study_seconds=3600,
                pomodoros_completed=2,
                lessons_completed=1,
            )
            # Set realistic dictionary breakdowns
            activity.set_course_breakdown(
                {
                    str(course.id): {
                        "name": course.name,
                        "study_seconds": 3600,
                        "pomodoros": 2,
                    }
                }
            )
            activity.set_subject_breakdown(
                {
                    str(subject.id): {
                        "id": subject.id,
                        "name": subject.name,
                        "study_seconds": 3600,
                        "pomodoros": 2,
                    }
                }
            )
            db.session.add(activity)

            course_act = DailyCourseActivity(
                date="2026-10-25",
                course_id=course.id,
                course_name=course.name,
                study_seconds=3600,
                pomodoros=2,
                lessons=1,
            )
            db.session.add(course_act)

            event = StudyEvent(
                title="Prova P1",
                date="2026-11-10",
                time="14:00",
                category="prova",
                subject_id=subject.id,
                course_id=course.id,
            )
            db.session.add(event)
            db.session.commit()

            # Export from Machine A
            export_payload = SyncService.export_data()
            assert export_payload["app"] == "receitas"
            assert len(export_payload["data"]["subjects"]) == 1
            assert len(export_payload["data"]["daily_activities"]) == 1
            assert len(export_payload["data"]["lessons_progress"]) == 1
            assert len(export_payload["data"]["notes"]) == 1
            assert len(export_payload["data"]["study_events"]) == 1
            exported_event = export_payload["data"]["study_events"][0]
            assert exported_event["subject_name"] == "Matematica"

            # Simulate Machine B having different progress and notes on same date
            # Update local lesson progress to uncompleted
            lesson.is_completed = 0
            lesson.time_elapsed = "100"
            activity.study_seconds = 1800
            db.session.commit()

            # Now import Machine A's payload into Machine B
            result = SyncService.import_data(export_payload)
            assert result["success"] is True

            # Verify lesson is now completed and max time_elapsed is preserved
            reloaded_lesson = db.session.get(Lesson, lesson.id)
            assert reloaded_lesson is not None
            assert reloaded_lesson.is_completed == 1
            assert float(reloaded_lesson.time_elapsed) == 300.0

            # Verify daily activity study_seconds took the max (3600, not 1800)
            reloaded_act = DailyActivity.query.filter_by(date="2026-10-25").first()
            assert reloaded_act.study_seconds == 3600
            s_bk = reloaded_act.get_subject_breakdown()
            assert str(subject.id) in s_bk
            assert s_bk[str(subject.id)]["study_seconds"] == 3600

            # Verify note is present without duplicate
            all_notes = Note.query.filter_by(lesson_id=lesson.id).all()
            assert len(all_notes) == 1
            assert all_notes[0].content == "Definicao de epsilon-delta"

            # Re-running import must be idempotent (no duplicate notes or inflated stats)
            result_second = SyncService.import_data(export_payload)
            assert result_second["success"] is True
            all_notes_after = Note.query.filter_by(lesson_id=lesson.id).all()
            assert len(all_notes_after) == 1
            assert reloaded_act.study_seconds == 3600

    def test_sync_api_endpoints(self, client):
        # Test export endpoint
        res = client.get("/api/sync/export")
        assert res.status_code == 200
        data = res.get_json()
        assert "app" in data
        assert "data" in data

        # Test sync info endpoint
        res_info = client.get("/api/sync/info")
        assert res_info.status_code == 200
        assert "frontend_port" in res_info.get_json()

        # Test import endpoint
        res_import = client.post("/api/sync/import", json=data)
        assert res_import.status_code == 200
        res_json = res_import.get_json()
        assert res_json["success"] is True
        assert "summary" in res_json
