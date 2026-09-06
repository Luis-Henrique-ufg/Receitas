import os
import re
import subprocess
import hashlib
import json
import time

CACHE_DIR = "/app/data/cache/videos"

def get_video_duration_v1(video_path):
    command = ['ffmpeg', '-i', video_path]
    try:
        result = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        output = result.communicate()[0].decode('utf-8', errors='ignore')
        duration_match = re.search(r'Duration: (\d+):(\d+):(\d+)', output)
        if duration_match:
            hours, minutes, seconds = map(int, duration_match.groups())
            total_seconds = hours * 3600 + minutes * 60 + seconds
            return total_seconds
        else:
            return 0
    except Exception as e:
        print(f"An error occurred reading duration: {e}")
        return 0

def open_video(video_path):
    if os.path.exists(video_path):
        print(video_path)
        try:
            os.startfile(video_path)
        except Exception:
            print("erro ao abrir arquivo")
        return 
    print("Caminho do vídeo não encontrado.")

def get_video_stream_info(file_path):
    cmd = [
        'ffprobe', '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        file_path
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        data = json.loads(res.stdout)
        format_info = data.get('format', {})
        format_name = format_info.get('format_name', '')
        
        streams = data.get('streams', [])
        v_codec = None
        a_codec = None
        for s in streams:
            if s.get('codec_type') == 'video' and not v_codec:
                v_codec = s.get('codec_name')
            elif s.get('codec_type') == 'audio' and not a_codec:
                a_codec = s.get('codec_name')
                
        return {
            'format_name': format_name,
            'video_codec': v_codec,
            'audio_codec': a_codec
        }
    except Exception as e:
        print(f"Error probing video {file_path}: {e}")
        return None

def is_browser_compatible(info, file_ext):
    if not info:
        return True
    
    fmt = info.get('format_name', '').lower()
    a_codec = (info.get('audio_codec') or '').lower()
    
    # MPEG-TS, AVI, WMV, FLV, MKV não são suportados nativamente via <video> em todos os navegadores
    if 'mpegts' in fmt:
        return False
    if 'avi' in fmt or 'asf' in fmt or 'flv' in fmt:
        return False
    if 'matroska' in fmt and file_ext != '.webm':
        return False
        
    # Codecs de áudio incompatíveis com reprodução MP4 direta nos navegadores
    if a_codec in ['ac3', 'eac3', 'dts', 'truehd', 'pcm_s16le', 'pcm_s24le']:
        return False
        
    return True

def ensure_compatible_video(container_path):
    if not container_path or not os.path.exists(container_path):
        return container_path, None
        
    file_ext = os.path.splitext(container_path)[1].lower()
    VIDEO_EXTENSIONS = ('.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.ts', '.m4v', '.3gp')
    
    if file_ext not in VIDEO_EXTENSIONS:
        return container_path, None
        
    info = get_video_stream_info(container_path)
    if is_browser_compatible(info, file_ext):
        return container_path, "video/mp4" if file_ext == '.mp4' else None

    # Remuxagem rápida para MP4 ISO compatível com faststart
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        file_stat = os.stat(container_path)
        key_src = f"{container_path}_{file_stat.st_size}_{file_stat.st_mtime}"
        cache_hash = hashlib.sha256(key_src.encode('utf-8')).hexdigest()[:24]
        cached_file = os.path.join(CACHE_DIR, f"{cache_hash}.mp4")
        
        if os.path.exists(cached_file) and os.path.getsize(cached_file) > 0:
            return cached_file, "video/mp4"

        tmp_file = f"{cached_file}.tmp.mp4"
        
        a_codec = (info.get('audio_codec') or '').lower() if info else ''
        if a_codec in ['aac', 'mp3', 'opus', 'flac', 'vorbis']:
            audio_args = ['-c:a', 'copy']
        else:
            audio_args = ['-c:a', 'aac', '-b:a', '192k']
            
        cmd = ['ffmpeg', '-y', '-i', container_path, '-c:v', 'copy'] + audio_args + ['-f', 'mp4', '-movflags', '+faststart', tmp_file]
        
        print(f"[Video Remux] Remuxing {container_path} -> {cached_file}")
        t0 = time.time()
        res = subprocess.run(cmd, capture_output=True, text=True)
        
        if res.returncode != 0 or not os.path.exists(tmp_file) or os.path.getsize(tmp_file) == 0:
            print(f"[Video Remux] Fast copy failed, falling back to full transcode: {res.stderr}")
            cmd_full = ['ffmpeg', '-y', '-i', container_path, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22', '-c:a', 'aac', '-f', 'mp4', '-movflags', '+faststart', tmp_file]
            res = subprocess.run(cmd_full, capture_output=True, text=True)
            
        if res.returncode == 0 and os.path.exists(tmp_file) and os.path.getsize(tmp_file) > 0:
            os.replace(tmp_file, cached_file)
            print(f"[Video Remux] Completed in {time.time() - t0:.2f}s: {cached_file} ({os.path.getsize(cached_file)} bytes)")
            return cached_file, "video/mp4"
        else:
            if os.path.exists(tmp_file):
                try: os.remove(tmp_file)
                except Exception: pass
            print(f"[Video Remux] Error: {res.stderr}")
            return container_path, None
    except Exception as e:
        print(f"[Video Remux] Exception during remuxing: {e}")
        return container_path, None