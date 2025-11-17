const { ipcRenderer } = require('electron');

// 全局变量
let synth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;
let isPlaying = false;
let audioContext = null;
let analyser = null;
let animationId = null;
let waveformPaused = false;

// DOM 元素
const elements = {
  // 文本和选择器
  textInput: document.getElementById('textInput'),
  voiceSelect: document.getElementById('voiceSelect'),

  // 滑块
  rateSlider: document.getElementById('rateSlider'),
  pitchSlider: document.getElementById('pitchSlider'),
  volumeSlider: document.getElementById('volumeSlider'),

  // 值显示
  rateValue: document.getElementById('rateValue'),
  pitchValue: document.getElementById('pitchValue'),
  volumeValue: document.getElementById('volumeValue'),

  // 按钮
  previewBtn: document.getElementById('previewBtn'),
  stopBtn: document.getElementById('stopBtn'),
  exportBtn: document.getElementById('exportBtn'),
  resetParams: document.getElementById('resetParams'),
  refreshVoicesBtn: document.getElementById('refreshVoicesBtn'),
  clearText: document.getElementById('clearText'),
  insertSSML: document.getElementById('insertSSML'),
  pauseWaveform: document.getElementById('pauseWaveform'),

  // 复选框
  enableSSML: document.getElementById('enableSSML'),

  // 信息显示
  charCount: document.getElementById('charCount'),
  estimatedDuration: document.getElementById('estimatedDuration'),
  voiceInfo: document.getElementById('voiceInfo'),
  voiceLang: document.getElementById('voiceLang'),
  voiceType: document.getElementById('voiceType'),
  statusText: document.getElementById('statusText'),
  statusIndicator: document.getElementById('statusIndicator'),
  voiceCount: document.getElementById('voiceCount'),
  waveformStatus: document.getElementById('waveformStatus'),

  // 画布
  waveform: document.getElementById('waveform'),

  // 加载覆盖层
  loadingOverlay: document.getElementById('loadingOverlay')
};

// 初始化
function init() {
  loadVoices();
  setupEventListeners();
  setupCanvas();
  updateCharCount();

  // 检查语音合成支持
  if (!synth) {
    showError('您的浏览器不支持语音合成功能');
    return;
  }

  // 等待语音列表加载
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  setStatus('就绪', 'ready');
}

// 加载可用语音
function loadVoices() {
  voices = synth.getVoices();

  if (voices.length === 0) {
    setTimeout(loadVoices, 100);
    return;
  }

  populateVoiceList();
  elements.voiceCount.textContent = `可用音色: ${voices.length}`;
}

// 填充语音列表
function populateVoiceList() {
  elements.voiceSelect.innerHTML = '';

  // 按语言分组
  const grouped = {};
  voices.forEach(voice => {
    const lang = voice.lang.split('-')[0];
    if (!grouped[lang]) {
      grouped[lang] = [];
    }
    grouped[lang].push(voice);
  });

  // 语言名称映射
  const langNames = {
    'zh': '中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'it': 'Italiano',
    'ru': 'Русский'
  };

  // 创建分组选项
  Object.keys(grouped).sort().forEach(lang => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = langNames[lang] || lang;

    grouped[lang].forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index + '-' + lang;
      option.textContent = `${voice.name} ${voice.localService ? '(本地)' : '(在线)'}`;
      option.dataset.voiceName = voice.name;
      optgroup.appendChild(option);
    });

    elements.voiceSelect.appendChild(optgroup);
  });

  // 选择默认语音（优先中文）
  const defaultVoice = voices.findIndex(v => v.lang.startsWith('zh'));
  if (defaultVoice !== -1) {
    const lang = voices[defaultVoice].lang.split('-')[0];
    elements.voiceSelect.value = defaultVoice + '-' + lang;
  }

  updateVoiceInfo();
}

// 更新语音信息
function updateVoiceInfo() {
  const selectedVoice = getSelectedVoice();
  if (selectedVoice) {
    elements.voiceLang.textContent = selectedVoice.lang;
    elements.voiceType.textContent = selectedVoice.localService ? '本地语音' : '在线语音';
  }
}

// 获取选中的语音
function getSelectedVoice() {
  const selectedOption = elements.voiceSelect.selectedOptions[0];
  if (!selectedOption) return null;

  const voiceName = selectedOption.dataset.voiceName;
  return voices.find(v => v.name === voiceName);
}

// 设置事件监听器
function setupEventListeners() {
  // 滑块事件
  elements.rateSlider.addEventListener('input', (e) => {
    elements.rateValue.textContent = e.target.value + 'x';
    updateEstimatedDuration();
  });

  elements.pitchSlider.addEventListener('input', (e) => {
    elements.pitchValue.textContent = e.target.value;
  });

  elements.volumeSlider.addEventListener('input', (e) => {
    elements.volumeValue.textContent = e.target.value + '%';
  });

  // 按钮事件
  elements.previewBtn.addEventListener('click', previewSpeech);
  elements.stopBtn.addEventListener('click', stopSpeech);
  elements.exportBtn.addEventListener('click', exportAudio);
  elements.resetParams.addEventListener('click', resetParameters);
  elements.refreshVoicesBtn.addEventListener('click', loadVoices);
  elements.clearText.addEventListener('click', clearText);
  elements.insertSSML.addEventListener('click', insertSSMLTemplate);
  elements.pauseWaveform.addEventListener('click', toggleWaveform);

  // 文本输入事件
  elements.textInput.addEventListener('input', updateCharCount);

  // 语音选择事件
  elements.voiceSelect.addEventListener('change', updateVoiceInfo);

  // 快速文本
  document.querySelectorAll('.quick-text-item').forEach(item => {
    item.addEventListener('click', () => {
      elements.textInput.value = item.dataset.text;
      updateCharCount();
    });
  });

  // SSML 示例
  document.querySelectorAll('.ssml-example-item').forEach(item => {
    item.addEventListener('click', () => {
      elements.enableSSML.checked = true;
      elements.textInput.value = item.dataset.ssml;
      updateCharCount();
    });
  });

  // IPC 事件
  ipcRenderer.on('menu-preview', previewSpeech);
  ipcRenderer.on('menu-stop', stopSpeech);
  ipcRenderer.on('menu-export', exportAudio);
  ipcRenderer.on('menu-clear', clearText);
  ipcRenderer.on('menu-refresh-voices', loadVoices);
  ipcRenderer.on('menu-help', showHelp);
}

// 预览语音
function previewSpeech() {
  const text = elements.textInput.value.trim();

  if (!text) {
    showError('请输入要转换的文字');
    return;
  }

  // 停止当前播放
  if (isPlaying) {
    stopSpeech();
  }

  // 创建语音
  currentUtterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = getSelectedVoice();

  if (selectedVoice) {
    currentUtterance.voice = selectedVoice;
  }

  // 设置参数
  currentUtterance.rate = parseFloat(elements.rateSlider.value);
  currentUtterance.pitch = parseFloat(elements.pitchSlider.value);
  currentUtterance.volume = parseFloat(elements.volumeSlider.value) / 100;

  // 事件处理
  currentUtterance.onstart = () => {
    isPlaying = true;
    elements.previewBtn.disabled = true;
    elements.stopBtn.disabled = false;
    setStatus('正在播放...', 'playing');
    elements.waveformStatus.textContent = '播放中';
    startWaveformAnimation();
  };

  currentUtterance.onend = () => {
    isPlaying = false;
    elements.previewBtn.disabled = false;
    elements.stopBtn.disabled = true;
    setStatus('就绪', 'ready');
    elements.waveformStatus.textContent = '就绪';
    stopWaveformAnimation();
  };

  currentUtterance.onerror = (event) => {
    console.error('语音合成错误:', event);
    showError('语音合成失败: ' + event.error);
    stopSpeech();
  };

  // 播放
  synth.speak(currentUtterance);
}

// 停止语音
function stopSpeech() {
  synth.cancel();
  isPlaying = false;
  elements.previewBtn.disabled = false;
  elements.stopBtn.disabled = true;
  setStatus('已停止', 'ready');
  elements.waveformStatus.textContent = '已停止';
  stopWaveformAnimation();
}

// 导出音频
async function exportAudio() {
  const text = elements.textInput.value.trim();

  if (!text) {
    showError('请输入要转换的文字');
    return;
  }

  showLoading(true);
  setStatus('正在生成音频...', 'processing');

  try {
    // 使用 MediaRecorder 录制音频
    const audioData = await recordSpeech(text);

    if (!audioData) {
      throw new Error('音频生成失败');
    }

    // 保存文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultName = `voice-${timestamp}.wav`;

    const result = await ipcRenderer.invoke('save-audio', audioData, defaultName);

    if (result.success) {
      showSuccess(`音频已保存到: ${result.filePath}`);
      setStatus('导出成功', 'ready');
    } else if (!result.canceled) {
      throw new Error(result.error || '保存失败');
    } else {
      setStatus('已取消', 'ready');
    }
  } catch (error) {
    console.error('导出错误:', error);
    showError('导出音频失败: ' + error.message);
    setStatus('导出失败', 'error');
  } finally {
    showLoading(false);
  }
}

// 录制语音
function recordSpeech(text) {
  return new Promise((resolve, reject) => {
    // 创建音频上下文
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();

    // 创建语音
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getSelectedVoice();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = parseFloat(elements.rateSlider.value);
    utterance.pitch = parseFloat(elements.pitchSlider.value);
    utterance.volume = parseFloat(elements.volumeSlider.value) / 100;

    // MediaRecorder
    const mediaRecorder = new MediaRecorder(dest.stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };

    utterance.onstart = () => {
      mediaRecorder.start();
    };

    utterance.onend = () => {
      setTimeout(() => {
        mediaRecorder.stop();
        audioCtx.close();
      }, 500);
    };

    utterance.onerror = (event) => {
      mediaRecorder.stop();
      audioCtx.close();
      reject(new Error(event.error));
    };

    // 开始合成
    synth.speak(utterance);

    // 超时处理
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        audioCtx.close();
        reject(new Error('录制超时'));
      }
    }, 300000); // 5分钟超时
  });
}

// 重置参数
function resetParameters() {
  elements.rateSlider.value = 1;
  elements.pitchSlider.value = 1;
  elements.volumeSlider.value = 100;

  elements.rateValue.textContent = '1.0x';
  elements.pitchValue.textContent = '1.0';
  elements.volumeValue.textContent = '100%';

  updateEstimatedDuration();
}

// 清空文本
function clearText() {
  if (elements.textInput.value.trim() && !confirm('确定要清空文本吗？')) {
    return;
  }

  elements.textInput.value = '';
  updateCharCount();
}

// 插入 SSML 模板
function insertSSMLTemplate() {
  const template = `<speak>
  <p>在这里输入您的文本。</p>
  <break time="500ms"/>
  <p>这是<emphasis level="strong">强调</emphasis>的例子。</p>
  <p>语速控制：<prosody rate="slow">慢速</prosody>、<prosody rate="fast">快速</prosody></p>
  <p>音调控制：<prosody pitch="low">低音</prosody>、<prosody pitch="high">高音</prosody></p>
</speak>`;

  elements.textInput.value = template;
  elements.enableSSML.checked = true;
  updateCharCount();
}

// 更新字符计数
function updateCharCount() {
  const text = elements.textInput.value;
  elements.charCount.textContent = text.length;
  updateEstimatedDuration();
}

// 更新预计时长
function updateEstimatedDuration() {
  const text = elements.textInput.value;
  const charCount = text.length;
  const rate = parseFloat(elements.rateSlider.value);

  // 估算：中文约 3-4 字/秒，英文约 150-200 词/分钟
  const baseSpeed = 3.5; // 字/秒
  const duration = charCount / (baseSpeed * rate);

  if (duration < 60) {
    elements.estimatedDuration.textContent = Math.round(duration) + 's';
  } else {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    elements.estimatedDuration.textContent = `${minutes}m ${seconds}s`;
  }
}

// 设置画布
function setupCanvas() {
  const canvas = elements.waveform;
  const dpr = window.devicePixelRatio || 1;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 绘制初始波形
  drawWaveform();
}

// 绘制波形
function drawWaveform(dataArray = null) {
  const canvas = elements.waveform;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  // 背景
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, 0, width, height);

  // 中线
  ctx.strokeStyle = '#2a2a3e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  if (!dataArray) {
    // 绘制静态波形
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const y = height / 2 + Math.sin(i * 0.02) * 20;
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }

    ctx.stroke();
  } else {
    // 绘制实时波形
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }
}

// 开始波形动画
function startWaveformAnimation() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const animate = () => {
    if (!isPlaying || waveformPaused) {
      return;
    }

    animationId = requestAnimationFrame(animate);

    analyser.getByteTimeDomainData(dataArray);
    drawWaveform(dataArray);
  };

  animate();
}

// 停止波形动画
function stopWaveformAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  drawWaveform();
}

// 切换波形动画
function toggleWaveform() {
  waveformPaused = !waveformPaused;

  if (isPlaying && !waveformPaused) {
    startWaveformAnimation();
  }

  const icon = elements.pauseWaveform.querySelector('svg');
  if (waveformPaused) {
    icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  } else {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  }
}

// 设置状态
function setStatus(text, type = 'ready') {
  elements.statusText.textContent = text;

  const indicator = elements.statusIndicator;
  indicator.className = 'status-indicator';

  switch (type) {
    case 'playing':
      indicator.classList.add('status-playing');
      break;
    case 'processing':
      indicator.classList.add('status-processing');
      break;
    case 'error':
      indicator.classList.add('status-error');
      break;
    default:
      indicator.classList.add('status-ready');
  }
}

// 显示加载
function showLoading(show) {
  elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 显示错误
function showError(message) {
  ipcRenderer.invoke('show-message', {
    type: 'error',
    title: '错误',
    message: message
  });
}

// 显示成功
function showSuccess(message) {
  ipcRenderer.invoke('show-message', {
    type: 'info',
    title: '成功',
    message: message
  });
}

// 显示帮助
function showHelp() {
  const helpText = `Voice Generator 使用说明

1. 输入文本
   在文本区域输入要转换的文字

2. 选择音色
   从下拉列表选择所需的语音音色

3. 调节参数
   - 语速：控制说话快慢
   - 音调：控制音高
   - 音量：控制音量大小

4. 预览和导出
   - 点击"预览"试听效果
   - 点击"导出"保存为音频文件

5. SSML 支持
   启用 SSML 选项可使用高级标记
   增强语音表现力

快捷键：
- Ctrl/Cmd + P：预览
- Ctrl/Cmd + S：导出
- Ctrl/Cmd + L：清空`;

  ipcRenderer.invoke('show-message', {
    type: 'info',
    title: '使用说明',
    message: helpText
  });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  stopSpeech();
  if (audioContext) {
    audioContext.close();
  }
});
