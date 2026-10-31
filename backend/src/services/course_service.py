import logging
import os
import time
from datetime import date, timedelta

from werkzeug.utils import secure_filename

from database import db
from models import Course, Lesson
from models.daily_activity import DailyActivity, DailyCourseActivity
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
        file_cover = None
        has_file = bool(image_file and getattr(image_file, "filename", None))

        if has_file and upload_folder:
            raw_filename = secure_filename(image_file.filename)
            ext = os.path.splitext(image_file.filename)[1].lower()
            if not raw_filename or raw_filename == ext.lstrip("."):
                raw_filename = f"cover{ext if ext else '.jpg'}"
            filename = f"{int(time.time())}_{raw_filename}"
            file_cover = filename
            os.makedirs(upload_folder, exist_ok=True)
            image_file.save(os.path.join(upload_folder, filename))
            is_cover_url = 0
            url_cover = None
        elif image_url and str(image_url).strip():
            is_cover_url = 1
            url_cover = str(image_url).strip()
            file_cover = None
        else:
            is_cover_url = 0
            url_cover = None
            file_cover = None

        course = Course(
            name=name,
            path=path,
            is_cover_url=is_cover_url,
            file_cover=file_cover,
            url_cover=url_cover,
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

        has_file = bool(image_file and getattr(image_file, "filename", None))

        if has_file and upload_folder:
            # Clean up old uploaded file if replacing
            if course.file_cover:
                old_file = os.path.join(upload_folder, course.file_cover)
                try:
                    if os.path.exists(old_file):
                        os.remove(old_file)
                except Exception as e:
                    logger.warning("Erro ao remover capa antiga: %s", e)

            raw_filename = secure_filename(image_file.filename)
            ext = os.path.splitext(image_file.filename)[1].lower()
            if not raw_filename or raw_filename == ext.lstrip("."):
                raw_filename = f"cover{ext if ext else '.jpg'}"
            filename = f"{int(time.time())}_{raw_filename}"
            course.file_cover = filename
            course.is_cover_url = 0
            course.url_cover = None
            os.makedirs(upload_folder, exist_ok=True)
            image_file.save(os.path.join(upload_folder, filename))
        elif image_url and str(image_url).strip():
            if course.file_cover and upload_folder:
                old_file = os.path.join(upload_folder, course.file_cover)
                try:
                    if os.path.exists(old_file):
                        os.remove(old_file)
                except Exception as e:
                    logger.warning("Erro ao remover capa antiga: %s", e)
            course.url_cover = str(image_url).strip()
            course.is_cover_url = 1
            course.file_cover = None

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
                "remaining_lessons": 0,
                "remaining_seconds": 0,
                "estimated_finish_month": None,
            }

        completed_lessons = len(
            [lesson for lesson in valid_lessons if lesson.is_completed]
        )
        completion_percentage = (completed_lessons / total_lessons) * 100
        remaining_lessons = max(0, total_lessons - completed_lessons)

        durations = []
        for lesson_item in valid_lessons:
            try:
                d = int(float(lesson_item.duration)) if lesson_item.duration else 0
                if d > 0:
                    durations.append(d)
            except (ValueError, TypeError):
                pass
        avg_duration = int(sum(durations) / len(durations)) if durations else 900

        remaining_seconds = 0
        for lesson_item in valid_lessons:
            if not lesson_item.is_completed:
                try:
                    d = int(float(lesson_item.duration)) if lesson_item.duration else 0
                except (ValueError, TypeError):
                    d = 0
                remaining_seconds += d if d > 0 else avg_duration

        month_names_br = [
            "janeiro",
            "fevereiro",
            "março",
            "abril",
            "maio",
            "junho",
            "julho",
            "agosto",
            "setembro",
            "outubro",
            "novembro",
            "dezembro",
        ]
        estimated_finish_month = None
        if remaining_seconds > 0:
            # Check how many active study days exist in the system
            active_days_count = DailyActivity.query.filter(
                (DailyActivity.study_seconds > 0)
                | (DailyActivity.pomodoros_completed > 0)
                | (DailyActivity.lessons_completed > 0)
            ).count()

            if active_days_count < 7:
                estimated_finish_month = "sem previsão ainda"
            else:
                weeks_needed = max(
                    1, remaining_seconds / 10800
                )  # ~3 horas de estudo semanal
                finish_date = date.today() + timedelta(weeks=weeks_needed)
                # Include year if > 12 months
                if weeks_needed > 52:
                    estimated_finish_month = (
                        f"{month_names_br[finish_date.month - 1]}/{finish_date.year}"
                    )
                else:
                    estimated_finish_month = month_names_br[finish_date.month - 1]

        # Determine last studied date from DailyCourseActivity or DailyActivity
        last_studied_date = None
        dca = (
            DailyCourseActivity.query.filter(
                DailyCourseActivity.course_id == course_id,
                (DailyCourseActivity.study_seconds > 0)
                | (DailyCourseActivity.pomodoros > 0)
                | (DailyCourseActivity.lessons > 0),
            )
            .order_by(DailyCourseActivity.date.desc())
            .first()
        )
        if dca:
            last_studied_date = dca.date
        else:
            cid_key = f'"{course_id}"'
            recent_acts = (
                DailyActivity.query.filter(
                    DailyActivity.course_breakdown.like(f"%{cid_key}%")
                )
                .order_by(DailyActivity.date.desc())
                .limit(10)
                .all()
            )
            for a in recent_acts:
                cb = a.get_course_breakdown()
                if str(course_id) in cb:
                    info = cb[str(course_id)]
                    if info.get("study_seconds", 0) > 0 or info.get("pomodoros", 0) > 0:
                        last_studied_date = a.date
                        break

        current_lesson_number = (
            min(total_lessons, completed_lessons + 1) if total_lessons > 0 else 0
        )

        return {
            "completed_percentage": completion_percentage,
            "completion_percentage": completion_percentage,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "remaining_lessons": remaining_lessons,
            "remaining_seconds": remaining_seconds,
            "estimated_finish_month": estimated_finish_month,
            "last_studied_date": last_studied_date,
            "current_lesson_number": current_lesson_number,
        }
