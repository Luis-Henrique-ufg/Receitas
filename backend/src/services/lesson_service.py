import io
import logging
import os

from sqlalchemy.orm import joinedload

from database import db
from models import Course, Lesson, Note
from utils import (
    VIDEO_EXTENSIONS,
    natural_sort_key,
    translate_to_container_path,
)

logger = logging.getLogger(__name__)

ATTACHMENT_EXTENSIONS = (
    ".pdf",
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".txt",
    ".md",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".py",
    ".js",
    ".ts",
    ".html",
    ".css",
    ".json",
    ".sql",
    ".csv",
    ".ipynb",
    ".png",
    ".jpg",
    ".jpeg",
)

ATTACHMENT_KEYWORDS = (
    "material",
    "materiais",
    "anexo",
    "anexos",
    "attachment",
    "attachments",
    "extra",
    "extras",
    "exercicio",
    "exercicios",
    "recurso",
    "recursos",
    "apoio",
)


class LessonService:
    @staticmethod
    def list_by_course(course_id):
        lessons = (
            Lesson.query.filter_by(course_id=course_id)
            .options(joinedload(Lesson.course))
            .all()
        )

        response = {}
        for lesson in lessons:
            url_lower = (lesson.video_url or lesson.pdf_url or "").lower()
            if url_lower.endswith((".html", ".htm", ".txt")) or not url_lower.endswith(
                VIDEO_EXTENSIONS
            ):
                continue

            mod = lesson.module
            if mod not in response:
                response[mod] = []
            response[mod].append(lesson.to_dict())

        for mod in response:
            response[mod].sort(key=lambda item: natural_sort_key(item["title"]))

        return response

    @staticmethod
    def get_elapsed_time(lesson_id):
        lesson = Lesson.query.get_or_404(lesson_id)
        return lesson.time_elapsed

    @staticmethod
    def update_progress(
        lesson_id, progress_status=None, is_completed=None, time_elapsed=None
    ):
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            return None

        if progress_status:
            lesson.progress_status = progress_status
        if is_completed is not None:
            lesson.is_completed = 1 if is_completed else 0
        if time_elapsed is not None:
            lesson.time_elapsed = time_elapsed

        db.session.commit()
        return lesson

    @staticmethod
    def get_attachments(lesson_id):
        lesson = db.session.get(Lesson, lesson_id)
        if not lesson:
            return None
        target_path = lesson.video_url or lesson.pdf_url
        if not target_path:
            return []

        container_file = translate_to_container_path(target_path)
        container_lesson_dir = os.path.dirname(container_file)
        sep = "\\" if "\\" in target_path else "/"
        host_lesson_dir = (
            target_path.rsplit(sep, 1)[0] if sep in target_path else target_path
        )

        if not os.path.exists(container_lesson_dir):
            return []

        attachments = []
        seen_paths = set()

        def scan_dir_for_attachments(curr_container_dir, curr_host_dir, rel_prefix=""):
            try:
                for entry in os.scandir(curr_container_dir):
                    if entry.is_file():
                        ext = os.path.splitext(entry.name)[1].lower()
                        if ext not in VIDEO_EXTENSIONS and (
                            ext in ATTACHMENT_EXTENSIONS or not ext
                        ):
                            host_file_path = f"{curr_host_dir}{sep}{entry.name}"
                            if host_file_path not in seen_paths:
                                seen_paths.add(host_file_path)
                                display_name = (
                                    f"{rel_prefix}{entry.name}"
                                    if rel_prefix
                                    else entry.name
                                )
                                attachments.append(
                                    {"name": display_name, "path": host_file_path}
                                )
                    elif entry.is_dir():
                        new_rel = (
                            f"{rel_prefix}{entry.name}/"
                            if rel_prefix
                            else f"{entry.name}/"
                        )
                        scan_dir_for_attachments(
                            entry.path, f"{curr_host_dir}{sep}{entry.name}", new_rel
                        )
            except Exception as e:
                logger.error("Erro ao buscar anexos: %s", e)

        scan_dir_for_attachments(container_lesson_dir, host_lesson_dir)

        parent_container_dir = os.path.dirname(container_lesson_dir)
        parent_host_dir = (
            host_lesson_dir.rsplit(sep, 1)[0] if sep in host_lesson_dir else ""
        )
        if (
            os.path.exists(parent_container_dir)
            and parent_container_dir != container_lesson_dir
            and parent_host_dir
        ):
            try:
                for p_entry in os.scandir(parent_container_dir):
                    if p_entry.is_dir() and any(
                        k in p_entry.name.lower() for k in ATTACHMENT_KEYWORDS
                    ):
                        if p_entry.path != container_lesson_dir:
                            scan_dir_for_attachments(
                                p_entry.path,
                                f"{parent_host_dir}{sep}{p_entry.name}",
                                f"{p_entry.name}/",
                            )
            except Exception:
                pass

        return attachments

    @staticmethod
    def list_notes_by_course(course_id):
        Course.query.get_or_404(course_id)
        notes = (
            db.session.query(Note, Lesson)
            .join(Lesson, Note.lesson_id == Lesson.id)
            .filter(Lesson.course_id == course_id)
            .order_by(Lesson.id.asc(), Note.time.asc())
            .all()
        )
        return [
            {
                "id": note.id,
                "lesson_id": lesson.id,
                "lesson_title": lesson.title,
                "module": lesson.module,
                "time": note.time,
                "content": note.content,
            }
            for note, lesson in notes
        ]

    @staticmethod
    def list_notes_by_lesson(lesson_id):
        Lesson.query.get_or_404(lesson_id)
        notes = (
            Note.query.filter_by(lesson_id=lesson_id).order_by(Note.time.asc()).all()
        )
        return [note.to_dict() for note in notes]

    @staticmethod
    def create_note(lesson_id, time, content):
        Lesson.query.get_or_404(lesson_id)
        note = Note(lesson_id=lesson_id, time=time, content=content)
        db.session.add(note)
        db.session.commit()
        return note

    @staticmethod
    def update_note(note_id, content, time=None):
        note = Note.query.get_or_404(note_id)
        note.content = content
        if time is not None:
            note.time = time
        db.session.commit()
        return note

    @staticmethod
    def delete_note(note_id):
        note = Note.query.get_or_404(note_id)
        db.session.delete(note)
        db.session.commit()

    @staticmethod
    def export_notes(course_id, export_format):
        course = Course.query.get_or_404(course_id)
        notes = (
            db.session.query(Note, Lesson)
            .join(Lesson, Note.lesson_id == Lesson.id)
            .filter(Lesson.course_id == course_id)
            .order_by(Lesson.id.asc(), Note.time.asc())
            .all()
        )

        def format_time(seconds):
            mins, secs = divmod(seconds, 60)
            hours, mins = divmod(mins, 60)
            if hours > 0:
                return f"{hours:02d}:{mins:02d}:{secs:02d}"
            return f"{mins:02d}:{secs:02d}"

        if export_format == "md":
            lines = [f"# Anotações - {course.name}\n\n"]
            current_mod = None
            current_lesson = None

            for note, lesson in notes:
                if lesson.module != current_mod:
                    current_mod = lesson.module
                    lines.append(f"## Módulo: {current_mod}\n\n")
                if lesson.title != current_lesson:
                    current_lesson = lesson.title
                    lines.append(f"### {current_lesson}\n\n")
                lines.append(f"- **[{format_time(note.time)}]** {note.content}\n")

            content = "".join(lines)
            filename = f"anotacoes_{course.name.lower().replace(' ', '_')}.md"
            mimetype = "text/markdown"
        else:
            lines = [f"ANOTAÇÕES: {course.name}\n{'=' * (len(course.name) + 11)}\n\n"]
            current_lesson = None

            for note, lesson in notes:
                if lesson.title != current_lesson:
                    current_lesson = lesson.title
                    lines.append(f"\nAula: {current_lesson}\n{'-' * 40}\n")
                lines.append(f"[{format_time(note.time)}] {note.content}\n")

            content = "".join(lines)
            filename = f"anotacoes_{course.name.lower().replace(' ', '_')}.txt"
            mimetype = "text/plain"

        mem = io.BytesIO()
        mem.write(content.encode("utf-8"))
        mem.seek(0)
        return mem, filename, mimetype
