from database import db
from models import Course, Lesson
from services import CourseService, LessonService


class TestCourseService:
    def test_list_all_and_reorder(self, app):
        with app.app_context():
            c1 = Course(name="Curso B", path="/path/b", position=1)
            c2 = Course(name="Curso A", path="/path/a", position=0)
            db.session.add_all([c1, c2])
            db.session.commit()

            courses = CourseService.list_all()
            assert len(courses) == 2
            assert courses[0]["name"] == "Curso A"
            assert courses[1]["name"] == "Curso B"

            # Reordenar
            CourseService.reorder(
                [{"id": c1.id, "position": 0}, {"id": c2.id, "position": 1}]
            )
            reordered = CourseService.list_all()
            assert reordered[0]["name"] == "Curso B"
            assert reordered[1]["name"] == "Curso A"

    def test_get_by_id_and_delete(self, app):
        with app.app_context():
            course = Course(name="Curso Deletavel", path="/path/del", position=0)
            db.session.add(course)
            db.session.commit()

            lesson = Lesson(
                course_id=course.id,
                title="Aula 1",
                hierarchy_path="/path/del/aula1.mp4",
                video_url="/path/del/aula1.mp4",
            )
            db.session.add(lesson)
            db.session.commit()

            fetched = CourseService.get_by_id(course.id)
            assert fetched.id == course.id

            CourseService.delete(course.id)
            assert db.session.get(Course, course.id) is None
            assert Lesson.query.filter_by(course_id=course.id).first() is None

    def test_completion_percentage(self, app):
        with app.app_context():
            course = Course(name="Curso Stats", path="/path/stats", position=0)
            db.session.add(course)
            db.session.commit()

            stats_empty = CourseService.get_completion_percentage(course.id)
            assert stats_empty["completed_percentage"] == 0
            assert stats_empty["total_lessons"] == 0

            l1 = Lesson(
                course_id=course.id,
                title="Aula 1",
                hierarchy_path="/aula1.mp4",
                video_url="/aula1.mp4",
                is_completed=1,
            )
            l2 = Lesson(
                course_id=course.id,
                title="Aula 2",
                hierarchy_path="/aula2.mp4",
                video_url="/aula2.mp4",
                is_completed=0,
            )
            db.session.add_all([l1, l2])
            db.session.commit()

            stats = CourseService.get_completion_percentage(course.id)
            assert stats["completed_percentage"] == 50
            assert stats["total_lessons"] == 2
            assert stats["completed_lessons"] == 1


class TestLessonService:
    def test_update_progress_and_get_elapsed_time(self, app):
        with app.app_context():
            course = Course(name="Curso L", path="/path/l", position=0)
            db.session.add(course)
            db.session.commit()

            lesson = Lesson(
                course_id=course.id,
                title="Aula Teste",
                hierarchy_path="/aula.mp4",
                video_url="/aula.mp4",
                time_elapsed="0",
                is_completed=0,
            )
            db.session.add(lesson)
            db.session.commit()

            updated = LessonService.update_progress(
                lesson.id,
                progress_status="completed",
                is_completed=True,
                time_elapsed=125,
            )
            assert updated is not None
            assert updated.is_completed == 1
            assert updated.progress_status == "completed"

            elapsed = LessonService.get_elapsed_time(lesson.id)
            assert elapsed == "125"

    def test_list_by_course_filters_and_groups(self, app):
        with app.app_context():
            course = Course(name="Curso Modulos", path="/path/m", position=0)
            db.session.add(course)
            db.session.commit()

            l1 = Lesson(
                course_id=course.id,
                title="Aula 2",
                module="Modulo 1",
                hierarchy_path="/m1/a2.mp4",
                video_url="/m1/a2.mp4",
            )
            l2 = Lesson(
                course_id=course.id,
                title="Aula 1",
                module="Modulo 1",
                hierarchy_path="/m1/a1.mp4",
                video_url="/m1/a1.mp4",
            )
            # Arquivo não suportado como vídeo
            l_invalid = Lesson(
                course_id=course.id,
                title="Texto",
                module="Modulo 1",
                hierarchy_path="/m1/doc.txt",
                video_url="/m1/doc.txt",
            )
            db.session.add_all([l1, l2, l_invalid])
            db.session.commit()

            result = LessonService.list_by_course(course.id)
            assert "Modulo 1" in result
            lessons = result["Modulo 1"]
            assert len(lessons) == 2
            assert lessons[0]["title"] == "Aula 1"
            assert lessons[1]["title"] == "Aula 2"

    def test_notes_crud_and_export(self, app):
        with app.app_context():
            course = Course(name="Curso Notes", path="/path/n", position=0)
            db.session.add(course)
            db.session.commit()

            lesson = Lesson(
                course_id=course.id,
                title="Aula com Notas",
                module="Modulo A",
                hierarchy_path="/n/aula.mp4",
                video_url="/n/aula.mp4",
            )
            db.session.add(lesson)
            db.session.commit()

            # Criar nota
            note = LessonService.create_note(lesson.id, time=42, content="Ponto chave")
            assert note.id is not None
            assert note.content == "Ponto chave"

            # Listar
            notes = LessonService.list_notes_by_course(course.id)
            assert len(notes) == 1
            assert notes[0]["content"] == "Ponto chave"

            # Atualizar
            updated = LessonService.update_note(note.id, content="Ponto atualizado")
            assert updated.content == "Ponto atualizado"

            # Exportar em Markdown
            mem_md, filename_md, mime_md = LessonService.export_notes(course.id, "md")
            assert filename_md.endswith(".md")
            assert mime_md.startswith("text/markdown")
            content_md = mem_md.getvalue().decode("utf-8")
            assert "Ponto atualizado" in content_md

            # Exportar em TXT
            mem_txt, filename_txt, mime_txt = LessonService.export_notes(
                course.id, "txt"
            )
            assert filename_txt.endswith(".txt")
            assert mime_txt == "text/plain"

            # Excluir nota
            LessonService.delete_note(note.id)
            assert len(LessonService.list_notes_by_course(course.id)) == 0
