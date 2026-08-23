
from flask import request, jsonify, send_file, abort, send_from_directory, render_template
from werkzeug.utils import secure_filename
import os
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import joinedload

from app import app, db, Lesson, Course, Note
from utils import list_and_register_lessons, scan_data_directory_and_register_courses, translate_to_container_path, VIDEO_EXTENSIONS
from video_utils import open_video

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/courses', methods=['GET'])
def list_courses():
    courses = Course.query.order_by(Course.position.asc()).all()
    return jsonify([{'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover } for course in courses])

@app.route('/api/courses/reorder', methods=['PUT'])
def reorder_courses():
    for item in request.json:
        course = Course.query.get(item['id'])
        if course: course.position = item['position']
    db.session.commit()
    return jsonify({'message': 'Ordem salva'})

@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
def list_lessons_for_course(course_id):
    lessons = Lesson.query \
        .filter_by(course_id=course_id) \
        .options(joinedload(Lesson.course)) \
        .all()

    response = {}
    for lesson in lessons:
        url_lower = (lesson.video_url or lesson.pdf_url or '').lower()
        if url_lower.endswith(('.html', '.htm', '.txt')) or not url_lower.endswith(VIDEO_EXTENSIONS):
            continue

        mod = lesson.module
        if mod not in response:
            response[mod] = []
        response[mod].append({
            'course_title': lesson.course.name if lesson.course else None,
            'id': lesson.id,
            'title': lesson.title,
            'module': lesson.module,
            'progressStatus': lesson.progressStatus,
            'isCompleted': lesson.isCompleted,
            'hierarchy_path': lesson.hierarchy_path,
            'time_elapsed': lesson.time_elapsed,
            'video_url': lesson.video_url,
            'duration': lesson.duration,
            'pdf_url': lesson.pdf_url,
        })
    
    return jsonify(response)


@app.route("/serve-content", methods=['GET'])
def serve_lesson_content():
    path = request.args.get('path')
    from utils import translate_to_container_path
    
    container_path = translate_to_container_path(path)

    if not os.path.exists(container_path):
        abort(404)
        
    return send_file(container_path)

@app.route('/api/update-lesson-progress', methods=['POST'])
def update_lesson_for_end_progress():
    data = request.json
    lesson_id = data.get('lessonId')
    progress_status = data.get('progressStatus')
    is_completed = data.get('isCompleted')
    time_elapsed = data.get('time_elapsed', None)

    lesson = Lesson.query.get(lesson_id)
    if lesson:
        if progress_status:
            lesson.progressStatus = progress_status
        if is_completed is not None:
            lesson.isCompleted = is_completed
        if time_elapsed is not None:
            lesson.time_elapsed = time_elapsed

        db.session.commit()
        return jsonify({'message': 'Progresso da lição atualizado com sucesso'})
    else:
        return jsonify({'error': 'Lição não encontrada'}), 404


@app.route('/api/courses', methods=['POST'])
def add_course():
    name = request.form['name']
    path = request.form['path']
    
    isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0
    urlCover = request.form.get('imageURL', None)

    if not isCoverUrl:
        image_file = request.files.get('imageFile')
        if image_file:
            filename = secure_filename(image_file.filename)
            fileCover = filename
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        else:
            fileCover = None
    else:
        fileCover = None

    course = Course(
        name=name,
        path=path,
        isCoverUrl=isCoverUrl,
        fileCover=fileCover,
        urlCover=urlCover if isCoverUrl else None
    )
    print(f"Saving course with file cover: {course.fileCover}")
    db.session.add(course)
    db.session.commit()

    list_and_register_lessons(request.form['path'], course.id)

    return jsonify({'id': course.id, 'name': course.name}), 201


@app.route('/api/courses/add-all', methods=['POST'])
def add_courses_automatically():
    scan_data_directory_and_register_courses()
    return jsonify({}), 201


@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({'id': course.id, 'name': course.name, 'path': course.path})

@app.route('/api/courses/<int:course_id>/rescan', methods=['POST'])
def rescan_course_lessons(course_id):
    course = Course.query.get_or_404(course_id)
    list_and_register_lessons(course.path, course_id)
    return jsonify({'message': 'Aulas rescaneadas com sucesso'}), 200


@app.route('/api/lessons/<int:lesson_id>', methods=['GET'])
def get_lesson_elapsed_time(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    print(lesson.time_elapsed)
    return jsonify({"elapsedTime": lesson.time_elapsed}) 


@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    old_path = course.path
    course.name = request.form['name']
    course.path = request.form['path']
    isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0

    if isCoverUrl:
        course.urlCover = request.form.get('imageURL')
        course.isCoverUrl = 1
        course.fileCover = None
    else:
        image_file = request.files.get('imageFile')
        if image_file:
            filename = secure_filename(image_file.filename)
            course.fileCover = filename
            course.isCoverUrl = 0
            course.urlCover = None
            image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        else:
            course.fileCover = course.fileCover
    print(f"Saving course with file cover: {course.fileCover}")
    db.session.commit()
    if old_path != course.path:
        list_and_register_lessons(course.path, course_id)
    

    return jsonify({'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    print(course)
    print(course_id)
    
    Lesson.query.filter_by(course_id=course_id).delete()
    
    if course.fileCover:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], course.fileCover))
        except FileNotFoundError:
            print(f"Arquivo {course.fileCover} não encontrado.")

    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course and associated lessons deleted'})



@app.route('/api/courses/<int:course_id>/completed_percentage', methods=['GET'])
def course_completion_percentage(course_id):
    course = Course.query.get_or_404(course_id)

    if course is None:
        return jsonify({'error': 'Curso não encontrado'}), 404

    lessons = Lesson.query.filter_by(course_id=course_id).all()
    valid_lessons = [
        l for l in lessons
        if not (l.video_url or l.pdf_url or '').lower().endswith(('.html', '.htm', '.txt'))
    ]
    total_lessons = len(valid_lessons)

    if total_lessons == 0:
        return jsonify({
            'completion_percentage': 0,
            'total_lessons': 0,
            'completed_lessons': 0
        })

    completed_lessons = len([l for l in valid_lessons if l.isCompleted])
    completion_percentage = (completed_lessons / total_lessons) * 100

    return jsonify({
        'completion_percentage': completion_percentage,
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons
    })


@app.route('/api/lessons/<int:lesson_id>/attachments', methods=['GET'])
def get_lesson_attachments(lesson_id):
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        abort(404)
    target_path = lesson.video_url or lesson.pdf_url
    if not target_path:
        return jsonify([])

    # Cross-platform extraction of directory path
    norm_target = target_path.replace('\\', '/')
    sep = '\\' if '\\' in target_path else '/'
    host_lesson_dir = norm_target.rsplit('/', 1)[0].replace('/', sep)

    container_lesson_dir = translate_to_container_path(host_lesson_dir)

    if not os.path.exists(container_lesson_dir):
        return jsonify([])

    ATTACHMENT_EXTENSIONS = ('.html', '.htm', '.pdf', '.txt', '.zip', '.rar', '.7z', '.tar', '.gz', 
                             '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.csv', '.json', 
                             '.md', '.py', '.c', '.cpp', '.java', '.js', '.ts', '.epub', '.mobi',
                             '.sql', '.iso', '.torrent', '.jpg', '.jpeg', '.png', '.svg')

    attachments = []
    seen_paths = set()

    def scan_dir_for_attachments(curr_container_dir, curr_host_dir, rel_prefix=""):
        try:
            if not os.path.exists(curr_container_dir):
                return
            entries = list(os.scandir(curr_container_dir))
            entries.sort(key=lambda e: e.name.lower())
            for entry in entries:
                if entry.name.startswith('.'):
                    continue
                if entry.is_file():
                    ext = os.path.splitext(entry.name)[1].lower()
                    if ext not in VIDEO_EXTENSIONS and (ext in ATTACHMENT_EXTENSIONS or not ext):
                        host_file_path = f"{curr_host_dir}{sep}{entry.name}"
                        if host_file_path not in seen_paths:
                            seen_paths.add(host_file_path)
                            display_name = f"{rel_prefix}{entry.name}" if rel_prefix else entry.name
                            attachments.append({
                                'name': display_name,
                                'path': host_file_path
                            })
                elif entry.is_dir():
                    new_rel = f"{rel_prefix}{entry.name}/" if rel_prefix else f"{entry.name}/"
                    scan_dir_for_attachments(entry.path, f"{curr_host_dir}{sep}{entry.name}", new_rel)
        except Exception as e:
            print(f"Erro ao buscar anexos: {e}")

    scan_dir_for_attachments(container_lesson_dir, host_lesson_dir)

    # Also check parent directory if it has a materials/attachments directory
    parent_container_dir = os.path.dirname(container_lesson_dir)
    parent_host_dir = host_lesson_dir.rsplit(sep, 1)[0] if sep in host_lesson_dir else ''
    if os.path.exists(parent_container_dir) and parent_container_dir != container_lesson_dir and parent_host_dir:
        try:
            keywords = ('material', 'materiais', 'anexo', 'anexos', 'attachment', 'attachments', 
                        'extra', 'extras', 'exercicio', 'exercicios', 'recurso', 'recursos', 'apoio')
            for p_entry in os.scandir(parent_container_dir):
                if p_entry.is_dir() and any(k in p_entry.name.lower() for k in keywords):
                    if p_entry.path != container_lesson_dir:
                        scan_dir_for_attachments(p_entry.path, f"{parent_host_dir}{sep}{p_entry.name}", f"{p_entry.name}/")
        except Exception:
            pass

    return jsonify(attachments)


@app.route('/api/courses/<int:course_id>/notes', methods=['GET'])
def get_course_notes(course_id):
    Course.query.get_or_404(course_id)
    notes = (
        db.session.query(Note, Lesson)
        .join(Lesson, Note.lesson_id == Lesson.id)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.id.asc(), Note.time.asc())
        .all()
    )
    return jsonify([
        {
            'id': n.id,
            'lesson_id': l.id,
            'lesson_title': l.title,
            'module': l.module,
            'time': n.time,
            'content': n.content
        }
        for n, l in notes
    ])


@app.route('/api/lessons/<int:lesson_id>/notes', methods=['GET'])
def get_lesson_notes(lesson_id):
    notes = Note.query.filter_by(lesson_id=lesson_id).order_by(Note.time.asc()).all()
    return jsonify([{'id': n.id, 'time': n.time, 'content': n.content} for n in notes])


@app.route('/api/lessons/<int:lesson_id>/notes', methods=['POST'])
def add_lesson_note(lesson_id):
    data = request.json or {}
    time = data.get('time', 0)
    content = data.get('content', '')
    if not content:
        return jsonify({'error': 'Conteúdo vazio'}), 400
    note = Note(lesson_id=lesson_id, time=time, content=content)
    db.session.add(note)
    db.session.commit()
    return jsonify({'id': note.id, 'time': note.time, 'content': note.content}), 201


@app.route('/api/notes/<int:note_id>', methods=['PUT', 'PATCH'])
def update_lesson_note(note_id):
    note = Note.query.get_or_404(note_id)
    data = request.json or {}
    content = data.get('content')
    if content is not None:
        if not content.strip():
            return jsonify({'error': 'Conteúdo vazio'}), 400
        note.content = content.strip()
    if 'time' in data and data['time'] is not None:
        note.time = int(data['time'])
    db.session.commit()
    return jsonify({'id': note.id, 'time': note.time, 'content': note.content}), 200


@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_lesson_note(note_id):
    note = Note.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Nota excluída'}), 200