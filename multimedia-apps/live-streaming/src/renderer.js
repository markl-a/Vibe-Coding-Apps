const { ipcRenderer } = require('electron');

// 应用状态
const state = {
  isStreaming: false,
  currentScene: 'default',
  scenes: {
    'default': {
      name: '默认场景',
      sources: []
    }
  },
  currentStream: null,
  mediaRecorder: null,
  filters: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0
  },
  settings: {
    rtmpUrl: 'rtmp://localhost:1935/live',
    streamKey: '',
    videoResolution: '1280x720',
    videoFps: 30,
    videoBitrate: 2500,
    audioBitrate: 128
  },
  streamStartTime: null,
  streamTimer: null
};

// DOM 元素
const elements = {
  preview: document.getElementById('preview'),
  canvas: document.getElementById('canvas'),
  previewOverlay: document.getElementById('previewOverlay'),
  startStreamBtn: document.getElementById('startStreamBtn'),
  stopStreamBtn: document.getElementById('stopStreamBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettings: document.getElementById('closeSettings'),
  saveSettings: document.getElementById('saveSettings'),
  cancelSettings: document.getElementById('cancelSettings'),
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.getElementById('statusText'),
  streamTime: document.getElementById('streamTime'),
  addCamera: document.getElementById('addCamera'),
  addScreen: document.getElementById('addScreen'),
  addWindow: document.getElementById('addWindow'),
  sourceModal: document.getElementById('sourceModal'),
  closeSourceModal: document.getElementById('closeSourceModal'),
  sourceGrid: document.getElementById('sourceGrid'),
  muteBtn: document.getElementById('muteBtn'),
  muteIcon: document.getElementById('muteIcon'),
  volumeSlider: document.getElementById('volumeSlider'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  addScene: document.getElementById('addScene'),
  sceneList: document.getElementById('sceneList'),
  sourcesList: document.getElementById('sourcesList')
};

// 初始化
function init() {
  setupEventListeners();
  loadSettings();
  initializeFilters();
  updateStats();
}

// 设置事件监听器
function setupEventListeners() {
  // 推流控制
  elements.startStreamBtn.addEventListener('click', startStreaming);
  elements.stopStreamBtn.addEventListener('click', stopStreaming);

  // 设置模态框
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettings.addEventListener('click', closeSettings);
  elements.saveSettings.addEventListener('click', saveSettings);
  elements.cancelSettings.addEventListener('click', closeSettings);

  // 源添加
  elements.addCamera.addEventListener('click', () => openSourceSelector('camera'));
  elements.addScreen.addEventListener('click', () => openSourceSelector('screen'));
  elements.addWindow.addEventListener('click', () => openSourceSelector('window'));
  elements.closeSourceModal.addEventListener('click', closeSourceModal);

  // 场景管理
  elements.addScene.addEventListener('click', addNewScene);
  elements.sceneList.addEventListener('click', handleSceneClick);

  // 预览控制
  elements.muteBtn.addEventListener('click', toggleMute);
  elements.volumeSlider.addEventListener('input', updateVolume);
  elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

  // 滤镜控制
  setupFilterControls();

  // 模态框点击外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      closeSettings();
    }
    if (e.target === elements.sourceModal) {
      closeSourceModal();
    }
  });
}

// 滤镜控制设置
function setupFilterControls() {
  const filterInputs = ['brightness', 'contrast', 'saturation', 'blur'];

  filterInputs.forEach(filter => {
    const input = document.getElementById(filter);
    const valueDisplay = document.getElementById(`${filter}Value`);

    input.addEventListener('input', (e) => {
      const value = e.target.value;
      state.filters[filter] = value;

      if (filter === 'blur') {
        valueDisplay.textContent = `${value}px`;
      } else {
        valueDisplay.textContent = `${value}%`;
      }

      applyFilters();
    });
  });
}

// 应用滤镜效果
function applyFilters() {
  const { brightness, contrast, saturation, blur } = state.filters;

  const filterString = `
    brightness(${brightness}%)
    contrast(${contrast}%)
    saturate(${saturation}%)
    blur(${blur}px)
  `;

  elements.preview.style.filter = filterString;
}

// 初始化滤镜
function initializeFilters() {
  applyFilters();
}

// 打开源选择器
async function openSourceSelector(type) {
  elements.sourceModal.style.display = 'flex';

  const titles = {
    camera: '选择摄像头',
    screen: '选择屏幕',
    window: '选择窗口'
  };

  document.getElementById('sourceModalTitle').textContent = titles[type];

  if (type === 'camera') {
    await loadCameraSources();
  } else {
    await loadDesktopSources(type);
  }
}

// 加载摄像头源
async function loadCameraSources() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    elements.sourceGrid.innerHTML = '';

    for (const device of videoDevices) {
      const sourceCard = createSourceCard({
        id: device.deviceId,
        name: device.label || '摄像头',
        type: 'camera',
        icon: '📹'
      });

      sourceCard.addEventListener('click', () => selectCamera(device.deviceId));
      elements.sourceGrid.appendChild(sourceCard);
    }
  } catch (error) {
    console.error('Error loading cameras:', error);
    showNotification('无法访问摄像头', 'error');
  }
}

// 加载桌面源
async function loadDesktopSources(type) {
  try {
    const sources = await ipcRenderer.invoke('get-sources');
    const filteredSources = sources.filter(source => {
      if (type === 'screen') return source.id.startsWith('screen');
      if (type === 'window') return source.id.startsWith('window');
      return false;
    });

    elements.sourceGrid.innerHTML = '';

    for (const source of filteredSources) {
      const sourceCard = createSourceCard({
        id: source.id,
        name: source.name,
        type: type,
        thumbnail: source.thumbnail.toDataURL(),
        icon: type === 'screen' ? '🖥️' : '🪟'
      });

      sourceCard.addEventListener('click', () => selectDesktopSource(source));
      elements.sourceGrid.appendChild(sourceCard);
    }
  } catch (error) {
    console.error('Error loading desktop sources:', error);
    showNotification('无法获取屏幕源', 'error');
  }
}

// 创建源卡片
function createSourceCard(source) {
  const card = document.createElement('div');
  card.className = 'source-card';

  if (source.thumbnail) {
    card.innerHTML = `
      <img src="${source.thumbnail}" alt="${source.name}">
      <div class="source-card-info">
        <span class="source-icon">${source.icon}</span>
        <span class="source-name">${source.name}</span>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="source-card-placeholder">
        <span class="source-icon-large">${source.icon}</span>
      </div>
      <div class="source-card-info">
        <span class="source-name">${source.name}</span>
      </div>
    `;
  }

  return card;
}

// 选择摄像头
async function selectCamera(deviceId) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    });

    setPreviewStream(stream);
    addSourceToScene('camera', 'Camera');
    closeSourceModal();
    showNotification('摄像头已添加', 'success');
  } catch (error) {
    console.error('Error accessing camera:', error);
    showNotification('无法访问摄像头', 'error');
  }
}

// 选择桌面源
async function selectDesktopSource(source) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id,
          minWidth: 1280,
          maxWidth: 1920,
          minHeight: 720,
          maxHeight: 1080
        }
      }
    });

    setPreviewStream(stream);
    addSourceToScene(source.id.startsWith('screen') ? 'screen' : 'window', source.name);
    closeSourceModal();
    showNotification('源已添加', 'success');
  } catch (error) {
    console.error('Error accessing desktop source:', error);
    showNotification('无法访问源', 'error');
  }
}

// 设置预览流
function setPreviewStream(stream) {
  if (state.currentStream) {
    state.currentStream.getTracks().forEach(track => track.stop());
  }

  state.currentStream = stream;
  elements.preview.srcObject = stream;
  elements.previewOverlay.style.display = 'none';

  updateResolutionDisplay(stream);
}

// 添加源到场景
function addSourceToScene(type, name) {
  const scene = state.scenes[state.currentScene];
  const source = {
    id: Date.now().toString(),
    type,
    name
  };

  scene.sources.push(source);
  updateSourcesList();
}

// 更新源列表显示
function updateSourcesList() {
  const scene = state.scenes[state.currentScene];
  elements.sourcesList.innerHTML = '';

  scene.sources.forEach(source => {
    const sourceItem = document.createElement('div');
    sourceItem.className = 'source-list-item';
    sourceItem.innerHTML = `
      <span class="source-icon">${getSourceIcon(source.type)}</span>
      <span class="source-name">${source.name}</span>
      <button class="btn-remove" data-id="${source.id}">×</button>
    `;

    sourceItem.querySelector('.btn-remove').addEventListener('click', () => {
      removeSource(source.id);
    });

    elements.sourcesList.appendChild(sourceItem);
  });
}

// 获取源图标
function getSourceIcon(type) {
  const icons = {
    camera: '📹',
    screen: '🖥️',
    window: '🪟'
  };
  return icons[type] || '📹';
}

// 移除源
function removeSource(sourceId) {
  const scene = state.scenes[state.currentScene];
  scene.sources = scene.sources.filter(s => s.id !== sourceId);
  updateSourcesList();

  // 如果没有源了，停止预览
  if (scene.sources.length === 0) {
    if (state.currentStream) {
      state.currentStream.getTracks().forEach(track => track.stop());
      state.currentStream = null;
    }
    elements.preview.srcObject = null;
    elements.previewOverlay.style.display = 'flex';
  }
}

// 关闭源选择模态框
function closeSourceModal() {
  elements.sourceModal.style.display = 'none';
  elements.sourceGrid.innerHTML = '';
}

// 添加新场景
function addNewScene() {
  const sceneName = prompt('请输入场景名称:');
  if (!sceneName) return;

  const sceneId = `scene_${Date.now()}`;
  state.scenes[sceneId] = {
    name: sceneName,
    sources: []
  };

  addSceneToList(sceneId, sceneName);
}

// 添加场景到列表
function addSceneToList(sceneId, sceneName) {
  const sceneItem = document.createElement('div');
  sceneItem.className = 'scene-item';
  sceneItem.dataset.scene = sceneId;
  sceneItem.innerHTML = `
    <span class="scene-icon">🎬</span>
    <span class="scene-name">${sceneName}</span>
  `;

  elements.sceneList.appendChild(sceneItem);
}

// 处理场景点击
function handleSceneClick(e) {
  const sceneItem = e.target.closest('.scene-item');
  if (!sceneItem) return;

  // 移除所有active类
  elements.sceneList.querySelectorAll('.scene-item').forEach(item => {
    item.classList.remove('active');
  });

  // 添加active类到当前场景
  sceneItem.classList.add('active');

  // 切换场景
  const sceneId = sceneItem.dataset.scene;
  switchScene(sceneId);
}

// 切换场景
function switchScene(sceneId) {
  state.currentScene = sceneId;
  updateSourcesList();
  showNotification(`已切换到场景: ${state.scenes[sceneId].name}`, 'info');
}

// 打开设置
function openSettings() {
  // 加载当前设置
  document.getElementById('rtmpUrl').value = state.settings.rtmpUrl;
  document.getElementById('streamKey').value = state.settings.streamKey;
  document.getElementById('videoResolution').value = state.settings.videoResolution;
  document.getElementById('videoFps').value = state.settings.videoFps;
  document.getElementById('videoBitrate').value = state.settings.videoBitrate;
  document.getElementById('audioBitrate').value = state.settings.audioBitrate;

  elements.settingsModal.style.display = 'flex';
}

// 关闭设置
function closeSettings() {
  elements.settingsModal.style.display = 'none';
}

// 保存设置
function saveSettings() {
  state.settings.rtmpUrl = document.getElementById('rtmpUrl').value;
  state.settings.streamKey = document.getElementById('streamKey').value;
  state.settings.videoResolution = document.getElementById('videoResolution').value;
  state.settings.videoFps = parseInt(document.getElementById('videoFps').value);
  state.settings.videoBitrate = parseInt(document.getElementById('videoBitrate').value);
  state.settings.audioBitrate = parseInt(document.getElementById('audioBitrate').value);

  // 保存到本地存储
  localStorage.setItem('streamSettings', JSON.stringify(state.settings));

  // 通知主进程
  ipcRenderer.send('save-settings', state.settings);

  closeSettings();
  showNotification('设置已保存', 'success');
}

// 加载设置
function loadSettings() {
  const saved = localStorage.getItem('streamSettings');
  if (saved) {
    state.settings = { ...state.settings, ...JSON.parse(saved) };
  }
}

// 开始推流
async function startStreaming() {
  if (!state.currentStream) {
    showNotification('请先添加视频源', 'error');
    return;
  }

  if (!state.settings.rtmpUrl) {
    showNotification('请先配置RTMP URL', 'error');
    openSettings();
    return;
  }

  try {
    state.isStreaming = true;
    state.streamStartTime = Date.now();

    // 开始录制（实际推流需要FFmpeg支持）
    startMediaRecorder();

    // 更新UI
    elements.startStreamBtn.style.display = 'none';
    elements.stopStreamBtn.style.display = 'flex';
    elements.statusIndicator.className = 'status-indicator streaming';
    elements.statusText.textContent = '正在推流';

    // 启动计时器
    startStreamTimer();

    // 通知主进程
    ipcRenderer.send('start-stream', {
      rtmpUrl: state.settings.rtmpUrl,
      streamKey: state.settings.streamKey,
      settings: state.settings
    });

    showNotification('推流已开始', 'success');
  } catch (error) {
    console.error('Error starting stream:', error);
    showNotification('推流启动失败', 'error');
    state.isStreaming = false;
  }
}

// 停止推流
function stopStreaming() {
  state.isStreaming = false;

  // 停止录制
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }

  // 停止计时器
  if (state.streamTimer) {
    clearInterval(state.streamTimer);
    state.streamTimer = null;
  }

  // 更新UI
  elements.startStreamBtn.style.display = 'flex';
  elements.stopStreamBtn.style.display = 'none';
  elements.statusIndicator.className = 'status-indicator';
  elements.statusText.textContent = '未推流';
  elements.streamTime.textContent = '00:00:00';

  // 通知主进程
  ipcRenderer.send('stop-stream');

  showNotification('推流已停止', 'info');
}

// 开始媒体录制器（模拟推流）
function startMediaRecorder() {
  if (!state.currentStream) return;

  try {
    const options = { mimeType: 'video/webm; codecs=vp9' };
    state.mediaRecorder = new MediaRecorder(state.currentStream, options);

    state.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // 这里可以将数据发送到服务器或处理
        console.log('Recorded chunk:', event.data.size, 'bytes');
      }
    };

    state.mediaRecorder.start(1000); // 每秒产生一个chunk
  } catch (error) {
    console.error('Error starting media recorder:', error);
  }
}

// 启动推流计时器
function startStreamTimer() {
  state.streamTimer = setInterval(() => {
    const elapsed = Date.now() - state.streamStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    elements.streamTime.textContent =
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// 静音切换
function toggleMute() {
  if (state.currentStream) {
    const audioTracks = state.currentStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    elements.muteIcon.textContent = audioTracks[0]?.enabled ? '🔊' : '🔇';
  }
}

// 更新音量
function updateVolume(e) {
  const volume = e.target.value / 100;
  elements.preview.volume = volume;
}

// 全屏切换
function toggleFullscreen() {
  const previewContainer = elements.preview.parentElement;

  if (!document.fullscreenElement) {
    previewContainer.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// 更新分辨率显示
function updateResolutionDisplay(stream) {
  if (stream && stream.getVideoTracks().length > 0) {
    const settings = stream.getVideoTracks()[0].getSettings();
    document.getElementById('resolution').textContent =
      `${settings.width}x${settings.height}`;
  }
}

// 更新统计信息
function updateStats() {
  setInterval(() => {
    if (state.isStreaming) {
      // 模拟统计数据
      const bitrate = Math.floor(state.settings.videoBitrate + Math.random() * 500 - 250);
      const fps = state.settings.videoFps;

      document.getElementById('bitrate').textContent = `${bitrate} kbps`;
      document.getElementById('fps').textContent = `${fps} fps`;
    }
  }, 2000);
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
