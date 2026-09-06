import os
import re
import unicodedata
from app import db, Lesson, Course
from video_utils import get_video_duration_v1

def natural_sort_key(s):
    if not s:
        return []
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]

def list_and_register_lessons(course_path, course_id):
    Lesson.query.filter_by(course_id=course_id).delete()
    list_and_register_lessons_in_directory(course_path, course_id, "")
    db.session.commit()

def translate_to_container_path(host_path):
    if not host_path:
        return host_path
    
    # Se já é um caminho acessível no container, retorna diretamente
    if os.path.exists(host_path):
        return host_path
    
    normalized_path = unicodedata.normalize('NFC', host_path.replace("\\", "/"))
    
    if os.path.exists("/courses"):
        available_courses = os.listdir("/courses")
        courses_map = {unicodedata.normalize('NFC', c).lower(): c for c in available_courses}
        
        parts = normalized_path.split("/")
        for i in range(len(parts)):
            part_norm = unicodedata.normalize('NFC', parts[i]).lower()
            if part_norm in courses_map:
                actual_root = courses_map[part_norm]
                subparts = parts[i+1:]
                candidate = "/courses/" + actual_root + ("/" + "/".join(subparts) if subparts else "")
                if os.path.exists(candidate):
                    return candidate
                
                # Resolução tolerante a diferenças de case/normalização em subpastas
                curr = "/courses/" + actual_root
                for sp in subparts:
                    sp_norm = unicodedata.normalize('NFC', sp).lower()
                    if not os.path.exists(curr):
                        break
                    try:
                        entries = os.listdir(curr)
                        entry_map = {unicodedata.normalize('NFC', e).lower(): e for e in entries}
                        if sp_norm in entry_map:
                            curr = os.path.join(curr, entry_map[sp_norm]).replace("\\", "/")
                        else:
                            curr = os.path.join(curr, sp).replace("\\", "/")
                    except Exception:
                        curr = os.path.join(curr, sp).replace("\\", "/")
                
                return curr
                
    return host_path

VIDEO_EXTENSIONS = ('.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.ts', '.m4v', '.3gp')

def list_and_register_lessons_in_directory(directory, course_id, hierarchy_prefix="", original_base_path=None):
    if original_base_path is None:
        original_base_path = directory
        
    container_dir = translate_to_container_path(directory)
    if not os.path.exists(container_dir):
        return

    entries = list(os.scandir(container_dir))
    entries.sort(key=lambda e: (e.is_file(), natural_sort_key(os.path.splitext(e.name)[0])))

    for entry in entries:
        if entry.is_dir():
            new_hierarchy_prefix = f"{hierarchy_prefix}/{entry.name}" if hierarchy_prefix else entry.name
            
            # Recria o path no formato original do host (Windows ou Linux original)
            sep = "\\" if "\\" in original_base_path else "/"
            host_entry_path = f"{directory}{sep}{entry.name}"
            
            list_and_register_lessons_in_directory(host_entry_path, course_id, new_hierarchy_prefix, original_base_path)
        elif entry.is_file() and entry.name.lower().endswith(VIDEO_EXTENSIONS):
            title = os.path.splitext(entry.name)[0]

            duration = get_video_duration_v1(entry.path)
            
            sep = "\\" if "\\" in original_base_path else "/"
            host_entry_path = f"{directory}{sep}{entry.name}"
            
            video_url = host_entry_path
            pdf_url = ""

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
    if not os.path.exists('/data'):
        return
        
    entries = list(os.scandir('/data'))
    entries.sort(key=lambda e: natural_sort_key(e.name))

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
                continue

            db.session.add(course)
            db.session.commit()

            list_and_register_lessons_in_directory(course.path, course.id)

def course_already_exists(course: Course):
    return bool(len(Course.query.filter(Course.path == course.path).all()))