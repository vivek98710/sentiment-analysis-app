# YT Downloader Pro

A professional, modern YouTube video downloader web application with a beautiful UI and real-time progress tracking.

## Features

🎥 **Download YouTube Videos** - High-quality video downloads in various formats
🎵 **Audio Extraction** - Extract audio as MP3 files
📊 **Real-time Progress** - Live download progress with WebSocket updates
🎨 **Professional UI** - Modern, responsive design with smooth animations
📱 **Mobile Friendly** - Fully responsive design for all devices
⚡ **Fast Performance** - Optimized for speed and efficiency
📁 **Download Manager** - View and manage your downloaded files
🔧 **Advanced Options** - Custom format selection and quality settings

## Technology Stack

- **Backend**: Flask + WebSocket (SocketIO)
- **Video Processing**: yt-dlp (latest YouTube downloader)
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **UI/UX**: Inter font, Font Awesome icons, CSS Grid/Flexbox
- **Real-time**: WebSocket for live progress updates

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Internet connection

## Installation

1. **Clone or download this project**
   ```bash
   git clone <repository-url>
   cd youtube-downloader
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## Usage

### Basic Usage
1. Paste a YouTube URL into the input field
2. Click "Analyze" to fetch video information
3. Choose your preferred download option:
   - **Best Quality Video**: Downloads the highest quality available
   - **Audio Only (MP3)**: Extracts audio as MP3 file

### Advanced Options
1. Click "Advanced Options" to expand additional settings
2. Select specific video formats and resolutions
3. Choose between video+audio or audio-only downloads
4. Download with custom settings

### Features Overview
- **Auto-analysis**: Automatically analyzes videos when URLs are pasted
- **Format selection**: Choose from multiple video formats and qualities
- **Progress tracking**: Real-time download progress with speed and ETA
- **Download history**: View and re-download previous files
- **Error handling**: Comprehensive error messages and recovery

## File Structure

```
youtube-downloader/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Professional styling
│   └── js/
│       └── app.js        # Dynamic functionality
└── downloads/            # Downloaded files (created automatically)
```

## API Endpoints

- `GET /` - Main application page
- `POST /api/video-info` - Analyze YouTube video
- `POST /api/download` - Start video download
- `GET /api/downloads` - List downloaded files
- `GET /api/download-file/<filename>` - Download specific file

## Configuration

The application runs on `localhost:5000` by default. To change the configuration:

1. Modify the `app.py` file
2. Change the host and port in the final line:
   ```python
   socketio.run(app, debug=True, host='0.0.0.0', port=5000)
   ```

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Install dependencies with `pip install -r requirements.txt`
2. **Port already in use**: Change the port in `app.py` or kill the process using port 5000
3. **Download errors**: Ensure you have a stable internet connection
4. **FFmpeg errors**: Some audio conversions require FFmpeg to be installed

### FFmpeg Installation
For audio extraction (MP3), you may need FFmpeg:

**Windows**: Download from [FFmpeg official site](https://ffmpeg.org/download.html)
**macOS**: `brew install ffmpeg`
**Ubuntu/Debian**: `sudo apt install ffmpeg`

## Security Notes

- Only use this tool for content you have the right to download
- Respect YouTube's Terms of Service
- Respect content creators' copyrights
- Use for personal/educational purposes only

## Legal Disclaimer

This tool is for educational and personal use only. Users are responsible for complying with YouTube's Terms of Service and applicable copyright laws. The developers are not responsible for any misuse of this software.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Performance Tips

- Close unused tabs for better download performance
- Ensure stable internet connection
- Use wired connection for large downloads
- Clear browser cache if experiencing issues

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is open source and available under the MIT License.