// 編輯器邏輯
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let imageData = null;
let currentAiResult = '';

// 按鈕
const saveBtn = document.getElementById('saveBtn');
const copyBtn = document.getElementById('copyBtn');
const closeBtn = document.getElementById('closeBtn');
const ocrBtn = document.getElementById('ocrBtn');
const describeBtn = document.getElementById('describeBtn');

// AI 面板元素
const aiResultPanel = document.getElementById('aiResultPanel');
const aiResultContent = document.getElementById('aiResultContent');
const closeAiPanelBtn = document.getElementById('closeAiPanelBtn');
const copyAiResultBtn = document.getElementById('copyAiResultBtn');
const translateBtn = document.getElementById('translateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// 載入圖片
window.electronAPI.onLoadImage((event, dataUrl) => {
  imageData = dataUrl;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
});

// 儲存
saveBtn.addEventListener('click', async () => {
  const dataUrl = canvas.toDataURL('image/png');
  const result = await window.electronAPI.saveScreenshot(dataUrl);

  if (result.success) {
    alert(`截圖已儲存至: ${result.path}`);
    window.close();
  } else {
    alert(`儲存失敗: ${result.error}`);
  }
});

// 複製
copyBtn.addEventListener('click', async () => {
  const dataUrl = canvas.toDataURL('image/png');
  await window.electronAPI.copyToClipboard(dataUrl);
  alert('已複製到剪貼簿');
});

// 關閉
closeBtn.addEventListener('click', () => {
  window.close();
});

// ESC 鍵關閉
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
});

// Ctrl+S 儲存
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveBtn.click();
  }
});

// Ctrl+C 複製
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault();
    copyBtn.click();
  }
});

// AI 功能

// 顯示載入狀態
function showLoading(text = 'AI 處理中...') {
  loadingText.textContent = text;
  loadingOverlay.style.display = 'flex';
}

// 隱藏載入狀態
function hideLoading() {
  loadingOverlay.style.display = 'none';
}

// 顯示 AI 結果
function showAiResult(result) {
  currentAiResult = result;
  aiResultContent.textContent = result;
  aiResultPanel.style.display = 'block';
}

// OCR 文字識別
ocrBtn.addEventListener('click', async () => {
  if (!imageData) {
    alert('請先載入圖片');
    return;
  }

  try {
    showLoading('正在識別文字...');
    const dataUrl = canvas.toDataURL('image/png');
    const result = await window.electronAPI.recognizeText(dataUrl);

    hideLoading();

    if (result.success) {
      showAiResult(result.result);
    } else {
      alert(`OCR 識別失敗: ${result.error}`);
    }
  } catch (error) {
    hideLoading();
    alert(`錯誤: ${error.message}`);
  }
});

// 圖片描述
describeBtn.addEventListener('click', async () => {
  if (!imageData) {
    alert('請先載入圖片');
    return;
  }

  try {
    showLoading('正在生成圖片描述...');
    const dataUrl = canvas.toDataURL('image/png');
    const result = await window.electronAPI.describeImage(dataUrl);

    hideLoading();

    if (result.success) {
      showAiResult(result.result);
    } else {
      alert(`圖片描述失敗: ${result.error}`);
    }
  } catch (error) {
    hideLoading();
    alert(`錯誤: ${error.message}`);
  }
});

// 關閉 AI 面板
closeAiPanelBtn.addEventListener('click', () => {
  aiResultPanel.style.display = 'none';
});

// 複製 AI 結果
copyAiResultBtn.addEventListener('click', async () => {
  if (currentAiResult) {
    await navigator.clipboard.writeText(currentAiResult);
    alert('已複製到剪貼簿');
  }
});

// 翻譯結果
translateBtn.addEventListener('click', async () => {
  if (!currentAiResult) {
    alert('沒有可翻譯的內容');
    return;
  }

  const targetLang = prompt('請輸入目標語言（en: 英文, ja: 日文, ko: 韓文）:', 'en');
  if (!targetLang) return;

  try {
    showLoading('正在翻譯...');
    const result = await window.electronAPI.translateText(currentAiResult, targetLang);

    hideLoading();

    if (result.success) {
      showAiResult(result.result);
    } else {
      alert(`翻譯失敗: ${result.error}`);
    }
  } catch (error) {
    hideLoading();
    alert(`錯誤: ${error.message}`);
  }
});
