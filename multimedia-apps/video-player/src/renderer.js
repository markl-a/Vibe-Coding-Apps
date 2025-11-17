const { ipcRenderer } = require('electron');

// DOM 元素
const videoPlayer = document.getElementById('videoPlayer');
const videoContainer = document.getElementById('videoContainer');
const controlsOverlay = document.getElementById('controlsOverlay');
const emptyState = document.getElementById('emptyState');
const playlist = document.getElementById('playlist');
const sidebar = document.getElementById('sidebar');

// 控制按鈕
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const forwardBtn = document.getElementById('forwardBtn');
const backwardBtn = document.getElementById('backwardBtn');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const speedBtn = document.getElementById('speedBtn');
const speedMenu = document.getElementById('speedMenu');
const speedText = document.getElementById('speedText');
const subtitleBtn = document.getElementById('subtitleBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// 進度條
const progressBar = document.getElementById('progressBar');
const progressFilled = document.getElementById('progressFilled');
const progressHandle = document.getElementById('progressHandle');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');

// 其他按鈕
const openFileBtn = document.getElementById('openFileBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');

// 播放列表數據
let playlistData = [];
let currentVideoIndex = -1;

// 控制顯示/隱藏計時器
let hideControlsTimer;

// 初始化
init();

function init() {
    setupEventListeners();
    setupDragDrop();
    setupIPC();
}

// 設置事件監聽
function setupEventListeners() {
    // 播放控制
    playPauseBtn.addEventListener('click', togglePlayPause);
    stopBtn.addEventListener('click', stopVideo);
    forwardBtn.addEventListener('click', () => seekRelative(10));
    backwardBtn.addEventListener('click', () => seekRelative(-10));

    // 音量控制
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', (e) => {
        videoPlayer.volume = e.target.value / 100;
        updateVolumeIcon();
    });

    // 播放速度
    speedBtn.addEventListener('click', () => {
        speedMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('.speed-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const speed = parseFloat(e.target.dataset.speed);
            videoPlayer.playbackRate = speed;
            speedText.textContent = `${speed}x`;

            document.querySelectorAll('.speed-option').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            speedMenu.classList.add('hidden');
        });
    });

    // 字幕
    subtitleBtn.addEventListener('click', loadSubtitle);

    // 全屏
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // 進度條
    progressBar.addEventListener('click', seekToPosition);
    progressBar.addEventListener('mousedown', startSeeking);

    // 視頻事件
    videoPlayer.addEventListener('loadedmetadata', onVideoLoaded);
    videoPlayer.addEventListener('timeupdate', updateProgress);
    videoPlayer.addEventListener('ended', onVideoEnded);
    videoPlayer.addEventListener('play', updatePlayButton);
    videoPlayer.addEventListener('pause', updatePlayButton);

    // 打開文件
    openFileBtn.addEventListener('click', openVideoFile);
    openFolderBtn.addEventListener('click', openFolder);
    clearPlaylistBtn.addEventListener('click', clearPlaylist);

    // 鍵盤快捷鍵
    document.addEventListener('keydown', handleKeyboard);

    // 控制層顯示/隱藏
    videoContainer.addEventListener('mousemove', showControls);
    videoContainer.addEventListener('mouseleave', hideControls);
    videoContainer.addEventListener('click', (e) => {
        if (e.target === videoPlayer || e.target === videoContainer) {
            togglePlayPause();
        }
    });

    // 點擊其他地方關閉速度選單
    document.addEventListener('click', (e) => {
        if (!speedBtn.contains(e.target) && !speedMenu.contains(e.target)) {
            speedMenu.classList.add('hidden');
        }
    });
}

// 設置拖放
function setupDragDrop() {
    videoContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoContainer.classList.add('drag-over');
    });

    videoContainer.addEventListener('dragleave', () => {
        videoContainer.classList.remove('drag-over');
    });

    videoContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        videoContainer.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files).filter(file => {
            return file.type.startsWith('video/');
        });

        if (files.length > 0) {
            addToPlaylist(files.map(file => ({
                path: file.path,
                name: file.name,
                size: file.size
            })));
            playVideo(0);
        }
    });
}

// 設置 IPC
function setupIPC() {
    ipcRenderer.on('menu-open-file', openVideoFile);
    ipcRenderer.on('menu-open-folder', openFolder);
    ipcRenderer.on('menu-play-pause', togglePlayPause);
    ipcRenderer.on('menu-stop', stopVideo);
    ipcRenderer.on('menu-forward', () => seekRelative(10));
    ipcRenderer.on('menu-backward', () => seekRelative(-10));
}

// 打開視頻文件
async function openVideoFile() {
    const files = await ipcRenderer.invoke('open-video-dialog');
    if (files && files.length > 0) {
        addToPlaylist(files);
        playVideo(playlistData.length - files.length);
    }
}

// 打開文件夾
async function openFolder() {
    const files = await ipcRenderer.invoke('open-folder-dialog');
    if (files && files.length > 0) {
        addToPlaylist(files);
        playVideo(playlistData.length - files.length);
    }
}

// 添加到播放列表
function addToPlaylist(files) {
    files.forEach(file => {
        playlistData.push(file);

        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <div class="playlist-item-info">
                <div class="playlist-item-name">${file.name}</div>
                <div class="playlist-item-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="playlist-item-remove" title="移除">
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;

        const index = playlistData.length - 1;
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.playlist-item-remove')) {
                playVideo(index);
            }
        });

        item.querySelector('.playlist-item-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromPlaylist(index);
        });

        playlist.appendChild(item);
    });

    updatePlaylistUI();
}

// 從播放列表移除
function removeFromPlaylist(index) {
    playlistData.splice(index, 1);
    renderPlaylist();

    if (index === currentVideoIndex) {
        if (playlistData.length > 0) {
            playVideo(Math.min(index, playlistData.length - 1));
        } else {
            stopVideo();
        }
    } else if (index < currentVideoIndex) {
        currentVideoIndex--;
    }
}

// 清空播放列表
function clearPlaylist() {
    playlistData = [];
    currentVideoIndex = -1;
    stopVideo();
    renderPlaylist();
}

// 重新渲染播放列表
function renderPlaylist() {
    playlist.innerHTML = '';

    if (playlistData.length === 0) {
        playlist.innerHTML = '<div class="playlist-empty"><p>播放列表為空</p></div>';
    } else {
        playlistData.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === currentVideoIndex) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <div class="playlist-item-info">
                    <div class="playlist-item-name">${file.name}</div>
                    <div class="playlist-item-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="playlist-item-remove" title="移除">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.playlist-item-remove')) {
                    playVideo(index);
                }
            });

            item.querySelector('.playlist-item-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromPlaylist(index);
            });

            playlist.appendChild(item);
        });
    }

    updatePlaylistUI();
}

// 更新播放列表 UI
function updatePlaylistUI() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentVideoIndex);
    });
}

// 播放視頻
function playVideo(index) {
    if (index < 0 || index >= playlistData.length) return;

    currentVideoIndex = index;
    const file = playlistData[index];

    videoPlayer.src = file.path;
    videoPlayer.load();
    videoPlayer.play();

    emptyState.style.display = 'none';
    updatePlaylistUI();
}

// 播放/暫停
function togglePlayPause() {
    if (videoPlayer.paused || videoPlayer.ended) {
        if (videoPlayer.ended && currentVideoIndex >= 0) {
            videoPlayer.currentTime = 0;
        }
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

// 停止
function stopVideo() {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    if (playlistData.length === 0) {
        videoPlayer.src = '';
        emptyState.style.display = 'flex';
    }
}

// 快進/快退
function seekRelative(seconds) {
    if (videoPlayer.src) {
        videoPlayer.currentTime = Math.max(0, Math.min(videoPlayer.duration, videoPlayer.currentTime + seconds));
    }
}

// 跳轉到指定位置
function seekToPosition(e) {
    if (!videoPlayer.src) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoPlayer.currentTime = percent * videoPlayer.duration;
}

let isSeeking = false;

function startSeeking(e) {
    if (!videoPlayer.src) return;
    isSeeking = true;

    const seek = (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        videoPlayer.currentTime = percent * videoPlayer.duration;
    };

    const stopSeeking = () => {
        isSeeking = false;
        document.removeEventListener('mousemove', seek);
        document.removeEventListener('mouseup', stopSeeking);
    };

    document.addEventListener('mousemove', seek);
    document.addEventListener('mouseup', stopSeeking);
}

// 靜音切換
function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    updateVolumeIcon();
}

// 更新音量圖標
function updateVolumeIcon() {
    const volumeIcon = muteBtn.querySelector('.volume-icon');
    const muteIcon = muteBtn.querySelector('.mute-icon');

    if (videoPlayer.muted || videoPlayer.volume === 0) {
        volumeIcon.classList.add('hidden');
        muteIcon.classList.remove('hidden');
    } else {
        volumeIcon.classList.remove('hidden');
        muteIcon.classList.add('hidden');
    }
}

// 載入字幕
async function loadSubtitle() {
    const subtitle = await ipcRenderer.invoke('open-subtitle-dialog');
    if (subtitle) {
        // 簡單的字幕支持
        alert('字幕功能正在開發中');
    }
}

// 全屏切換
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
        fullscreenBtn.querySelector('.fullscreen-icon').classList.add('hidden');
        fullscreenBtn.querySelector('.exit-fullscreen-icon').classList.remove('hidden');
    } else {
        document.exitFullscreen();
        fullscreenBtn.querySelector('.fullscreen-icon').classList.remove('hidden');
        fullscreenBtn.querySelector('.exit-fullscreen-icon').classList.add('hidden');
    }
}

// 視頻載入完成
function onVideoLoaded() {
    durationDisplay.textContent = formatTime(videoPlayer.duration);
    updateProgress();
}

// 更新進度
function updateProgress() {
    const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100 || 0;
    progressFilled.style.width = `${percent}%`;
    progressHandle.style.left = `${percent}%`;
    currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
}

// 視頻結束
function onVideoEnded() {
    // 自動播放下一個
    if (currentVideoIndex < playlistData.length - 1) {
        playVideo(currentVideoIndex + 1);
    }
}

// 更新播放按鈕
function updatePlayButton() {
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');

    if (videoPlayer.paused) {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    } else {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }
}

// 鍵盤快捷鍵
function handleKeyboard(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowRight':
            e.preventDefault();
            seekRelative(10);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            seekRelative(-10);
            break;
        case 'ArrowUp':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            volumeSlider.value = videoPlayer.volume * 100;
            break;
        case 'ArrowDown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            volumeSlider.value = videoPlayer.volume * 100;
            break;
        case 'm':
        case 'M':
            toggleMute();
            break;
        case 'f':
        case 'F':
            if (!e.ctrlKey) {
                toggleFullscreen();
            }
            break;
    }
}

// 顯示控制層
function showControls() {
    controlsOverlay.classList.add('show');
    clearTimeout(hideControlsTimer);

    if (!videoPlayer.paused) {
        hideControlsTimer = setTimeout(hideControls, 3000);
    }
}

// 隱藏控制層
function hideControls() {
    if (!videoPlayer.paused) {
        controlsOverlay.classList.remove('show');
    }
}

// 工具函數：格式化時間
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 工具函數：格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
