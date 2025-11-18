import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import './App.css';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'monochromatic';

interface Palette {
  name: string;
  type: PaletteType;
  colors: string[];
}

function App() {
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [hexValue, setHexValue] = useState('#3B82F6');
  const [rgbValue, setRgbValue] = useState('rgb(59, 130, 246)');
  const [hslValue, setHslValue] = useState('hsl(217, 91%, 60%)');
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState<'palettes' | 'history'>('palettes');

  // 載入歷史記錄
  useEffect(() => {
    const savedHistory = localStorage.getItem('colorHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 更新顏色
  useEffect(() => {
    updateColor(currentColor);
  }, [currentColor]);

  const updateColor = async (hex: string) => {
    try {
      setHexValue(hex.toUpperCase());

      // 轉換為 RGB
      const rgb = await invoke<[number, number, number]>('hex_to_rgb', { hex });
      setRgbValue(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);

      // 轉換為 HSL
      const hsl = await invoke<[number, number, number]>('convert_rgb_to_hsl', {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
      });
      setHslValue(`hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`);

      // 生成配色方案
      await generatePalettes(hex);

      // 添加到歷史記錄
      addToHistory(hex);
    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const generatePalettes = async (hex: string) => {
    try {
      const comp = await invoke<string>('generate_complementary', { hex });
      const analog = await invoke<string[]>('generate_analogous', { hex });
      const tri = await invoke<string[]>('generate_triadic', { hex });
      const mono = await invoke<string[]>('generate_monochromatic', { hex });

      setPalettes([
        {
          name: '互補色',
          type: 'complementary',
          colors: [hex, comp],
        },
        {
          name: '類似色',
          type: 'analogous',
          colors: analog,
        },
        {
          name: '三角色',
          type: 'triadic',
          colors: tri,
        },
        {
          name: '單色系',
          type: 'monochromatic',
          colors: mono,
        },
      ]);
    } catch (error) {
      console.error('Error generating palettes:', error);
    }
  };

  const addToHistory = (hex: string) => {
    setHistory((prev) => {
      // 移除重複項
      const filtered = prev.filter((h) => h.toLowerCase() !== hex.toLowerCase());
      // 添加到開頭
      const newHistory = [hex, ...filtered];
      // 限制數量為 20
      const limited = newHistory.slice(0, 20);
      // 保存到 localStorage
      localStorage.setItem('colorHistory', JSON.stringify(limited));
      return limited;
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await writeText(text);
      showNotification(`${label} 已複製到剪貼簿`);
    } catch (error) {
      console.error('Copy failed:', error);
      showNotification('複製失敗');
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2000);
  };

  const clearHistory = () => {
    if (confirm('確定要清除所有歷史記錄嗎？')) {
      setHistory([]);
      localStorage.setItem('colorHistory', JSON.stringify([]));
      showNotification('已清除歷史記錄');
    }
  };

  const selectColor = (color: string) => {
    setCurrentColor(color);
  };

  return (
    <div className="app">
      {/* 通知訊息 */}
      {notification && (
        <div className="notification show">
          <span>{notification}</span>
        </div>
      )}

      {/* 標題 */}
      <header className="app-header">
        <h1>🎨 Color Picker</h1>
        <p className="subtitle">智能配色方案生成器</p>
      </header>

      <main className="app-main">
        {/* 主要顏色顯示 */}
        <section className="color-display-section">
          <div
            className="color-display"
            style={{ backgroundColor: currentColor }}
            onClick={() => copyToClipboard(hexValue, '顏色值')}
          >
            <div className="color-overlay">
              <div className="color-value">{hexValue}</div>
              <div className="color-hint">點擊複製</div>
            </div>
          </div>

          <div className="color-picker-wrapper">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="color-input"
            />
            <span className="picker-label">選擇顏色</span>
          </div>
        </section>

        {/* 顏色格式 */}
        <section className="color-formats">
          <div className="format-item">
            <label>HEX</label>
            <div className="format-input-wrapper">
              <input
                type="text"
                value={hexValue}
                readOnly
                className="format-input"
              />
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(hexValue, 'HEX')}
              >
                📋
              </button>
            </div>
          </div>

          <div className="format-item">
            <label>RGB</label>
            <div className="format-input-wrapper">
              <input
                type="text"
                value={rgbValue}
                readOnly
                className="format-input"
              />
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(rgbValue, 'RGB')}
              >
                📋
              </button>
            </div>
          </div>

          <div className="format-item">
            <label>HSL</label>
            <div className="format-input-wrapper">
              <input
                type="text"
                value={hslValue}
                readOnly
                className="format-input"
              />
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(hslValue, 'HSL')}
              >
                📋
              </button>
            </div>
          </div>
        </section>

        {/* 標籤切換 */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'palettes' ? 'active' : ''}`}
            onClick={() => setActiveTab('palettes')}
          >
            🎨 配色方案
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 歷史記錄 ({history.length})
          </button>
        </div>

        {/* 配色方案 */}
        {activeTab === 'palettes' && (
          <section className="palettes-section">
            {palettes.map((palette) => (
              <div key={palette.type} className="palette-group">
                <h3 className="palette-title">{palette.name}</h3>
                <div className="palette-colors">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      onClick={() => selectColor(color)}
                      title={`點擊使用 ${color}`}
                    >
                      <div className="swatch-overlay">
                        <span className="swatch-label">{color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 歷史記錄 */}
        {activeTab === 'history' && (
          <section className="history-section">
            {history.length === 0 ? (
              <div className="empty-state">
                <p>尚無歷史記錄</p>
                <p className="empty-hint">選擇顏色後會自動記錄</p>
              </div>
            ) : (
              <>
                <div className="history-grid">
                  {history.map((color, index) => (
                    <div
                      key={index}
                      className="history-item"
                      style={{ backgroundColor: color }}
                      onClick={() => selectColor(color)}
                      title={color}
                    >
                      <div className="history-overlay">
                        <span>{color}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="clear-history-btn" onClick={clearHistory}>
                  🗑️ 清除歷史記錄
                </button>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>使用 Tauri + React 構建 | 支援多種配色方案</p>
      </footer>
    </div>
  );
}

export default App;
