# 🧮 GTK Calculator - GTK 4 計算器

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Python + GTK 4 開發的現代化計算器應用程式，展示原生 Linux 桌面應用開發。

## ✨ 主要功能

- 🔢 基本算術運算（加、減、乘、除）
- 📊 百分比計算
- ➕➖ 正負號切換
- 🔙 退格功能
- 🎨 現代化暗色主題
- ⌨️ 鍵盤快捷鍵支援
- 🖼️ 美觀的 GTK 4 介面

## 🚀 快速開始

### 系統需求

- Python 3.10+
- GTK 4
- libadwaita

### 安裝依賴（Debian/Ubuntu）

```bash
sudo apt install python3-gi python3-gi-cairo gir1.2-gtk-4.0 gir1.2-adw-1
```

### 安裝依賴（Fedora）

```bash
sudo dnf install python3-gobject gtk4 libadwaita
```

### 安裝依賴（Arch Linux）

```bash
sudo pacman -S python-gobject gtk4 libadwaita
```

### 執行應用程式

```bash
# 賦予執行權限
chmod +x calculator.py

# 執行
./calculator.py
```

或者：

```bash
python3 calculator.py
```

## 🎯 使用方法

### 基本操作
- 點擊數字按鈕輸入數字
- 點擊運算符按鈕執行運算
- 點擊 `=` 顯示結果
- 點擊 `C` 清除所有
- 點擊 `⌫` 刪除最後一個字元

### 特殊功能
- `%`: 將當前數字轉換為百分比（除以 100）
- `±`: 切換正負號

### 鍵盤快捷鍵
- `0-9`: 輸入數字
- `+`, `-`, `*`, `/`: 運算符
- `Enter` 或 `=`: 計算結果
- `Escape` 或 `C`: 清除
- `Backspace`: 退格

## 🛠️ 技術棧

- **語言**: Python 3
- **UI 框架**: GTK 4
- **樣式**: libadwaita
- **綁定**: PyGObject

## 📁 專案結構

```
gtk-calculator/
├── calculator.py      # 主程式
├── README.md         # 說明文檔
└── requirements.txt  # Python 依賴（參考用）
```

## 🎨 UI 設計

### 顏色方案（Catppuccin Mocha）
- 背景: `#1e1e2e`
- 數字按鈕: `#313244`
- 運算符: `#f38ba8`（粉紅色）
- 功能按鈕: `#45475a`
- 文字: `#cdd6f4`

### 佈局
- 5x4 按鈕網格
- 大型顯示區域
- 圓角按鈕設計
- 間距和陰影效果

## 🔧 自訂

### 修改顏色主題

編輯 `load_css()` 方法中的 CSS 代碼：

```python
css = b"""
.number-btn {
    background: #your-color;
    color: #text-color;
}
"""
```

### 添加新功能

在 `Calculator` 類中添加新的處理方法：

```python
def handle_square(self):
    """平方運算"""
    try:
        value = float(self.current_value)
        result = value ** 2
        self.current_value = str(result)
    except:
        self.current_value = "錯誤"
```

## 📦 打包發布

### 使用 PyInstaller

```bash
pip install pyinstaller
pyinstaller --onefile --windowed calculator.py
```

### 建立 .desktop 文件

建立 `calculator.desktop`:

```desktop
[Desktop Entry]
Name=GTK Calculator
Comment=現代化計算器
Exec=/path/to/calculator.py
Icon=accessories-calculator
Terminal=false
Type=Application
Categories=Utility;Calculator;
```

## 🐛 已知問題

- 連續運算可能需要多次按等號
- 極大或極小數字顯示使用科學記號

## 🔮 未來功能

- [ ] 科學計算功能
- [ ] 歷史記錄
- [ ] 記憶體功能（M+, M-, MR, MC）
- [ ] 主題切換
- [ ] 單位轉換

## 📚 學習資源

- [GTK 4 文檔](https://docs.gtk.org/gtk4/)
- [PyGObject 文檔](https://pygobject.readthedocs.io/)
- [libadwaita 文檔](https://gnome.pages.gitlab.gnome.org/libadwaita/)

## 💡 開發技巧

### 使用 GTK Inspector 調試

```bash
GTK_DEBUG=interactive ./calculator.py
```

### 檢查 GTK 版本

```python
import gi
print(gi.version_info)
```

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: GitHub Copilot, Cursor
**適用平台**: Linux (GNOME)
**狀態**: ✅ 完整可用專案
