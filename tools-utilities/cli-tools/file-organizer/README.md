# 🗂️ File Organizer - 智能檔案整理工具

> 🤖 **AI-Driven Development** - 使用 AI 輔助開發的命令列文件整理工具

一個簡單而強大的 CLI 工具，可以自動將雜亂的文件按類型或日期整理到對應的資料夾中。

## ✨ 功能特色

- 🎯 **智能分類** - 自動識別 11 種文件類型並分類
- 📅 **日期整理** - 按文件修改日期（年-月）組織文件
- 🔍 **模擬模式** - 在實際移動文件前預覽結果
- 🛡️ **安全可靠** - 自動處理文件名衝突，避免覆蓋
- 📊 **統計報告** - 顯示整理結果的詳細統計
- 💬 **詳細輸出** - 可選的詳細模式顯示每個操作

## 📋 支援的文件類型

| 類別 | 文件擴展名 |
|------|-----------|
| 🖼️ Images | .jpg, .jpeg, .png, .gif, .bmp, .svg, .webp, .ico |
| 🎬 Videos | .mp4, .avi, .mkv, .mov, .wmv, .flv, .webm |
| 🎵 Audio | .mp3, .wav, .flac, .aac, .ogg, .wma, .m4a |
| 📄 Documents | .pdf, .doc, .docx, .txt, .rtf, .odt, .pages |
| 📊 Spreadsheets | .xls, .xlsx, .csv, .ods, .numbers |
| 📽️ Presentations | .ppt, .pptx, .key, .odp |
| 📦 Archives | .zip, .rar, .7z, .tar, .gz, .bz2, .xz |
| 💻 Code | .py, .js, .java, .cpp, .c, .h, .cs, .php, .rb, .go, .rs, .swift |
| 🌐 Web | .html, .css, .scss, .sass, .less, .jsx, .tsx, .vue |
| 📋 Data | .json, .xml, .yaml, .yml, .toml, .ini, .cfg |
| ⚙️ Executables | .exe, .msi, .app, .deb, .rpm, .dmg, .apk |

## 🚀 快速開始

### 環境需求

- Python 3.6 或更高版本
- 無需額外依賴（使用 Python 標準庫）

### 安裝

```bash
# 克隆專案或下載文件
cd tools-utilities/cli-tools/file-organizer

# 賦予執行權限（Linux/Mac）
chmod +x file_organizer.py
```

### 基本使用

```bash
# 整理當前目錄的文件
python file_organizer.py .

# 整理指定目錄
python file_organizer.py /path/to/downloads

# 整理下載資料夾（常見用例）
python file_organizer.py ~/Downloads
```

## 📖 使用範例

### 1. 按類型整理文件

```bash
# 整理當前目錄
python file_organizer.py .

# 輸出示例：
# 📁 開始整理目錄: /home/user/Downloads
# 找到 42 個文件
#
# ✅ [Images] photo.jpg -> Images/
# ✅ [Documents] report.pdf -> Documents/
# ✅ [Videos] movie.mp4 -> Videos/
# ...
```

### 2. 模擬模式（預覽而不實際移動）

```bash
python file_organizer.py . --dry-run

# 這會顯示將要進行的操作，但不會實際移動文件
```

### 3. 按日期整理

```bash
python file_organizer.py . --by-date

# 文件會按修改日期組織到 YYYY-MM 格式的資料夾
# 例如: 2024-01/, 2024-02/, 等等
```

### 4. 詳細模式

```bash
python file_organizer.py . --verbose

# 顯示每個文件的處理詳情
```

### 5. 組合選項

```bash
# 模擬 + 詳細模式
python file_organizer.py ~/Downloads --dry-run --verbose

# 按日期整理 + 詳細模式
python file_organizer.py ~/Documents --by-date --verbose
```

## 🎯 實際應用場景

### 場景 1: 清理下載資料夾

```bash
# 先預覽
python file_organizer.py ~/Downloads --dry-run

# 確認後執行
python file_organizer.py ~/Downloads
```

### 場景 2: 整理專案資源

```bash
# 整理專案中的媒體文件
python file_organizer.py ./assets --verbose
```

### 場景 3: 按時間歸檔

```bash
# 將舊文件按月份歸檔
python file_organizer.py ~/Documents/Archive --by-date
```

## 📊 輸出結果

整理完成後，工具會顯示詳細的統計信息：

```
==================================================
📊 整理統計:
  ✅ 已移動: 42 個文件
  ⏭️  已跳過: 0 個文件
  ❌ 錯誤: 0 個文件
==================================================
```

## 🛡️ 安全特性

1. **文件名衝突處理** - 如果目標位置已存在同名文件，會自動添加時間戳
2. **模擬模式** - 使用 `--dry-run` 可以安全預覽操作
3. **錯誤處理** - 遇到錯誤時會跳過該文件並繼續處理其他文件
4. **保留原始文件** - 只移動文件，不會刪除或修改文件內容

## 🔧 進階選項

### 完整命令列參數

```bash
python file_organizer.py --help

選項:
  directory              要整理的目錄路徑（默認：當前目錄）
  -d, --dry-run         模擬模式，不實際移動文件
  -v, --verbose         顯示詳細信息
  --by-date            按日期（年-月）整理文件
  --version            顯示版本信息
  -h, --help           顯示幫助信息
```

## 🎨 自定義擴展

如果需要添加新的文件類型，可以修改 `FILE_CATEGORIES` 字典：

```python
FILE_CATEGORIES = {
    'MyCategory': ['.ext1', '.ext2', '.ext3'],
    # 添加更多類別...
}
```

## 🤖 AI 開發故事

這個工具完全使用 AI 輔助開發：

1. **需求設計** - AI 協助分析文件整理需求
2. **架構設計** - AI 建議使用 OOP 架構
3. **功能實作** - AI 生成核心整理邏輯
4. **錯誤處理** - AI 添加完善的異常處理
5. **用戶體驗** - AI 優化命令列介面和輸出格式

## 💡 使用技巧

1. **定期整理** - 設定定時任務自動整理下載資料夾
2. **先預覽** - 在新目錄使用前先用 `--dry-run` 預覽
3. **組合使用** - 可以先按類型整理，再按日期歸檔
4. **備份重要文件** - 整理重要文件前建議先備份

## 📝 注意事項

- 工具只處理文件，不會處理子目錄
- 隱藏文件（以 `.` 開頭）不會被處理
- 已經在類別資料夾中的文件不會被再次移動

## 🤝 貢獻

歡迎提供改進建議或新功能！

## 📄 授權

MIT License

## 🔗 相關專案

- [filetree.py](../filetree.py) - 目錄樹顯示工具
- [passgen.py](../passgen.py) - 密碼生成工具

---

**使用 AI 讓文件整理變得簡單** 🚀
