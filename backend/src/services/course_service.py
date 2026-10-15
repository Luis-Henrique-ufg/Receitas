import logging
import os

from werkzeug.utils import secure_filename

from database import db
from models import Course, Lesson
from utils import list_and_register_lessons, scan_data_directory_and_register_courses

logger = logging.getLogger(__name__)


class CourseService:
    @staticmethod
    def list_all():
        courses = Course.query.order_by(Course.position.asc()).all()
        return [course.to_dict() for course in courses]

    @staticmethod
    def reorder(items):
        for item in items:
            course = Course.query.get(item.get("id"))
            if course and "position" in item:
                course.position = item["position"]
        db.session.commit()

    @staticmethod
    def get_by_id(course_id):
        return Course.query.get_or_404(course_id)

    @staticmethod
    def create(name, path, image_url=None, image_file=None, upload_folder=None):
        is_cover_url = 1 if image_url else 0
        file_cover = None

        if not is_cover_url and image_file and upload_folder:
            filename = secure_filename(image_file.filename)
            file_cover = filename
            os.makedirs(upload_folder, exist_ok=True)
            image_file.save(os.path.join(upload_folder, filename))

        course = Course(
            name=name,
            path=path,
            is_cover_url=is_cover_url,
            file_cover=file_cover,
            url_cover=image_url if is_cover_url else None,
        )
        logger.info("Saving course with file cover: %s", course.file_cover)
        db.session.add(course)
        db.session.commit()

        list_and_register_lessons(path, course.id)
        return course

    @staticmethod
    def update(
        course_id, name, path, image_url=None, image_file=None, upload_folder=None
    ):
        course = Course.query.get_or_404(course_id)
        old_path = course.path
        course.name = name
        course.path = path
        is_cover_url = 1 if image_url else 0

        if is_cover_url:
            course.url_cover = image_url
            course.is_cover_url = 1
            course.file_cover = None
        else:
            if image_file and upload_folder:
                filename = secure_filename(image_file.filename)
                course.file_cover = filename
                course.is_cover_url = 0
                course.url_cover = None
                os.makedirs(upload_folder, exist_ok=True)
                image_file.save(os.path.join(upload_folder, filename))

        logger.info("Updating course with file cover: %s", course.file_cover)
        db.session.commit()

        if old_path != course.path:
            list_and_register_lessons(course.path, course_id)

        return course

    @staticmethod
    def delete(course_id, upload_folder=None):
        course = Course.query.get_or_404(course_id)
        logger.info("Deleting course id=%s, name=%s", course_id, course.name)

        Lesson.query.filter_by(course_id=course_id).delete()

        if course.file_cover and upload_folder:
            file_path = os.path.join(upload_folder, course.file_cover)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                logger.warning("Erro ao remover capa %s: %s", course.file_cover, e)

        db.session.delete(course)
        db.session.commit()

    @staticmethod
    def rescan(course_id):
        course = Course.query.get_or_404(course_id)
        list_and_register_lessons(course.path, course_id)
        return course

    @staticmethod
    def auto_scan_all():
        scan_data_directory_and_register_courses()

    @staticmethod
    def get_completion_percentage(course_id):
        Course.query.get_or_404(course_id)
        lessons = Lesson.query.filter_by(course_id=course_id).all()
        valid_lessons = [
            lesson
            for lesson in lessons
            if not (lesson.video_url or lesson.pdf_url or "")
            .lower()
            .endswith((".html", ".htm", ".txt"))
        ]
        total_lessons = len(valid_lessons)

        if total_lessons == 0:
            return {
                "completed_percentage": 0,
                "completion_percentage": 0,
                "total_lessons": 0,
                "completed_lessons": 0,
            }

        completed_lessons = len(
            [lesson for lesson in valid_lessons if lesson.is_completed]
        )
        completion_percentage = (completed_lessons / total_lessons) * 100

        return {
            "completed_percentage": completion_percentage,
            "completion_percentage": completion_percentage,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
        }
