import os
from app import  db, Lesson
from video_utils import get_video_duration_v1
from app import db, Course

def list_and_register_lessons(course_path, course_id):
    Lesson.query.filter_by(course_id=course_id).delete()
    list_and_register_lessons_in_directory(course_path, course_id, "")
    db.session.commit()

def translate_to_container_path(host_path):
    if not host_path:
        return host_path
    
    # Substitui barras invertidas por barras normais para facilitar busca
    normalized_path = host_path.replace("\\", "/")
    
    if os.path.exists("/courses"):
        available_courses = os.listdir("/courses")
        parts = normalized_path.split("/")
        
        # Procura a pasta raiz mapeada no volume Docker (/courses)
        for i in range(len(parts)):
            if parts[i] in available_courses:
                return "/courses/" + "/".join(parts[i:])
                
    return host_path

def list_and_register_lessons_in_directory(directory, course_id, hierarchy_prefix="", original_base_path=None):
    if original_base_path is None:
        original_base_path = directory
        
    container_dir = translate_to_container_path(directory)
    if not os.path.exists(container_dir):
        return

    entries = list(os.scandir(container_dir))
    entries.sort(key=lambda e: (e.is_file(), os.path.splitext(e.name)[0]))

    for entry in entries:
        if entry.is_dir():
            new_hierarchy_prefix = f"{hierarchy_prefix}/{entry.name}" if hierarchy_prefix else entry.name
            
            # Recria o path no formato original do host (Windows ou Linux original)
            sep = "\\" if "\\" in original_base_path else "/"
            host_entry_path = f"{directory}{sep}{entry.name}"
            
            list_and_register_lessons_in_directory(host_entry_path, course_id, new_hierarchy_prefix, original_base_path)
        elif entry.is_file() and entry.name.lower().endswith((".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm", ".pdf", ".ts", ".txt", "html")):
            title = os.path.splitext(entry.name)[0]
            is_pdf = entry.name.lower().endswith(".pdf")

            duration = get_video_duration_v1(entry.path)
            
            sep = "\\" if "\\" in original_base_path else "/"
            host_entry_path = f"{directory}{sep}{entry.name}"
            
            video_url = "" if is_pdf else host_entry_path
            pdf_url = host_entry_path if is_pdf else ""

            lesson = Lesson(
                course_id=course_id,
                title=title,
                module=hierarchy_prefix,
                hierarchy_path=hierarchy_prefix,
                video_url=video_url,
                duration=str(duration),
                progressStatus='not_started',
                isCompleted=0,
                time_elapsed='0',
                pdf_url=pdf_url
            )
            db.session.add(lesson)

    db.session.commit()

def scan_data_directory_and_register_courses():
    entries = list(os.scandir('/data'))

    for entry in entries:
        if entry.is_dir():
            course = Course(
                name=entry.name,
                path=entry.path,
                isCoverUrl=0,
                fileCover=None,
                urlCover=None
            )

            if course_already_exists(course):
                return

            db.session.add(course)
            db.session.commit()

            list_and_register_lessons_in_directory(course.path, course.id)

def course_already_exists(course: Course):
    return bool(len(Course.query.filter(Course.path == course.path).all()))