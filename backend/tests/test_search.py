from database import db
from models import Course, Lesson, Note


class TestSearchAPI:
    def test_search_courses_lessons_and_notes(self, client, app):
        with app.app_context():
            course = Course(name="Curso de Python Avancado", path="/python")
            db.session.add(course)
            db.session.commit()

            lesson = Lesson(
                title="Decoradores e Geradores",
                module="Modulo Avancado",
                hierarchy_path="/python/m1/l1",
                course_id=course.id,
            )
            db.session.add(lesson)
            db.session.commit()

            note = Note(
                lesson_id=lesson.id,
                time=120,
                content="Lembrar de estudar functools.wraps",
            )
            db.session.add(note)
            db.session.commit()

        # Search for course
        res_course = client.get("/api/search?q=Python")
        assert res_course.status_code == 200
        data_course = res_course.get_json()
        assert len(data_course["courses"]) >= 1
        assert data_course["courses"][0]["name"] == "Curso de Python Avancado"

        # Search for lesson
        res_lesson = client.get("/api/search?q=Decoradores")
        assert res_lesson.status_code == 200
        data_lesson = res_lesson.get_json()
        assert len(data_lesson["lessons"]) >= 1
        assert data_lesson["lessons"][0]["title"] == "Decoradores e Geradores"

        # Search for note
        res_note = client.get("/api/search?q=functools")
        assert res_note.status_code == 200
        data_note = res_note.get_json()
        assert len(data_note["notes"]) >= 1
        assert "functools.wraps" in data_note["notes"][0]["content"]

        # Empty search
        res_empty = client.get("/api/search?q=")
        assert res_empty.status_code == 200
        assert res_empty.get_json() == {
            "courses": [],
            "lessons": [],
            "notes": [],
            "attachments": [],
        }
