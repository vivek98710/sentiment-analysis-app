from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import json
import threading
import time
from datetime import datetime
import re
import socketio
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'youtube_downloader_secret_key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for progress tracking
download_progress = {}
active_downloads = {}

class ProgressHook:
    def __init__(self, socket_id):
        self.socket_id = socket_id
    
    def __call__(self, d):
        if d['status'] == 'downloading':
            filename = d.get('filename', 'Unknown')
            speed = d.get('speed', 0)
            percent = d.get('_percent_str', '0%')
            eta = d.get('eta', 0)
            
            progress_data = {
                'filename': os.path.basename(filename),
                'percent': percent,
                'speed': f"{speed/1024/1024:.1f} MB/s" if speed else "0 MB/s",
                'eta': f"{eta}s" if eta else "Unknown"
            }
            
            socketio.emit('download_progress', progress_data, room=self.socket_id)
        
        elif d['status'] == 'finished':
            filename = d.get('filename', 'Unknown')
            socketio.emit('download_complete', {
                'filename': os.path.basename(filename),
                'message': 'Download completed successfully!'
            }, room=self.socket_id)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    try:
        url = request.json.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Validate YouTube URL
        youtube_regex = re.compile(
            r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
            r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})')
        
        if not youtube_regex.match(url):
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = []
            for f in info.get('formats', []):
                if f.get('vcodec') != 'none' or f.get('acodec') != 'none':
                    formats.append({
                        'format_id': f.get('format_id'),
                        'ext': f.get('ext'),
                        'resolution': f.get('resolution') or f.get('height', 'audio'),
                        'filesize': f.get('filesize'),
                        'vcodec': f.get('vcodec'),
                        'acodec': f.get('acodec'),
                        'quality': f.get('quality', 0)
                    })
            
            # Sort formats by quality
            formats.sort(key=lambda x: x['quality'] if x['quality'] else 0, reverse=True)
            
            return jsonify({
                'title': info.get('title', 'Unknown Title'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail'),
                'uploader': info.get('uploader', 'Unknown'),
                'view_count': info.get('view_count', 0),
                'upload_date': info.get('upload_date'),
                'formats': formats[:20]  # Limit to first 20 formats
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download_video():
    try:
        data = request.json
        url = data.get('url')
        format_id = data.get('format_id', 'best')
        audio_only = data.get('audio_only', False)
        socket_id = data.get('socket_id')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Create downloads directory if it doesn't exist
        downloads_dir = 'downloads'
        os.makedirs(downloads_dir, exist_ok=True)
        
        # Configure yt-dlp options
        ydl_opts = {
            'outtmpl': os.path.join(downloads_dir, '%(title)s.%(ext)s'),
            'progress_hooks': [ProgressHook(socket_id)] if socket_id else [],
        }
        
        if audio_only:
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            })
        else:
            if format_id != 'best':
                ydl_opts['format'] = format_id
            else:
                ydl_opts['format'] = 'best'
        
        def download_thread():
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                
                if socket_id:
                    socketio.emit('download_success', {
                        'message': 'Video downloaded successfully!'
                    }, room=socket_id)
            
            except Exception as e:
                if socket_id:
                    socketio.emit('download_error', {
                        'error': str(e)
                    }, room=socket_id)
        
        # Start download in background thread
        thread = threading.Thread(target=download_thread)
        thread.daemon = True
        thread.start()
        
        return jsonify({'message': 'Download started successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/downloads')
def list_downloads():
    try:
        downloads_dir = 'downloads'
        if not os.path.exists(downloads_dir):
            return jsonify({'files': []})
        
        files = []
        for filename in os.listdir(downloads_dir):
            if filename.startswith('.'):
                continue
            
            filepath = os.path.join(downloads_dir, filename)
            if os.path.isfile(filepath):
                size = os.path.getsize(filepath)
                modified = os.path.getmtime(filepath)
                files.append({
                    'name': filename,
                    'size': size,
                    'modified': datetime.fromtimestamp(modified).isoformat(),
                    'download_url': f'/api/download-file/{filename}'
                })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({'files': files})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download-file/<filename>')
def download_file(filename):
    try:
        downloads_dir = 'downloads'
        filepath = os.path.join(downloads_dir, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(filepath, as_attachment=True)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=True, host='0.0.0.0', port=port)