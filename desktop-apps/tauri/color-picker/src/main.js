import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

const colorInput = document.getElementById('colorInput');
const colorDisplay = document.getElementById('colorDisplay');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const hslValue = document.getElementById('hslValue');
const complementary = document.getElementById('complementary');
const analogous = document.getElementById('analogous');
const triadic = document.getElementById('triadic');
const monochromatic = document.getElementById('monochromatic');
const colorHistory = document.getElementById('colorHistory');
const clearHistory = document.getElementById('clearHistory');
const notification = document.getElementById('notification');

let history = JSON.parse(localStorage.getItem('colorHistory') || '[]');

// 初始化
async function init() {
    await updateColor(colorInput.value);
    renderHistory();
}

// 更新顏色
async function updateColor(hex) {
    try {
        colorDisplay.style.background = hex;
        hexValue.value = hex.toUpperCase();

        // 轉換為 RGB
        const rgb = await invoke('hex_to_rgb', { hex });
        rgbValue.value = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

        // 轉換為 HSL
        const hsl = await invoke('convert_rgb_to_hsl', { r: rgb[0], g: rgb[1], b: rgb[2] });
        hslValue.value = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;

        // 生成配色方案
        await generatePalettes(hex);

        // 添加到歷史記錄
        addToHistory(hex);
    } catch (error) {
        console.error('Error updating color:', error);
    }
}

// 生成配色方案
async function generatePalettes(hex) {
    try {
        // 互補色
        const comp = await invoke('generate_complementary', { hex });
        renderColorRow(complementary, [hex, comp]);

        // 類似色
        const analog = await invoke('generate_analogous', { hex });
        renderColorRow(analogous, analog);

        // 三角色
        const tri = await invoke('generate_triadic', { hex });
        renderColorRow(triadic, tri);

        // 單色系
        const mono = await invoke('generate_monochromatic', { hex });
        renderColorRow(monochromatic, mono);
    } catch (error) {
        console.error('Error generating palettes:', error);
    }
}

// 渲染顏色行
function renderColorRow(container, colors) {
    container.innerHTML = colors.map(color => `
        <div class="color-swatch" style="background: ${color}" data-color="${color}">
            <span class="hex-label">${color}</span>
        </div>
    `).join('');

    // 添加點擊事件
    container.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', async () => {
            const color = swatch.getAttribute('data-color');
            colorInput.value = color;
            await updateColor(color);
        });
    });
}

// 添加到歷史記錄
function addToHistory(hex) {
    // 移除重複項
    history = history.filter(h => h !== hex);

    // 添加到開頭
    history.unshift(hex);

    // 限制數量
    if (history.length > 20) {
        history = history.slice(0, 20);
    }

    // 保存到 localStorage
    localStorage.setItem('colorHistory', JSON.stringify(history));

    renderHistory();
}

// 渲染歷史記錄
function renderHistory() {
    if (history.length === 0) {
        colorHistory.innerHTML = '<p class="empty-hint">尚無歷史記錄</p>';
        return;
    }

    colorHistory.innerHTML = history.map(color => `
        <div class="history-item" style="background: ${color}" data-color="${color}" title="${color}"></div>
    `).join('');

    // 添加點擊事件
    colorHistory.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', async () => {
            const color = item.getAttribute('data-color');
            colorInput.value = color;
            await updateColor(color);
        });
    });
}

// 顯示通知
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// 事件監聽器

colorInput.addEventListener('input', async (e) => {
    await updateColor(e.target.value);
});

// 複製按鈕
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-target');
        const target = document.getElementById(targetId);

        try {
            await writeText(target.value);
            showNotification('已複製到剪貼簿');
        } catch (error) {
            console.error('Copy failed:', error);
            showNotification('複製失敗');
        }
    });
});

// 清除歷史記錄
clearHistory.addEventListener('click', () => {
    if (confirm('確定要清除所有歷史記錄嗎？')) {
        history = [];
        localStorage.setItem('colorHistory', JSON.stringify(history));
        renderHistory();
        showNotification('已清除歷史記錄');
    }
});

// 初始化應用
init();
