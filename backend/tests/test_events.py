from database import db
from models.course import Course
from services.event_service import EventService


class TestEventService:
    def test_create_and_list_events(self, app):
        with app.app_context():
            course = Course(name="Python Avançado", path="/caminho/python")
            db.session.add(course)
            db.session.commit()

            from models.subject import Subject

            sub = Subject(name="Cálculo Diferencial", color="#10b981")
            db.session.add(sub)
            db.session.commit()

            ev1 = EventService.create_event(
                {
                    "title": "Prova 1",
                    "date": "2026-11-15",
                    "time": "14:00",
                    "category": "prova",
                    "notes": "Capítulos 1 a 4",
                    "subject_id": sub.id,
                    "course_id": course.id,
                }
            )
            assert ev1.id is not None
            assert ev1.title == "Prova 1"
            assert ev1.date == "2026-11-15"
            assert ev1.subject_id == sub.id
            assert ev1.to_dict()["subject_name"] == "Cálculo Diferencial"
            assert ev1.to_dict()["subject_color"] == "#10b981"
            assert ev1.course_id == course.id

            ev2 = EventService.create_event(
                {
                    "title": "Entrega do Trabalho",
                    "date": "2026-11-20",
                    "category": "entrega",
                }
            )
            assert ev2.course_id is None
            assert ev2.subject_id is None

            # Test list by month
            nov_events = EventService.list_events(month="2026-11")
            assert len(nov_events) >= 2

            # Test list by subject
            sub_events = EventService.list_events(subject_id=sub.id)
            assert len(sub_events) == 1
            assert sub_events[0].title == "Prova 1"

            # Test list by course
            course_events = EventService.list_events(course_id=course.id)
            assert len(course_events) == 1
            assert course_events[0].title == "Prova 1"

    def test_toggle_done_and_update(self, app):
        with app.app_context():
            ev = EventService.create_event(
                {
                    "title": "Revisão Geral",
                    "date": "2026-12-01",
                    "category": "revisao",
                }
            )
            assert ev.done is False

            toggled = EventService.toggle_done(ev.id)
            assert toggled.done is True

            updated = EventService.update_event(
                ev.id,
                {
                    "title": "Revisão Geral - Atualizada",
                    "time": "10:30",
                },
            )
            assert updated.title == "Revisão Geral - Atualizada"
            assert updated.time == "10:30"

            # Delete
            deleted = EventService.delete_event(ev.id)
            assert deleted is True
            assert EventService.get_by_id(ev.id) is None

    def test_generate_ics(self, app):
        with app.app_context():
            ev = EventService.create_event(
                {
                    "title": "Seminário de IA",
                    "date": "2026-11-25",
                    "time": "09:00",
                    "category": "entrega",
                    "notes": "Apresentação em slides",
                }
            )

            ics = EventService.generate_ics([ev])
            assert "BEGIN:VCALENDAR" in ics
            assert "END:VCALENDAR" in ics
            assert "SUMMARY:Seminário de IA" in ics
            assert "DTSTART:20261125T090000" in ics
            assert "CATEGORIES:ENTREGA" in ics


class TestEventsAPI:
    def test_api_crud_flow(self, client, app):
        # Create
        res = client.post(
            "/api/events",
            json={
                "title": "Prova de Cálculo",
                "date": "2026-11-10",
                "time": "08:00",
                "category": "prova",
            },
        )
        assert res.status_code == 201
        data = res.get_json()
        ev_id = data["id"]
        assert data["title"] == "Prova de Cálculo"

        # List
        res_list = client.get("/api/events?month=2026-11")
        assert res_list.status_code == 200
        items = res_list.get_json()
        assert any(i["id"] == ev_id for i in items)

        # Toggle done
        res_toggle = client.patch(f"/api/events/{ev_id}/toggle-done")
        assert res_toggle.status_code == 200
        assert res_toggle.get_json()["done"] is True

        # Export ICS
        res_ics = client.get("/api/events/export.ics?month=2026-11")
        assert res_ics.status_code == 200
        assert "text/calendar" in res_ics.headers.get("Content-Type", "")
        assert b"BEGIN:VCALENDAR" in res_ics.data

        # Delete
        res_del = client.delete(f"/api/events/{ev_id}")
        assert res_del.status_code == 200
