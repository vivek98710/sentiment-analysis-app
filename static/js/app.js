// Global variables
let socket;
let currentVideoInfo = null;
let isDownloading = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize WebSocket connection
    initializeSocket();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load downloads history
    loadDownloads();
    
    // Add smooth animations
    document.body.classList.add('fade-in');
}

function initializeSocket() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to server');
    });
    
    socket.on('download_progress', function(data) {
        updateDownloadProgress(data);
    });
    
    socket.on('download_complete', function(data) {
        showDownloadComplete(data);
    });
    
    socket.on('download_success', function(data) {
        showDownloadSuccess(data);
        loadDownloads(); // Refresh downloads list
    });
    
    socket.on('download_error', function(data) {
        showDownloadError(data);
    });
}

function setupEventListeners() {
    const videoUrl = document.getElementById('videoUrl');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // Analyze button click
    analyzeBtn.addEventListener('click', analyzeVideo);
    
    // Enter key in URL input
    videoUrl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeVideo();
        }
    });
    
    // Auto-analyze when URL is pasted
    videoUrl.addEventListener('paste', function() {
        setTimeout(function() {
            if (isValidYouTubeUrl(videoUrl.value)) {
                analyzeVideo();
            }
        }, 100);
    });
}

function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%\?]{11})/;
    return youtubeRegex.test(url);
}

async function analyzeVideo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    
    if (!videoUrl) {
        showError('Please enter a YouTube URL');
        return;
    }
    
    if (!isValidYouTubeUrl(videoUrl)) {
        showError('Please enter a valid YouTube URL');
        return;
    }
    
    showLoading(true);
    hideVideoInfo();
    hideProgress();
    
    try {
        const response = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentVideoInfo = data;
            displayVideoInfo(data);
            showVideoInfo();
        } else {
            showError(data.error || 'Failed to analyze video');
        }
    } catch (error) {
        console.error('Error analyzing video:', error);
        showError('Network error occurred. Please try again.');
    } finally {
        showLoading(false);
    }
}

function displayVideoInfo(info) {
    // Set thumbnail
    document.getElementById('videoThumbnail').src = info.thumbnail || '';
    
    // Set video details
    document.getElementById('videoTitle').textContent = info.title || 'Unknown Title';
    document.getElementById('videoUploader').textContent = info.uploader || 'Unknown';
    document.getElementById('videoViews').textContent = formatNumber(info.view_count || 0) + ' views';
    document.getElementById('videoDuration').textContent = formatDuration(info.duration || 0);
    
    // Format upload date
    if (info.upload_date) {
        const date = new Date(info.upload_date.slice(0,4), info.upload_date.slice(4,6)-1, info.upload_date.slice(6,8));
        document.getElementById('videoDate').textContent = date.toLocaleDateString();
    } else {
        document.getElementById('videoDate').textContent = 'Unknown';
    }
    
    // Populate format selector
    const formatSelect = document.getElementById('formatSelect');
    formatSelect.innerHTML = '<option value="best">Best Quality (Auto)</option>';
    
    if (info.formats && info.formats.length > 0) {
        info.formats.forEach(format => {
            if (format.resolution && format.resolution !== 'audio') {
                const option = document.createElement('option');
                option.value = format.format_id;
                option.textContent = `${format.resolution} (${format.ext}) - ${formatFileSize(format.filesize)}`;
                formatSelect.appendChild(option);
            }
        });
    }
}

function quickDownload(formatId, audioOnly) {
    if (isDownloading) {
        showError('A download is already in progress');
        return;
    }
    
    startDownload(formatId, audioOnly);
}

function customDownload() {
    if (isDownloading) {
        showError('A download is already in progress');
        return;
    }
    
    const formatSelect = document.getElementById('formatSelect');
    const downloadType = document.querySelector('input[name="downloadType"]:checked').value;
    const formatId = formatSelect.value;
    const audioOnly = downloadType === 'audio';
    
    startDownload(formatId, audioOnly);
}

async function startDownload(formatId, audioOnly) {
    if (!currentVideoInfo) {
        showError('Please analyze a video first');
        return;
    }
    
    isDownloading = true;
    showProgress();
    hideVideoInfo();
    
    // Reset progress
    updateDownloadProgress({
        filename: 'Preparing download...',
        percent: '0%',
        speed: '0 MB/s',
        eta: 'Calculating...'
    });
    
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: document.getElementById('videoUrl').value,
                format_id: formatId,
                audio_only: audioOnly,
                socket_id: socket.id
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Download failed');
        }
        
        // Download started successfully
        updateDownloadStatus('Download started...', 'info');
        
    } catch (error) {
        console.error('Error starting download:', error);
        showDownloadError({ error: error.message });
    }
}

function updateDownloadProgress(data) {
    document.getElementById('downloadFilename').textContent = data.filename || '-';
    document.getElementById('downloadPercent').textContent = data.percent || '0%';
    document.getElementById('downloadSpeed').textContent = data.speed || '-';
    document.getElementById('downloadEta').textContent = data.eta || '-';
    
    // Update progress bar
    const percent = parseFloat(data.percent) || 0;
    document.getElementById('progressFill').style.width = percent + '%';
}

function showDownloadComplete(data) {
    updateDownloadStatus(`Downloaded: ${data.filename}`, 'success');
}

function showDownloadSuccess(data) {
    isDownloading = false;
    updateDownloadStatus('Download completed successfully!', 'success');
    
    setTimeout(() => {
        hideProgress();
        showVideoInfo();
    }, 3000);
}

function showDownloadError(data) {
    isDownloading = false;
    updateDownloadStatus(`Error: ${data.error}`, 'error');
    
    setTimeout(() => {
        hideProgress();
        showVideoInfo();
    }, 5000);
}

function updateDownloadStatus(message, type) {
    const statusElement = document.getElementById('downloadStatus');
    statusElement.textContent = message;
    statusElement.className = 'download-status ' + type;
}

async function loadDownloads() {
    try {
        const response = await fetch('/api/downloads');
        const data = await response.json();
        
        if (response.ok) {
            displayDownloads(data.files || []);
        } else {
            console.error('Failed to load downloads:', data.error);
        }
    } catch (error) {
        console.error('Error loading downloads:', error);
    }
}

function displayDownloads(files) {
    const downloadsList = document.getElementById('downloadsList');
    
    if (files.length === 0) {
        downloadsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No downloads yet</p>';
        return;
    }
    
    downloadsList.innerHTML = files.map(file => `
        <div class="download-item">
            <div class="download-info">
                <h4>${escapeHtml(file.name)}</h4>
                <div class="download-meta">
                    <span><i class="fas fa-file"></i> ${formatFileSize(file.size)}</span>
                    <span><i class="fas fa-clock"></i> ${formatDate(file.modified)}</span>
                </div>
            </div>
            <div class="download-actions">
                <button class="download-file-btn" onclick="downloadFile('${encodeURIComponent(file.name)}')">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `).join('');
}

function downloadFile(filename) {
    const url = `/api/download-file/${filename}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = decodeURIComponent(filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function toggleAdvanced() {
    const panel = document.getElementById('advancedPanel');
    const button = document.querySelector('.toggle-advanced');
    const icon = button.querySelector('.fa-chevron-down');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        panel.classList.add('fade-in');
        icon.style.transform = 'rotate(180deg)';
        button.querySelector('span').textContent = 'Hide Advanced Options';
    } else {
        panel.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
        button.querySelector('span').textContent = 'Advanced Options';
    }
}

// Utility functions
function showLoading(show) {
    const loadingSection = document.getElementById('loadingSection');
    if (show) {
        loadingSection.classList.remove('hidden');
        loadingSection.classList.add('fade-in');
    } else {
        loadingSection.classList.add('hidden');
    }
}

function showVideoInfo() {
    const videoInfoSection = document.getElementById('videoInfoSection');
    videoInfoSection.classList.remove('hidden');
    videoInfoSection.classList.add('fade-in');
}

function hideVideoInfo() {
    const videoInfoSection = document.getElementById('videoInfoSection');
    videoInfoSection.classList.add('hidden');
}

function showProgress() {
    const progressSection = document.getElementById('progressSection');
    progressSection.classList.remove('hidden');
    progressSection.classList.add('fade-in');
}

function hideProgress() {
    const progressSection = document.getElementById('progressSection');
    progressSection.classList.add('hidden');
}

function showError(message) {
    showModal('Error', `<p style="color: #dc3545; text-align: center; padding: 20px;"><i class="fas fa-exclamation-triangle"></i> ${message}</p>`);
}

function showSuccess(message) {
    showModal('Success', `<p style="color: #28a745; text-align: center; padding: 20px;"><i class="fas fa-check-circle"></i> ${message}</p>`);
}

function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `<h3 style="margin-bottom: 20px; text-align: center;">${title}</h3>${content}`;
    modal.classList.remove('hidden');
    modal.classList.add('fade-in');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Modal content functions
function showAbout() {
    showModal('About YT Downloader Pro', `
        <div style="text-align: center;">
            <p style="margin-bottom: 15px;">Professional YouTube Video Downloader</p>
            <p style="margin-bottom: 15px;">Built with modern web technologies:</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>Flask Backend</li>
                <li>yt-dlp for video processing</li>
                <li>WebSocket for real-time progress</li>
                <li>Responsive design</li>
            </ul>
            <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
                Please respect copyright laws and use responsibly.
            </p>
        </div>
    `);
}

function showPrivacy() {
    showModal('Privacy Policy', `
        <div>
            <p style="margin-bottom: 15px;">We respect your privacy:</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>No personal data is collected or stored</li>
                <li>Downloaded videos are stored locally</li>
                <li>No tracking or analytics</li>
                <li>All processing happens on your device</li>
            </ul>
            <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
                Downloaded files are your responsibility to manage.
            </p>
        </div>
    `);
}

function showTerms() {
    showModal('Terms of Service', `
        <div>
            <p style="margin-bottom: 15px;">Terms and Conditions:</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li>Use this service responsibly and legally</li>
                <li>Respect YouTube's terms of service</li>
                <li>Respect content creators' rights</li>
                <li>Don't distribute copyrighted content</li>
                <li>Use for personal purposes only</li>
            </ul>
            <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">
                By using this service, you agree to these terms.
            </p>
        </div>
    `);
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        closeModal();
    }
});