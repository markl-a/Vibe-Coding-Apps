const { ipcRenderer } = require('electron');
const path = require('path');

// 应用状态
const state = {
  currentVideo: null,
  currentAudio: null,
  videoClips: [],
  audioClips: [],
  textOverlays: [],
  timeline: {
    duration: 0,
    currentTime: 0,
    zoom: 1,
    tracks: {
      video: [],
      audio: [],
      text: []
    }
  },
  playback: {
    isPlaying: false,
    volume: 1,
    isMuted: false
  },
  selection: {
    inPoint: 0,
    outPoint: 0,
    selectedClip: null
  },
  effects: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    filter: 'none'
  },
  history: {
    past: [],
    future: []
  },
  project: {
    path: null,
    modified: false
  }
};

// DOM 元素
const elements = {
  // 视频预览
  videoPreview: document.getElementById('videoPreview'),
  placeholderScreen: document.getElementById('placeholderScreen'),
  videoInfo: document.getElementById('videoInfo'),

  // 播放控制
  playPauseBtn: document.getElementById('playPauseBtn'),
  stopBtn: document.getElementById('stopBtn'),
  seekBar: document.getElementById('seekBar'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
  volumeSlider: document.getElementById('volumeSlider'),
  muteBtn: document.getElementById('muteBtn'),

  // 工具栏
  importVideoBtn: document.getElementById('importVideoBtn'),
  importAudioBtn: document.getElementById('importAudioBtn'),
  exportBtn: document.getElementById('exportBtn'),
  saveProjectBtn: document.getElementById('saveProjectBtn'),
  openProjectBtn: document.getElementById('openProjectBtn'),
  newProjectBtn: document.getElementById('newProjectBtn'),
  undoBtn: document.getElementById('undoBtn'),
  redoBtn: document.getElementById('redoBtn'),

  // 剪辑工具
  inPoint: document.getElementById('inPoint'),
  outPoint: document.getElementById('outPoint'),
  setInPointBtn: document.getElementById('setInPointBtn'),
  setOutPointBtn: document.getElementById('setOutPointBtn'),
  cutBtn: document.getElementById('cutBtn'),
  splitBtn: document.getElementById('splitBtn'),
  trimStartBtn: document.getElementById('trimStartBtn'),
  trimEndBtn: document.getElementById('trimEndBtn'),
  deleteClipBtn: document.getElementById('deleteClipBtn'),

  // 特效
  brightnessSlider: document.getElementById('brightnessSlider'),
  contrastSlider: document.getElementById('contrastSlider'),
  saturationSlider: document.getElementById('saturationSlider'),
  brightnessValue: document.getElementById('brightnessValue'),
  contrastValue: document.getElementById('contrastValue'),
  saturationValue: document.getElementById('saturationValue'),
  applyEffectsBtn: document.getElementById('applyEffectsBtn'),

  // 文字
  textContent: document.getElementById('textContent'),
  fontSize: document.getElementById('fontSize'),
  textColor: document.getElementById('textColor'),
  textX: document.getElementById('textX'),
  textY: document.getElementById('textY'),
  textStartTime: document.getElementById('textStartTime'),
  textEndTime: document.getElementById('textEndTime'),
  addTextBtn: document.getElementById('addTextBtn'),
  textList: document.getElementById('textList'),

  // 列表
  videoList: document.getElementById('videoList'),
  audioList: document.getElementById('audioList'),
  clipsList: document.getElementById('clipsList'),

  // 时间轴
  timelineCanvas: document.getElementById('timelineCanvas'),
  playhead: document.getElementById('playhead'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  fitTimelineBtn: document.getElementById('fitTimelineBtn'),

  // 模态框
  progressModal: document.getElementById('progressModal'),
  exportProgress: document.getElementById('exportProgress'),
  progressText: document.getElementById('progressText'),
  cancelExportBtn: document.getElementById('cancelExportBtn'),

  // 提示
  toast: document.getElementById('toast')
};

// 初始化
function init() {
  setupEventListeners();
  setupKeyboardShortcuts();
  initializeTimeline();
  loadPreferences();
  showToast('欢迎使用 Video Editor');
}

// 设置事件监听器
function setupEventListeners() {
  // 标签页切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      switchTab(e.currentTarget.closest('.panel-tabs'), tab);
    });
  });

  // 导入视频
  elements.importVideoBtn.addEventListener('click', importVideo);

  // 导入音频
  elements.importAudioBtn.addEventListener('click', importAudio);

  // 播放控制
  elements.playPauseBtn.addEventListener('click', togglePlayPause);
  elements.stopBtn.addEventListener('click', stopPlayback);
  elements.seekBar.addEventListener('input', seek);
  elements.volumeSlider.addEventListener('input', changeVolume);
  elements.muteBtn.addEventListener('click', toggleMute);

  // 视频事件
  elements.videoPreview.addEventListener('timeupdate', updateTimeDisplay);
  elements.videoPreview.addEventListener('loadedmetadata', onVideoLoaded);
  elements.videoPreview.addEventListener('ended', onVideoEnded);

  // 剪辑工具
  elements.setInPointBtn.addEventListener('click', setInPoint);
  elements.setOutPointBtn.addEventListener('click', setOutPoint);
  elements.cutBtn.addEventListener('click', cutClip);
  elements.splitBtn.addEventListener('click', splitClip);
  elements.trimStartBtn.addEventListener('click', trimStart);
  elements.trimEndBtn.addEventListener('click', trimEnd);
  elements.deleteClipBtn.addEventListener('click', deleteClip);

  // 特效
  elements.brightnessSlider.addEventListener('input', updateEffectValue);
  elements.contrastSlider.addEventListener('input', updateEffectValue);
  elements.saturationSlider.addEventListener('input', updateEffectValue);
  elements.applyEffectsBtn.addEventListener('click', applyEffects);

  // 特效预设
  document.querySelectorAll('.effect-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const effect = e.currentTarget.dataset.effect;
      applyEffectPreset(effect);
    });
  });

  // 文字
  elements.addTextBtn.addEventListener('click', addText);

  // 导出
  elements.exportBtn.addEventListener('click', exportVideo);
  elements.cancelExportBtn.addEventListener('click', cancelExport);

  // 项目管理
  elements.saveProjectBtn.addEventListener('click', saveProject);
  elements.openProjectBtn.addEventListener('click', openProject);
  elements.newProjectBtn.addEventListener('click', newProject);

  // 撤销/重做
  elements.undoBtn.addEventListener('click', undo);
  elements.redoBtn.addEventListener('click', redo);

  // 时间轴控制
  elements.zoomInBtn.addEventListener('click', () => zoomTimeline(1.2));
  elements.zoomOutBtn.addEventListener('click', () => zoomTimeline(0.8));
  elements.fitTimelineBtn.addEventListener('click', fitTimeline);

  // IPC 事件
  ipcRenderer.on('export-progress', (event, data) => {
    updateExportProgress(data);
  });
}

// 设置键盘快捷键
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Z - 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z - 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }

    // Ctrl/Cmd + S - 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveProject();
    }

    // Ctrl/Cmd + E - 导出
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportVideo();
    }

    // Space - 播放/暂停
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      togglePlayPause();
    }

    // I - 设置入点
    if (e.key === 'i' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      setInPoint();
    }

    // O - 设置出点
    if (e.key === 'o' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      setOutPoint();
    }

    // C - 剪切
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
      e.preventDefault();
      cutClip();
    }

    // Delete - 删除选中片段
    if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      deleteClip();
    }
  });
}

// 标签页切换
function switchTab(container, tabName) {
  const parent = container.parentElement;

  // 更新按钮状态
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 更新内容显示
  parent.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.dataset.content === tabName);
  });
}

// 导入视频
async function importVideo() {
  try {
    const result = await ipcRenderer.invoke('open-video-file');

    if (result) {
      state.currentVideo = result;
      loadVideoToPreview(result.path);
      addVideoToList(result);
      enableControls();
      updateVideoInfo(result);
      showToast(`已导入: ${result.name}`);

      // 添加到历史记录
      saveToHistory();
    }
  } catch (error) {
    console.error('导入视频失败:', error);
    showToast('导入视频失败: ' + error.message, 'error');
  }
}

// 导入音频
async function importAudio() {
  try {
    const result = await ipcRenderer.invoke('open-audio-file');

    if (result) {
      state.currentAudio = result;
      addAudioToList(result);
      showToast(`已导入音频: ${result.name}`);
      saveToHistory();
    }
  } catch (error) {
    console.error('导入音频失败:', error);
    showToast('导入音频失败: ' + error.message, 'error');
  }
}

// 加载视频到预览
function loadVideoToPreview(videoPath) {
  elements.videoPreview.src = videoPath;
  elements.placeholderScreen.style.display = 'none';
  elements.videoPreview.style.display = 'block';
  elements.videoInfo.style.display = 'flex';
}

// 添加视频到列表
function addVideoToList(video) {
  const emptyState = elements.videoList.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  const item = document.createElement('div');
  item.className = 'media-item';
  item.innerHTML = `
    <div class="media-thumbnail">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
      </svg>
    </div>
    <div class="media-info">
      <div class="media-name">${video.name}</div>
      <div class="media-meta">${formatDuration(video.duration)} • ${video.width}x${video.height}</div>
    </div>
    <button class="btn-icon media-action" onclick="loadVideoToPreview('${video.path}')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    </button>
  `;

  elements.videoList.appendChild(item);
  state.videoClips.push(video);
}

// 添加音频到列表
function addAudioToList(audio) {
  const emptyState = elements.audioList.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  const item = document.createElement('div');
  item.className = 'media-item';
  item.innerHTML = `
    <div class="media-thumbnail">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    </div>
    <div class="media-info">
      <div class="media-name">${audio.name}</div>
      <div class="media-meta">${formatDuration(audio.duration)}</div>
    </div>
  `;

  elements.audioList.appendChild(item);
  state.audioClips.push(audio);
}

// 更新视频信息显示
function updateVideoInfo(video) {
  document.getElementById('infoFileName').textContent = video.name;
  document.getElementById('infoResolution').textContent = `${video.width}x${video.height}`;
  document.getElementById('infoDuration').textContent = formatDuration(video.duration);
  document.getElementById('infoFPS').textContent = `${video.fps.toFixed(2)} fps`;
}

// 启用控制按钮
function enableControls() {
  elements.playPauseBtn.disabled = false;
  elements.stopBtn.disabled = false;
  elements.seekBar.disabled = false;
  elements.setInPointBtn.disabled = false;
  elements.setOutPointBtn.disabled = false;
  elements.cutBtn.disabled = false;
  elements.splitBtn.disabled = false;
  elements.trimStartBtn.disabled = false;
  elements.trimEndBtn.disabled = false;
  elements.deleteClipBtn.disabled = false;
  elements.inPoint.disabled = false;
  elements.outPoint.disabled = false;
}

// 播放/暂停
function togglePlayPause() {
  if (!state.currentVideo) return;

  if (elements.videoPreview.paused) {
    elements.videoPreview.play();
    state.playback.isPlaying = true;
    document.getElementById('playIcon').style.display = 'none';
    document.getElementById('pauseIcon').style.display = 'block';
  } else {
    elements.videoPreview.pause();
    state.playback.isPlaying = false;
    document.getElementById('playIcon').style.display = 'block';
    document.getElementById('pauseIcon').style.display = 'none';
  }
}

// 停止播放
function stopPlayback() {
  elements.videoPreview.pause();
  elements.videoPreview.currentTime = 0;
  state.playback.isPlaying = false;
  document.getElementById('playIcon').style.display = 'block';
  document.getElementById('pauseIcon').style.display = 'none';
}

// 跳转播放位置
function seek() {
  const time = (elements.seekBar.value / 100) * elements.videoPreview.duration;
  elements.videoPreview.currentTime = time;
}

// 更新时间显示
function updateTimeDisplay() {
  const current = elements.videoPreview.currentTime;
  const duration = elements.videoPreview.duration;

  elements.currentTime.textContent = formatTime(current);
  elements.totalTime.textContent = formatTime(duration);

  const progress = (current / duration) * 100;
  elements.seekBar.value = progress;

  // 更新时间轴播放头
  updatePlayhead(current);
}

// 视频加载完成
function onVideoLoaded() {
  const duration = elements.videoPreview.duration;
  state.timeline.duration = duration;
  elements.outPoint.value = duration.toFixed(2);
  state.selection.outPoint = duration;
  updateTimeline();
}

// 视频播放结束
function onVideoEnded() {
  state.playback.isPlaying = false;
  document.getElementById('playIcon').style.display = 'block';
  document.getElementById('pauseIcon').style.display = 'none';
}

// 改变音量
function changeVolume() {
  const volume = elements.volumeSlider.value / 100;
  elements.videoPreview.volume = volume;
  state.playback.volume = volume;

  if (volume === 0) {
    state.playback.isMuted = true;
  } else {
    state.playback.isMuted = false;
  }
}

// 静音切换
function toggleMute() {
  if (state.playback.isMuted) {
    elements.videoPreview.volume = state.playback.volume;
    elements.volumeSlider.value = state.playback.volume * 100;
    state.playback.isMuted = false;
  } else {
    elements.videoPreview.volume = 0;
    elements.volumeSlider.value = 0;
    state.playback.isMuted = true;
  }
}

// 设置入点
function setInPoint() {
  const currentTime = elements.videoPreview.currentTime;
  elements.inPoint.value = currentTime.toFixed(2);
  state.selection.inPoint = currentTime;
  showToast(`入点设置为: ${formatTime(currentTime)}`);
  updateTimeline();
}

// 设置出点
function setOutPoint() {
  const currentTime = elements.videoPreview.currentTime;
  elements.outPoint.value = currentTime.toFixed(2);
  state.selection.outPoint = currentTime;
  showToast(`出点设置为: ${formatTime(currentTime)}`);
  updateTimeline();
}

// 剪切片段
function cutClip() {
  const inPoint = parseFloat(elements.inPoint.value);
  const outPoint = parseFloat(elements.outPoint.value);

  if (outPoint <= inPoint) {
    showToast('出点必须大于入点', 'error');
    return;
  }

  if (!state.currentVideo) {
    showToast('请先导入视频', 'error');
    return;
  }

  const clip = {
    id: Date.now(),
    source: state.currentVideo.path,
    name: `片段 ${state.timeline.tracks.video.length + 1}`,
    startTime: inPoint,
    endTime: outPoint,
    duration: outPoint - inPoint,
    track: 0
  };

  state.timeline.tracks.video.push(clip);
  updateClipsList();
  updateTimeline();
  showToast('片段已添加到时间轴');
  saveToHistory();
}

// 在当前位置分割
function splitClip() {
  const currentTime = elements.videoPreview.currentTime;
  showToast(`在 ${formatTime(currentTime)} 处分割`, 'info');
  // 这里可以实现更复杂的分割逻辑
}

// 修剪开头
function trimStart() {
  const currentTime = elements.videoPreview.currentTime;
  elements.inPoint.value = currentTime.toFixed(2);
  state.selection.inPoint = currentTime;
  showToast(`已修剪开头至: ${formatTime(currentTime)}`);
  updateTimeline();
}

// 修剪结尾
function trimEnd() {
  const currentTime = elements.videoPreview.currentTime;
  elements.outPoint.value = currentTime.toFixed(2);
  state.selection.outPoint = currentTime;
  showToast(`已修剪结尾至: ${formatTime(currentTime)}`);
  updateTimeline();
}

// 删除片段
function deleteClip() {
  if (state.selection.selectedClip) {
    const index = state.timeline.tracks.video.indexOf(state.selection.selectedClip);
    if (index > -1) {
      state.timeline.tracks.video.splice(index, 1);
      state.selection.selectedClip = null;
      updateClipsList();
      updateTimeline();
      showToast('片段已删除');
      saveToHistory();
    }
  } else {
    showToast('请先选择要删除的片段', 'error');
  }
}

// 更新片段列表
function updateClipsList() {
  const emptyState = elements.clipsList.querySelector('.empty-state');

  if (state.timeline.tracks.video.length === 0) {
    if (!emptyState) {
      elements.clipsList.innerHTML = '<div class="empty-state"><p>时间轴为空</p></div>';
    }
    return;
  }

  if (emptyState) {
    emptyState.remove();
  }

  elements.clipsList.innerHTML = '';

  state.timeline.tracks.video.forEach((clip, index) => {
    const item = document.createElement('div');
    item.className = 'clip-item';
    if (state.selection.selectedClip === clip) {
      item.classList.add('selected');
    }

    item.innerHTML = `
      <div class="clip-info">
        <div class="clip-name">${clip.name}</div>
        <div class="clip-time">${formatTime(clip.startTime)} - ${formatTime(clip.endTime)}</div>
      </div>
      <button class="btn-icon" onclick="removeClip(${index})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    item.addEventListener('click', () => selectClip(clip));
    elements.clipsList.appendChild(item);
  });
}

// 选择片段
function selectClip(clip) {
  state.selection.selectedClip = clip;
  updateClipsList();

  // 跳转到片段开始位置
  elements.videoPreview.currentTime = clip.startTime;
}

// 移除片段
window.removeClip = function(index) {
  state.timeline.tracks.video.splice(index, 1);
  updateClipsList();
  updateTimeline();
  showToast('片段已删除');
  saveToHistory();
};

// 更新特效值显示
function updateEffectValue(e) {
  const slider = e.target;
  const value = slider.value;
  const valueDisplay = document.getElementById(slider.id.replace('Slider', 'Value'));

  if (valueDisplay) {
    valueDisplay.textContent = value;
  }

  // 更新状态
  if (slider.id === 'brightnessSlider') {
    state.effects.brightness = parseInt(value);
  } else if (slider.id === 'contrastSlider') {
    state.effects.contrast = parseInt(value);
  } else if (slider.id === 'saturationSlider') {
    state.effects.saturation = parseInt(value);
  }
}

// 应用特效预设
function applyEffectPreset(effect) {
  state.effects.filter = effect;

  document.querySelectorAll('.effect-item').forEach(item => {
    item.classList.toggle('active', item.dataset.effect === effect);
  });

  showToast(`已选择 ${effect} 滤镜`);
}

// 应用特效
function applyEffects() {
  showToast('特效将在导出时应用', 'info');
}

// 添加文字
function addText() {
  const content = elements.textContent.value.trim();

  if (!content) {
    showToast('请输入文字内容', 'error');
    return;
  }

  const text = {
    id: Date.now(),
    content: content,
    fontSize: parseInt(elements.fontSize.value),
    color: elements.textColor.value,
    x: parseInt(elements.textX.value),
    y: parseInt(elements.textY.value),
    startTime: parseFloat(elements.textStartTime.value),
    endTime: parseFloat(elements.textEndTime.value)
  };

  state.textOverlays.push(text);
  updateTextList();
  showToast('文字已添加');

  // 清空输入
  elements.textContent.value = '';
  saveToHistory();
}

// 更新文字列表
function updateTextList() {
  const emptyState = elements.textList.querySelector('.empty-state');

  if (state.textOverlays.length === 0) {
    if (!emptyState) {
      elements.textList.innerHTML = '<div class="empty-state"><p>暂无文字</p></div>';
    }
    return;
  }

  if (emptyState) {
    emptyState.remove();
  }

  elements.textList.innerHTML = '';

  state.textOverlays.forEach((text, index) => {
    const item = document.createElement('div');
    item.className = 'text-item';
    item.innerHTML = `
      <div class="text-preview" style="color: ${text.color}; font-size: 14px;">
        ${text.content}
      </div>
      <div class="text-meta">
        ${formatTime(text.startTime)} - ${formatTime(text.endTime)}
      </div>
      <button class="btn-icon" onclick="removeText(${index})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    elements.textList.appendChild(item);
  });
}

// 移除文字
window.removeText = function(index) {
  state.textOverlays.splice(index, 1);
  updateTextList();
  showToast('文字已删除');
  saveToHistory();
};

// 导出视频
async function exportVideo() {
  if (!state.currentVideo) {
    showToast('请先导入视频', 'error');
    return;
  }

  try {
    const outputPath = await ipcRenderer.invoke('export-video', {
      defaultPath: 'output.mp4'
    });

    if (!outputPath) return;

    // 显示进度对话框
    elements.progressModal.style.display = 'flex';

    const processOptions = {
      inputPath: state.currentVideo.path,
      outputPath: outputPath,
      startTime: state.selection.inPoint,
      endTime: state.selection.outPoint,
      filters: state.effects,
      texts: state.textOverlays
    };

    // 如果有音频，添加到选项
    if (state.currentAudio) {
      processOptions.audioPath = state.currentAudio.path;
    }

    const result = await ipcRenderer.invoke('process-video', processOptions);

    elements.progressModal.style.display = 'none';

    if (result.success) {
      showToast('视频导出成功!', 'success');
    }
  } catch (error) {
    console.error('导出视频失败:', error);
    elements.progressModal.style.display = 'none';
    showToast('导出失败: ' + error.message, 'error');
  }
}

// 更新导出进度
function updateExportProgress(data) {
  const percent = Math.round(data.percent || 0);
  elements.exportProgress.style.width = `${percent}%`;
  elements.progressText.textContent = `${percent}%`;
}

// 取消导出
function cancelExport() {
  elements.progressModal.style.display = 'none';
  showToast('导出已取消');
}

// 保存项目
async function saveProject() {
  const projectData = {
    version: '1.0',
    created: new Date().toISOString(),
    video: state.currentVideo,
    audio: state.currentAudio,
    clips: state.timeline.tracks.video,
    texts: state.textOverlays,
    effects: state.effects,
    selection: state.selection
  };

  try {
    const result = await ipcRenderer.invoke('save-project', projectData);

    if (result.success) {
      state.project.path = result.path;
      state.project.modified = false;
      showToast('项目已保存', 'success');
    }
  } catch (error) {
    console.error('保存项目失败:', error);
    showToast('保存失败: ' + error.message, 'error');
  }
}

// 打开项目
async function openProject() {
  try {
    const result = await ipcRenderer.invoke('open-project');

    if (result.success) {
      const data = result.data;

      // 恢复项目状态
      if (data.video) {
        state.currentVideo = data.video;
        loadVideoToPreview(data.video.path);
        addVideoToList(data.video);
        enableControls();
        updateVideoInfo(data.video);
      }

      if (data.audio) {
        state.currentAudio = data.audio;
        addAudioToList(data.audio);
      }

      if (data.clips) {
        state.timeline.tracks.video = data.clips;
        updateClipsList();
      }

      if (data.texts) {
        state.textOverlays = data.texts;
        updateTextList();
      }

      if (data.effects) {
        state.effects = data.effects;
      }

      if (data.selection) {
        state.selection = data.selection;
        elements.inPoint.value = data.selection.inPoint;
        elements.outPoint.value = data.selection.outPoint;
      }

      state.project.path = result.path;
      state.project.modified = false;
      updateTimeline();
      showToast('项目已加载', 'success');
    }
  } catch (error) {
    console.error('打开项目失败:', error);
    showToast('打开失败: ' + error.message, 'error');
  }
}

// 新建项目
function newProject() {
  if (state.project.modified) {
    if (!confirm('当前项目尚未保存，是否继续？')) {
      return;
    }
  }

  // 重置状态
  state.currentVideo = null;
  state.currentAudio = null;
  state.videoClips = [];
  state.audioClips = [];
  state.textOverlays = [];
  state.timeline.tracks.video = [];
  state.timeline.tracks.audio = [];
  state.timeline.tracks.text = [];
  state.selection.inPoint = 0;
  state.selection.outPoint = 0;
  state.selection.selectedClip = null;
  state.effects = { brightness: 0, contrast: 0, saturation: 0, filter: 'none' };
  state.project.path = null;
  state.project.modified = false;

  // 重置UI
  elements.videoPreview.src = '';
  elements.videoPreview.style.display = 'none';
  elements.placeholderScreen.style.display = 'flex';
  elements.videoInfo.style.display = 'none';
  elements.videoList.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>点击"导入"添加视频</p></div>';
  elements.audioList.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>点击"导入"添加音频</p></div>';
  elements.clipsList.innerHTML = '<div class="empty-state"><p>时间轴为空</p></div>';
  elements.textList.innerHTML = '<div class="empty-state"><p>暂无文字</p></div>';

  updateTimeline();
  showToast('已创建新项目');
}

// 撤销
function undo() {
  if (state.history.past.length > 0) {
    const previousState = state.history.past.pop();
    state.history.future.push(getCurrentState());
    restoreState(previousState);
    updateUndoRedoButtons();
    showToast('已撤销');
  }
}

// 重做
function redo() {
  if (state.history.future.length > 0) {
    const nextState = state.history.future.pop();
    state.history.past.push(getCurrentState());
    restoreState(nextState);
    updateUndoRedoButtons();
    showToast('已重做');
  }
}

// 保存到历史记录
function saveToHistory() {
  state.history.past.push(getCurrentState());
  state.history.future = [];
  state.project.modified = true;
  updateUndoRedoButtons();

  // 限制历史记录数量
  if (state.history.past.length > 50) {
    state.history.past.shift();
  }
}

// 获取当前状态
function getCurrentState() {
  return JSON.parse(JSON.stringify({
    videoClips: state.videoClips,
    audioClips: state.audioClips,
    textOverlays: state.textOverlays,
    timeline: state.timeline,
    selection: state.selection,
    effects: state.effects
  }));
}

// 恢复状态
function restoreState(savedState) {
  state.videoClips = savedState.videoClips;
  state.audioClips = savedState.audioClips;
  state.textOverlays = savedState.textOverlays;
  state.timeline = savedState.timeline;
  state.selection = savedState.selection;
  state.effects = savedState.effects;

  updateClipsList();
  updateTextList();
  updateTimeline();
}

// 更新撤销/重做按钮
function updateUndoRedoButtons() {
  elements.undoBtn.disabled = state.history.past.length === 0;
  elements.redoBtn.disabled = state.history.future.length === 0;
}

// 时间轴相关函数
function initializeTimeline() {
  const canvas = elements.timelineCanvas;
  const ctx = canvas.getContext('2d');

  // 设置 canvas 大小
  resizeTimeline();

  // 窗口大小改变时调整
  window.addEventListener('resize', resizeTimeline);
}

function resizeTimeline() {
  const canvas = elements.timelineCanvas;
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = 150;
  updateTimeline();
}

function updateTimeline() {
  const canvas = elements.timelineCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 背景
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // 绘制时间刻度
  drawTimeRuler(ctx, width, height);

  // 绘制轨道
  drawTracks(ctx, width, height);

  // 绘制片段
  drawClips(ctx, width, height);
}

function drawTimeRuler(ctx, width, height) {
  const duration = state.timeline.duration || 60;
  const zoom = state.timeline.zoom;
  const pixelsPerSecond = (width / duration) * zoom;

  ctx.strokeStyle = '#333';
  ctx.fillStyle = '#888';
  ctx.font = '10px Arial';

  // 绘制主刻度
  for (let i = 0; i <= duration; i += 5) {
    const x = i * pixelsPerSecond;
    if (x > width) break;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 10);
    ctx.stroke();

    ctx.fillText(formatTime(i), x + 2, 20);
  }

  // 绘制次刻度
  ctx.strokeStyle = '#282828';
  for (let i = 0; i <= duration; i++) {
    const x = i * pixelsPerSecond;
    if (x > width) break;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 5);
    ctx.stroke();
  }
}

function drawTracks(ctx, width, height) {
  const trackHeight = 40;
  const trackY = [30, 75, 120];

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  trackY.forEach(y => {
    ctx.strokeRect(0, y, width, trackHeight);
  });
}

function drawClips(ctx, width, height) {
  const duration = state.timeline.duration || 60;
  const zoom = state.timeline.zoom;
  const pixelsPerSecond = (width / duration) * zoom;
  const trackHeight = 40;
  const trackY = 30;

  state.timeline.tracks.video.forEach((clip, index) => {
    const x = clip.startTime * pixelsPerSecond;
    const clipWidth = (clip.endTime - clip.startTime) * pixelsPerSecond;

    // 绘制片段背景
    ctx.fillStyle = clip === state.selection.selectedClip ? '#4a9eff' : '#2a7fff';
    ctx.fillRect(x, trackY + 2, clipWidth, trackHeight - 4);

    // 绘制片段边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, trackY + 2, clipWidth, trackHeight - 4);

    // 绘制片段名称
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(clip.name, x + 5, trackY + 22);
  });
}

function updatePlayhead(currentTime) {
  const duration = state.timeline.duration || 60;
  const zoom = state.timeline.zoom;
  const canvas = elements.timelineCanvas;
  const pixelsPerSecond = (canvas.width / duration) * zoom;
  const x = currentTime * pixelsPerSecond;

  elements.playhead.style.left = `${x}px`;
}

function zoomTimeline(factor) {
  state.timeline.zoom *= factor;
  state.timeline.zoom = Math.max(0.1, Math.min(state.timeline.zoom, 10));
  updateTimeline();
}

function fitTimeline() {
  state.timeline.zoom = 1;
  updateTimeline();
}

// 工具函数
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}

function showToast(message, type = 'info') {
  elements.toast.textContent = message;
  elements.toast.className = `toast toast-${type} show`;

  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

function loadPreferences() {
  // 从 localStorage 加载用户偏好设置
  const savedVolume = localStorage.getItem('volume');
  if (savedVolume) {
    elements.volumeSlider.value = savedVolume;
    elements.videoPreview.volume = savedVolume / 100;
  }
}

function savePreferences() {
  localStorage.setItem('volume', elements.volumeSlider.value);
}

// 页面卸载时保存偏好设置
window.addEventListener('beforeunload', () => {
  savePreferences();

  // 如果项目有未保存的更改，提示用户
  if (state.project.modified) {
    const message = '项目有未保存的更改，确定要离开吗？';
    event.returnValue = message;
    return message;
  }
});

// 启动应用
init();
