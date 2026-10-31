import io

from database import db
from models import Course, Lesson


class TestCoursesAPI:
    def test_create_course_with_file_upload(self, client):
        data = {
            "name": "Curso Upload Teste",
            "path": "/courses/upload-test",
            "imageFile": (io.BytesIO(b"fake image data"), "cover.jpg"),
        }
        res = client.post("/api/courses", data=data, content_type="multipart/form-data")
        assert res.status_code == 201
        res_data = res.get_json()
        assert res_data["name"] == "Curso Upload Teste"
        assert "id" in res_data

    def test_update_course_with_file_upload(self, client, app):
        with app.app_context():
            course = Course(name="Course Before Update", path="/p/before", position=0)
            db.session.add(course)
            db.session.commit()
            cid = course.id

        data = {
            "name": "Course After Update",
            "path": "/p/before",
            "imageFile": (io.BytesIO(b"updated cover bytes"), "nova_capa.png"),
        }
        res = client.put(
            f"/api/courses/{cid}", data=data, content_type="multipart/form-data"
        )
        assert res.status_code == 200
        res_data = res.get_json()
        assert res_data["name"] == "Course After Update"
        assert res_data["fileCover"] is not None
        assert "nova_capa.png" in res_data["fileCover"]
        assert res_data["isCoverUrl"] is False

    def test_list_and_get_courses(self, client, app):
        with app.app_context():
            course = Course(name="API Course", path="/api/c1", position=0)
            db.session.add(course)
            db.session.commit()
            course_id = course.id

        res = client.get("/api/courses")
        assert res.status_code == 200
        items = res.get_json()
        assert any(c["id"] == course_id for c in items)

        res_single = client.get(f"/api/courses/{course_id}")
        assert res_single.status_code == 200
        assert res_single.get_json()["name"] == "API Course"

    def test_reorder_courses(self, client, app):
        with app.app_context():
            c1 = Course(name="C1", path="/p1", position=0)
            c2 = Course(name="C2", path="/p2", position=1)
            db.session.add_all([c1, c2])
            db.session.commit()
            id1, id2 = c1.id, c2.id

        res = client.put(
            "/api/courses/reorder",
            json=[{"id": id1, "position": 1}, {"id": id2, "position": 0}],
        )
        assert res.status_code == 200

        res_list = client.get("/api/courses").get_json()
        assert res_list[0]["id"] == id2
        assert res_list[1]["id"] == id1

    def test_delete_course(self, client, app):
        with app.app_context():
            course = Course(name="To Delete", path="/p/del", position=0)
            db.session.add(course)
            db.session.commit()
            course_id = course.id

        res = client.delete(f"/api/courses/{course_id}")
        assert res.status_code == 200
        res_get = client.get(f"/api/courses/{course_id}")
        assert res_get.status_code == 404


class TestLessonsAPI:
    def test_update_lesson_progress(self, client, app):
        with app.app_context():
            course = Course(name="Course Lesson API", path="/p/l", position=0)
            db.session.add(course)
            db.session.commit()

            lesson = Lesson(
                course_id=course.id,
                title="Lesson 1",
                hierarchy_path="/p/l/1.mp4",
                video_url="/p/l/1.mp4",
            )
            db.session.add(lesson)
            db.session.commit()
            lesson_id = lesson.id

        res = client.post(
            "/api/update-lesson-progress",
            json={
                "lessonId": lesson_id,
                "isCompleted": True,
                "progressStatus": "completed",
                "time_elapsed": 50,
            },
        )
        assert res.status_code == 200

        res_time = client.get(f"/api/lessons/{lesson_id}")
        assert res_time.status_code == 200
        assert res_time.get_json()["elapsedTime"] == "50"

    def test_notes_api_endpoints(self, client, app):
        with app.app_context():
            course = Course(name="Course Notes API", path="/p/n", position=0)
            db.session.add(course)
            db.session.commit()

            lesson = Lesson(
                course_id=course.id,
                title="Lesson with Notes",
                hierarchy_path="/p/n/1.mp4",
                video_url="/p/n/1.mp4",
            )
            db.session.add(lesson)
            db.session.commit()
            course_id, lesson_id = course.id, lesson.id

        # Listar notas da lição antes de criar (deve vir vazia)
        res_initial = client.get(f"/api/lessons/{lesson_id}/notes")
        assert res_initial.status_code == 200
        assert res_initial.get_json() == []

        # Criar nota via API
        res_create = client.post(
            f"/api/lessons/{lesson_id}/notes",
            json={"time": 10, "content": "Nota de teste"},
        )
        assert res_create.status_code == 201
        note_id = res_create.get_json()["id"]

        # Listar notas da lição via API
        res_lesson_notes = client.get(f"/api/lessons/{lesson_id}/notes")
        assert res_lesson_notes.status_code == 200
        data_notes = res_lesson_notes.get_json()
        assert len(data_notes) == 1
        assert data_notes[0]["content"] == "Nota de teste"
        assert data_notes[0]["time"] == 10

        # Listar notas do curso via API
        res_list = client.get(f"/api/courses/{course_id}/notes")
        assert res_list.status_code == 200
        assert len(res_list.get_json()) == 1

        # Atualizar nota
        res_update = client.put(
            f"/api/notes/{note_id}",
            json={"content": "Nota atualizada", "time": 15},
        )
        assert res_update.status_code == 200
        assert res_update.get_json()["time"] == 15

        # Exportar notas
        res_export = client.get(f"/api/courses/{course_id}/notes/export?format=md")
        assert res_export.status_code == 200
        assert b"Nota atualizada" in res_export.data

        # Excluir nota
        res_del = client.delete(f"/api/notes/{note_id}")
        assert res_del.status_code == 200

        # Verificar se lista da lição voltou a ficar vazia
        res_after_del = client.get(f"/api/lessons/{lesson_id}/notes")
        assert res_after_del.status_code == 200
        assert res_after_del.get_json() == []
