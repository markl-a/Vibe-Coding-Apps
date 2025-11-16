// 編輯器邏輯
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let imageData = null;

// 按鈕
const saveBtn = document.getElementById('saveBtn');
const copyBtn = document.getElementById('copyBtn');
const closeBtn = document.getElementById('closeBtn');

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
