const { ipcRenderer } = require('electron');

class MusicPlayer {
  constructor() {
    this.playlist = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 'none'; // 'none', 'all', 'one'
    this.volume = 0.7;

    this.audio = document.getElementById('audio');
    this.audioEngine = new AudioEngine();
    this.visualizer = null;

    this.setupUI();
    this.setupEventListeners();
    this.loadPlaylistFromStorage();
  }

  setupUI() {
    // 初始化音頻引擎
    this.audio.addEventListener('loadedmetadata', () => {
      if (!this.audioEngine.isInitialized) {
        this.audioEngine.init(this.audio);
        this.audioEngine.setVolume(this.volume);
      }
    });

    // 初始化可視化
    const canvas = document.getElementById('visualizer');
    this.visualizer = new Visualizer(canvas, this.audioEngine);
    this.visualizer.resize();

    window.addEventListener('resize', () => this.visualizer.resize());

    // 設置初始音量
    this.audio.volume = this.volume;
    this.updateVolumeUI();
  }

  setupEventListeners() {
    // 播放控制
    document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());
    document.getElementById('prevBtn').addEventListener('click', () => this.previous());
    document.getElementById('nextBtn').addEventListener('click', () => this.next());

    // 音量控制
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      this.setVolume(parseFloat(e.target.value));
    });
    document.getElementById('muteBtn').addEventListener('click', () => this.toggleMute());

    // 播放模式
    document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());
    document.getElementById('repeatBtn').addEventListener('click', () => this.cycleRepeat());

    // 進度條
    document.getElementById('progressBar').addEventListener('input', (e) => {
      const time = (this.audio.duration * e.target.value) / 100;
      this.audio.currentTime = time;
    });

    // 播放列表
    document.getElementById('addFilesBtn').addEventListener('click', () => this.addFiles());
    document.getElementById('addFolderBtn').addEventListener('click', () => this.addFolder());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearPlaylist());
    document.getElementById('savePlaylistBtn').addEventListener('click', () => this.savePlaylist());
    document.getElementById('loadPlaylistBtn').addEventListener('click', () => this.loadPlaylist());

    // 均衡器
    document.getElementById('eqToggle').addEventListener('click', () => this.toggleEQ());
    document.getElementById('eqPreset').addEventListener('change', (e) => {
      this.audioEngine.applyEQPreset(e.target.value);
    });

    // 均衡器滑桿
    for (let i = 0; i < 10; i++) {
      const slider = document.getElementById(`eq${i}`);
      slider.addEventListener('input', (e) => {
        this.audioEngine.setEQ(i, parseFloat(e.target.value));
      });
    }

    // 可視化模式切換
    document.getElementById('vizMode').addEventListener('change', (e) => {
      this.visualizer.setMode(e.target.value);
    });

    // 音頻事件
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.onTrackEnded());
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButton();
      this.visualizer.start();
      this.audioEngine.resume();
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButton();
      this.visualizer.stop();
    });

    // 鍵盤快捷鍵
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch(e.key) {
        case ' ':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowRight':
          this.next();
          break;
        case 'ArrowLeft':
          this.previous();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setVolume(Math.min(1, this.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setVolume(Math.max(0, this.volume - 0.05));
          break;
        case 'm':
        case 'M':
          this.toggleMute();
          break;
        case 's':
        case 'S':
          this.toggleShuffle();
          break;
        case 'r':
        case 'R':
          this.cycleRepeat();
          break;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        this.addFiles();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        this.clearPlaylist();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.toggleEQ();
      }
    });
  }

  async addFiles() {
    const files = await ipcRenderer.invoke('open-music-dialog');
    if (files) {
      files.forEach(file => {
        this.playlist.push(file);
      });
      this.updatePlaylistUI();
      this.savePlaylistToStorage();

      if (this.currentIndex === -1) {
        this.play(0);
      }
    }
  }

  async addFolder() {
    const files = await ipcRenderer.invoke('open-folder-dialog');
    if (files) {
      files.forEach(file => {
        this.playlist.push(file);
      });
      this.updatePlaylistUI();
      this.savePlaylistToStorage();

      if (this.currentIndex === -1) {
        this.play(0);
      }
    }
  }

  play(index) {
    if (index < 0 || index >= this.playlist.length) return;

    this.currentIndex = index;
    const track = this.playlist[index];

    this.audio.src = track.path;
    this.audio.play();

    this.updateNowPlaying(track);
    this.highlightCurrentTrack();
  }

  togglePlay() {
    if (this.playlist.length === 0) return;

    if (this.isPlaying) {
      this.audio.pause();
    } else {
      if (this.currentIndex === -1) {
        this.play(0);
      } else {
        this.audio.play();
      }
    }
  }

  previous() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
    } else {
      let newIndex = this.currentIndex - 1;
      if (newIndex < 0) {
        newIndex = this.playlist.length - 1;
      }
      this.play(newIndex);
    }
  }

  next() {
    const newIndex = this.getNextTrackIndex();
    this.play(newIndex);
  }

  getNextTrackIndex() {
    if (this.isShuffle) {
      return Math.floor(Math.random() * this.playlist.length);
    } else {
      return (this.currentIndex + 1) % this.playlist.length;
    }
  }

  onTrackEnded() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play();
    } else if (this.repeatMode === 'all') {
      this.next();
    } else {
      if (this.currentIndex < this.playlist.length - 1) {
        this.next();
      } else {
        this.isPlaying = false;
        this.updatePlayButton();
      }
    }
  }

  setVolume(value) {
    this.volume = value;
    this.audio.volume = value;
    this.audioEngine.setVolume(value);
    this.updateVolumeUI();
  }

  toggleMute() {
    if (this.audio.volume === 0) {
      this.setVolume(this.volume || 0.7);
    } else {
      this.audio.volume = 0;
      this.audioEngine.setVolume(0);
      this.updateVolumeUI();
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    document.getElementById('shuffleBtn').classList.toggle('active', this.isShuffle);
  }

  cycleRepeat() {
    const modes = ['none', 'all', 'one'];
    const currentIdx = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIdx + 1) % modes.length];

    const btn = document.getElementById('repeatBtn');
    btn.classList.toggle('active', this.repeatMode !== 'none');
    btn.textContent = this.repeatMode === 'one' ? '🔂' : '🔁';
  }

  clearPlaylist() {
    this.playlist = [];
    this.currentIndex = -1;
    this.audio.pause();
    this.audio.src = '';
    this.updatePlaylistUI();
    this.updateNowPlaying(null);
    this.savePlaylistToStorage();
  }

  async savePlaylist() {
    const result = await ipcRenderer.invoke('save-playlist', this.playlist);
    if (result.success) {
      alert('播放列表已儲存!');
    }
  }

  async loadPlaylist() {
    const playlist = await ipcRenderer.invoke('load-playlist');
    if (playlist) {
      this.playlist = playlist;
      this.updatePlaylistUI();
      this.savePlaylistToStorage();
    }
  }

  toggleEQ() {
    const panel = document.getElementById('eqPanel');
    panel.classList.toggle('hidden');
  }

  updatePlaylistUI() {
    const container = document.getElementById('playlistItems');
    container.innerHTML = '';

    this.playlist.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.dataset.index = index;

      const sizeKB = (track.size / 1024).toFixed(1);

      item.innerHTML = `
        <span class="track-number">${index + 1}</span>
        <span class="track-name">${track.name}</span>
        <span class="track-size">${sizeKB} KB</span>
      `;

      item.addEventListener('click', () => this.play(index));
      item.addEventListener('dblclick', () => {
        this.play(index);
      });

      container.appendChild(item);
    });
  }

  highlightCurrentTrack() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
      item.classList.toggle('active', index === this.currentIndex);
    });
  }

  updateNowPlaying(track) {
    const title = document.getElementById('trackTitle');
    const info = document.getElementById('trackInfo');

    if (track) {
      title.textContent = track.name;
      info.textContent = `正在播放 ${this.currentIndex + 1} / ${this.playlist.length}`;
    } else {
      title.textContent = '未播放';
      info.textContent = '請選擇音樂';
    }
  }

  updateProgress() {
    const current = this.audio.currentTime;
    const duration = this.audio.duration;

    if (!isNaN(duration)) {
      const progress = (current / duration) * 100;
      document.getElementById('progressBar').value = progress;

      document.getElementById('currentTime').textContent = this.formatTime(current);
      document.getElementById('totalTime').textContent = this.formatTime(duration);
    }
  }

  updatePlayButton() {
    const btn = document.getElementById('playBtn');
    btn.textContent = this.isPlaying ? '⏸' : '▶';
  }

  updateVolumeUI() {
    const slider = document.getElementById('volumeSlider');
    slider.value = this.audio.volume;

    const btn = document.getElementById('muteBtn');
    btn.textContent = this.audio.volume === 0 ? '🔇' : '🔊';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  savePlaylistToStorage() {
    localStorage.setItem('playlist', JSON.stringify(this.playlist));
  }

  loadPlaylistFromStorage() {
    const saved = localStorage.getItem('playlist');
    if (saved) {
      try {
        this.playlist = JSON.parse(saved);
        this.updatePlaylistUI();
      } catch (e) {
        console.error('Failed to load playlist:', e);
      }
    }
  }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
  const player = new MusicPlayer();
});
