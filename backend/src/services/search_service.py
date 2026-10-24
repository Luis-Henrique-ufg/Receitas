from models.course import Course
from models.lesson import Lesson
from models.note import Note
from services.lesson_service import LessonService


class SearchService:
    @staticmethod
    def search(query: str, limit: int = 20) -> dict:
        q = (query or "").strip()
        if not q:
            return {"courses": [], "lessons": [], "notes": [], "attachments": []}

        pattern = f"%{q}%"

        # 1. Search Courses
        courses = Course.query.filter(Course.name.ilike(pattern)).limit(limit).all()
        course_results = [
            {
                "id": c.id,
                "name": c.name,
                "url_cover": c.url_cover,
                "file_cover": c.file_cover,
            }
            for c in courses
        ]

        # 2. Search Lessons
        lessons = (
            Lesson.query.filter(
                (Lesson.title.ilike(pattern)) | (Lesson.module.ilike(pattern))
            )
            .limit(limit)
            .all()
        )
        lesson_results = [
            {
                "id": item.id,
                "title": item.title,
                "module": item.module,
                "course_id": item.course_id,
                "course_name": item.course.name if item.course else None,
                "is_completed": bool(item.is_completed),
            }
            for item in lessons
        ]

        # 3. Search Notes
        notes = Note.query.filter(Note.content.ilike(pattern)).limit(limit).all()
        note_results = [
            {
                "id": n.id,
                "content": n.content,
                "time": n.time,
                "lesson_id": n.lesson_id,
                "lesson_title": n.lesson.title if n.lesson else None,
                "course_id": n.lesson.course_id if n.lesson else None,
                "course_name": (
                    n.lesson.course.name if (n.lesson and n.lesson.course) else None
                ),
            }
            for n in notes
        ]

        # 4. Search Attachments across lessons found or directly in lesson attachments
        attachment_results = []
        # Sample through lessons to search attachments if query might be a file name
        sample_lessons = Lesson.query.limit(50).all()
        for les in sample_lessons:
            attachments = LessonService.get_attachments(les.id) or []
            for att in attachments:
                if q.lower() in att.get("name", "").lower():
                    attachment_results.append(
                        {
                            "name": att["name"],
                            "path": att["path"],
                            "lesson_id": les.id,
                            "lesson_title": les.title,
                            "course_id": les.course_id,
                            "course_name": les.course.name if les.course else None,
                        }
                    )
                    if len(attachment_results) >= limit:
                        break
            if len(attachment_results) >= limit:
                break

        return {
            "courses": course_results,
            "lessons": lesson_results,
            "notes": note_results,
            "attachments": attachment_results,
        }
