# 📝 Markdown Preview - Markdown 預覽工具

> 🤖 **AI-Driven Development** - 使用 AI 輔助開發的 Markdown 預覽 CLI 工具

一個功能豐富的命令列工具，可以在終端或瀏覽器中預覽 Markdown 文件，並支援生成靜態 HTML。

## ✨ 功能特色

- 📺 **終端預覽** - 直接在終端中渲染 Markdown
- 🌐 **瀏覽器預覽** - 在瀏覽器中打開美化的 HTML 預覽
- 📄 **HTML 生成** - 將 Markdown 轉換為獨立的 HTML 文件
- 🎨 **美觀樣式** - 現代化的 CSS 樣式，類似 GitHub 風格
- ⚡ **即時服務器** - 內建 HTTP 服務器，即時預覽
- 🔧 **可配置** - 支援自定義端口和輸出路徑

## 🚀 快速開始

### 環境需求

- Python 3.6 或更高版本
- 無需額外依賴（瀏覽器預覽使用 CDN 載入 marked.js）

### 安裝

```bash
# 進入專案目錄
cd tools-utilities/cli-tools/markdown-preview

# 賦予執行權限（Linux/Mac）
chmod +x markdown_preview.py
```

### 基本使用

```bash
# 在終端預覽
python markdown_preview.py README.md

# 在瀏覽器預覽
python markdown_preview.py README.md --browser

# 生成 HTML 文件
python markdown_preview.py README.md --output preview.html
```

## 📖 使用範例

### 1. 終端預覽模式

在終端中快速查看 Markdown 內容：

```bash
python markdown_preview.py document.md

# 輸出示例：
# ============================================================
# 📝 預覽: document.md
# ============================================================
#
# ============================================================
# MARKDOWN PREVIEW
# ============================================================
#
# A powerful CLI tool for previewing Markdown files
# ...
```

### 2. 瀏覽器預覽模式

在瀏覽器中打開美化的預覽：

```bash
python markdown_preview.py README.md --browser

# 輸出:
# 🌐 預覽服務器已啟動: http://localhost:8000
# 📝 在瀏覽器中打開...
#
# 按 Ctrl+C 停止服務器
```

### 3. 自定義端口

指定不同的端口號：

```bash
python markdown_preview.py notes.md --browser --port 8080

# 服務器將在 http://localhost:8080 啟動
```

### 4. 生成靜態 HTML

將 Markdown 轉換為 HTML 文件：

```bash
python markdown_preview.py document.md --output docs/preview.html

# 輸出:
# ✅ HTML 已生成: docs/preview.html
```

### 5. 預覽多個文件

使用 shell 循環預覽多個文件：

```bash
# Bash
for file in docs/*.md; do
    python markdown_preview.py "$file" --output "${file%.md}.html"
done

# 批次生成 HTML 文件
```

## 🎯 實際應用場景

### 場景 1: 開發文檔預覽

```bash
# 編寫 README 時實時預覽
python markdown_preview.py README.md --browser

# 編輯文件後刷新瀏覽器即可看到更新
```

### 場景 2: 快速檢查格式

```bash
# 在提交前快速檢查 Markdown 格式
python markdown_preview.py CHANGELOG.md
```

### 場景 3: 生成文檔網頁

```bash
# 將 Markdown 筆記轉換為可分享的 HTML
python markdown_preview.py notes.md --output share/notes.html
```

### 場景 4: 會議簡報

```bash
# 在會議中展示 Markdown 文檔
python markdown_preview.py presentation.md --browser --port 8888
```

## 🎨 支援的 Markdown 語法

### 終端模式支援

- ✅ 標題（H1-H4）
- ✅ 列表（有序、無序）
- ✅ 程式碼區塊
- ✅ 引用
- ✅ 粗體和斜體
- ✅ 連結（顯示但不可點擊）

### 瀏覽器模式支援

完整的 Markdown 語法支援（通過 marked.js）：

- ✅ 所有標題層級
- ✅ 列表和嵌套列表
- ✅ 程式碼高亮
- ✅ 引用區塊
- ✅ 表格
- ✅ 圖片
- ✅ 連結
- ✅ 粗體、斜體、刪除線
- ✅ 水平線
- ✅ HTML 標籤

## 🔧 命令列參數

### 完整參數列表

```bash
python markdown_preview.py --help

位置參數:
  file                  Markdown 文件路徑

選項:
  -h, --help           顯示幫助信息
  -b, --browser        在瀏覽器中打開預覽
  -p PORT, --port PORT 預覽服務器端口（默認：8000）
  -o OUTPUT, --output OUTPUT
                       輸出 HTML 文件路徑
  --version            顯示版本信息
```

## 🎨 HTML 樣式特色

生成的 HTML 包含：

- 🎯 **清晰排版** - 最大寬度 900px，居中顯示
- 🌈 **語法高亮** - 程式碼區塊使用暗色主題
- 📱 **響應式設計** - 自動適應不同螢幕尺寸
- 🎨 **美觀配色** - 類似 GitHub 的專業配色
- 📊 **表格美化** - 邊框和間距優化
- 🖼️ **圖片處理** - 自動調整大小和圓角

## 💡 進階用法

### 自動化工作流程

創建一個腳本自動預覽並生成 HTML：

```bash
#!/bin/bash
# preview-and-export.sh

MARKDOWN_FILE=$1
HTML_OUTPUT="${MARKDOWN_FILE%.md}.html"

# 在瀏覽器預覽
python markdown_preview.py "$MARKDOWN_FILE" --browser &

# 等待確認
read -p "預覽確認後，按 Enter 生成 HTML..."

# 生成 HTML
python markdown_preview.py "$MARKDOWN_FILE" --output "$HTML_OUTPUT"

echo "✅ 完成！"
```

### 與其他工具結合

```bash
# 配合文件監視工具
# 安裝 entr (Linux/Mac)
ls *.md | entr python markdown_preview.py README.md --output preview.html

# 每次 Markdown 文件變更時自動重新生成
```

## 🤖 AI 開發故事

這個工具完全使用 AI 輔助開發：

1. **需求分析** - AI 協助設計預覽功能
2. **架構設計** - AI 建議使用 HTTP 服務器和 marked.js
3. **樣式設計** - AI 生成現代化的 CSS 樣式
4. **終端渲染** - AI 實作 Markdown 到純文本的轉換
5. **錯誤處理** - AI 添加完善的異常處理邏輯

## 📊 性能特點

- ⚡ **快速啟動** - 無需安裝依賴，即開即用
- 💾 **輕量級** - 純 Python 標準庫實作
- 🔄 **即時更新** - 修改文件後刷新瀏覽器即可
- 📦 **獨立運行** - 生成的 HTML 可離線使用

## 🛡️ 注意事項

1. **端口衝突** - 如果 8000 端口被占用，使用 `--port` 指定其他端口
2. **文件編碼** - 確保 Markdown 文件使用 UTF-8 編碼
3. **圖片路徑** - 生成的 HTML 中圖片路徑為相對路徑
4. **瀏覽器快取** - 如果看不到更新，嘗試強制刷新（Ctrl+F5）

## 🔜 未來改進

- [ ] 支援自定義 CSS 樣式
- [ ] 文件變化自動重載
- [ ] 支援 Mermaid 圖表
- [ ] 支援數學公式（KaTeX）
- [ ] 暗色模式切換
- [ ] 導出為 PDF

## 💡 使用技巧

1. **快速預覽** - 終端模式適合快速檢查內容
2. **分享文檔** - 生成的 HTML 可直接分享或部署
3. **本地開發** - 瀏覽器模式適合編寫長文檔
4. **批次處理** - 結合 shell 腳本批次生成 HTML

## 🤝 貢獻

歡迎提供改進建議！特別是：

- 更好的終端渲染效果
- 更多樣式主題
- 更多匯出格式

## 📄 授權

MIT License

## 🔗 相關工具

- [marked.js](https://marked.js.org/) - Markdown 解析器
- [grip](https://github.com/joeyespo/grip) - GitHub 風格預覽
- [mdv](https://github.com/axiros/terminal_markdown_viewer) - 終端 Markdown 查看器

---

**使用 AI 讓 Markdown 預覽更簡單** 🚀
