# 📝 Todo CLI - 命令列待辦事項管理器

> 🤖 **AI-Driven Development** - 使用 AI 輔助開發的任務管理 CLI 工具

一個簡單、快速、功能豐富的命令列待辦事項管理器，讓任務管理變得輕鬆有趣。

## ✨ 功能特色

- ✅ **任務管理** - 添加、完成、刪除、編輯任務
- 🎯 **優先級** - 三級優先級（高、中、低）
- 🏷️ **標籤系統** - 使用標籤組織任務
- 📊 **智能過濾** - 按標籤、優先級、狀態過濾
- 💾 **自動保存** - JSON 格式存儲，易於備份
- 🎨 **美觀輸出** - 彩色 Emoji 和清晰的排版
- 📅 **時間追蹤** - 記錄創建和完成時間

## 🚀 快速開始

### 環境需求

- Python 3.6 或更高版本
- 無需額外依賴（使用 Python 標準庫）

### 安裝

```bash
# 進入專案目錄
cd tools-utilities/cli-tools/todo-cli

# 賦予執行權限（Linux/Mac）
chmod +x todo.py

# 可選：創建別名以便快速使用
# 在 ~/.bashrc 或 ~/.zshrc 添加：
# alias todo='python /path/to/todo.py'
```

### 第一次使用

```bash
# 添加第一個任務
python todo.py add "學習 Python"

# 查看任務列表
python todo.py list

# 完成任務
python todo.py done 1
```

## 📖 使用範例

### 1. 添加任務

```bash
# 添加普通任務
python todo.py add "寫週報"

# 添加高優先級任務
python todo.py add "修復緊急bug" --priority high

# 添加帶標籤的任務
python todo.py add "設計新功能" --tags work,design

# 組合使用
python todo.py add "準備會議簡報" --priority high --tags work,meeting
```

### 2. 查看任務列表

```bash
# 查看待處理任務（默認）
python todo.py list

# 查看所有任務（包含已完成）
python todo.py list --all

# 按標籤過濾
python todo.py list --tag work

# 按優先級過濾
python todo.py list --priority high

# 組合過濾
python todo.py list --tag work --priority high
```

### 3. 完成任務

```bash
# 標記任務為完成
python todo.py done 1

# 取消完成狀態
python todo.py undone 1
```

### 4. 編輯任務

```bash
# 修改任務描述
python todo.py edit 1 --task "新的任務描述"

# 修改優先級
python todo.py edit 1 --priority high

# 修改標籤
python todo.py edit 1 --tags work,urgent,bug

# 組合修改
python todo.py edit 1 --task "更新後的任務" --priority low --tags personal
```

### 5. 刪除任務

```bash
# 刪除單個任務
python todo.py delete 1

# 清除所有已完成的任務
python todo.py clear
```

## 🎯 實際應用場景

### 場景 1: 日常任務管理

```bash
# 早上規劃一天的任務
python todo.py add "回覆郵件" --priority high --tags work
python todo.py add "寫程式碼" --tags work,dev
python todo.py add "健身" --tags personal
python todo.py add "買菜" --tags personal,shopping

# 查看今天的工作任務
python todo.py list --tag work

# 完成任務
python todo.py done 1
python todo.py done 2
```

### 場景 2: 專案管理

```bash
# 添加專案任務
python todo.py add "設計資料庫架構" --priority high --tags project,backend
python todo.py add "實作 API" --priority medium --tags project,backend
python todo.py add "寫測試" --priority medium --tags project,testing
python todo.py add "部署上線" --priority low --tags project,devops

# 查看專案所有任務
python todo.py list --tag project
```

### 場景 3: Bug 追蹤

```bash
# 記錄 bug
python todo.py add "修復登入問題" --priority high --tags bug,urgent
python todo.py add "優化頁面載入速度" --priority medium --tags bug,performance
python todo.py add "修正拼寫錯誤" --priority low --tags bug,ui

# 查看所有 bug
python todo.py list --tag bug

# 查看緊急 bug
python todo.py list --tag bug --priority high
```

### 場景 4: 週期性清理

```bash
# 週末回顧並清理
python todo.py list --all  # 查看所有任務
python todo.py clear       # 清除已完成的任務
```

## 📊 輸出示例

### 任務列表顯示

```
======================================================================
📋 待辦事項列表
======================================================================

⏳ #1 🔴 修復緊急bug [#work, #urgent]
    (創建: 2024-01-15)

⏳ #2 🟡 寫週報 [#work]
    (創建: 2024-01-15)

⏳ #3 🟢 買菜 [#personal, #shopping]
    (創建: 2024-01-15)

✅ #4 🟡 學習 Python [#learning]
    (創建: 2024-01-14, 完成: 2024-01-15)

======================================================================
📊 總計: 4 | ✅ 已完成: 1 | ⏳ 待處理: 3
======================================================================
```

## 🎨 優先級說明

| 優先級 | 標誌 | 說明 | 適用場景 |
|--------|------|------|----------|
| High   | 🔴   | 緊急重要 | 緊急 bug、截止期限緊迫 |
| Medium | 🟡   | 一般重要 | 日常工作、計劃任務 |
| Low    | 🟢   | 可延後 | 改進項目、長期計劃 |

## 🏷️ 標籤使用建議

### 工作相關
- `work` - 工作任務
- `meeting` - 會議
- `email` - 郵件處理
- `report` - 報告撰寫

### 開發相關
- `dev` - 開發
- `bug` - 錯誤修復
- `feature` - 新功能
- `testing` - 測試
- `deploy` - 部署

### 個人相關
- `personal` - 個人事項
- `learning` - 學習
- `health` - 健康
- `shopping` - 購物

## 💾 數據存儲

### 默認存儲位置

```bash
# Linux/Mac
~/.todo.json

# Windows
C:\Users\YourName\.todo.json
```

### 自定義存儲位置

```bash
# 使用自定義文件
python todo.py --file ~/my-todos.json add "新任務"

# 不同專案使用不同文件
python todo.py --file ~/work/work-todos.json list
python todo.py --file ~/personal/personal-todos.json list
```

### 數據格式

```json
[
  {
    "id": 1,
    "task": "完成專案報告",
    "priority": "high",
    "tags": ["work", "report"],
    "completed": false,
    "created_at": "2024-01-15T10:30:00",
    "completed_at": null
  }
]
```

## 🔧 進階用法

### 1. 創建命令別名

在 `~/.bashrc` 或 `~/.zshrc` 添加：

```bash
# 基本別名
alias todo='python /path/to/todo.py'

# 快捷命令
alias td='python /path/to/todo.py'
alias tda='python /path/to/todo.py add'
alias tdl='python /path/to/todo.py list'
alias tdd='python /path/to/todo.py done'

# 使用範例
td add "新任務"
tdl --tag work
tdd 1
```

### 2. 批次導入任務

```bash
# 創建任務列表文件
cat > tasks.txt << EOF
寫週報
修復bug
更新文檔
EOF

# 批次添加
while read task; do
    python todo.py add "$task"
done < tasks.txt
```

### 3. 導出任務報告

```bash
# 導出為純文本
python todo.py list --all > tasks-report.txt

# 查看統計
python todo.py list --all | grep "📊"
```

### 4. 定期提醒

使用 cron 定期顯示待辦事項：

```bash
# 每天早上 9 點顯示任務
0 9 * * * python /path/to/todo.py list
```

## 🤖 AI 開發故事

這個工具完全使用 AI 輔助開發：

1. **需求設計** - AI 協助分析待辦事項管理需求
2. **數據結構** - AI 設計 JSON 存儲格式
3. **命令設計** - AI 建議直觀的命令介面
4. **功能實作** - AI 生成完整的 CRUD 功能
5. **用戶體驗** - AI 優化輸出格式和 Emoji 使用

## 💡 使用技巧

1. **善用標籤** - 建立自己的標籤系統，便於分類管理
2. **優先級管理** - 每天重點關注高優先級任務
3. **定期清理** - 週期性使用 `clear` 命令清理已完成任務
4. **多文件管理** - 工作和個人使用不同的數據文件
5. **備份數據** - 定期備份 `.todo.json` 文件

## 🛡️ 注意事項

1. **數據安全** - `.todo.json` 是純文本，注意不要存儲敏感信息
2. **文件權限** - 確保數據文件有讀寫權限
3. **並發問題** - 避免同時在多個終端修改同一數據文件
4. **備份建議** - 重要任務建議定期備份數據文件

## 🔜 未來改進

- [ ] 支援子任務
- [ ] 添加截止日期
- [ ] 任務提醒通知
- [ ] 彩色終端輸出（使用 colorama）
- [ ] 任務搜尋功能
- [ ] 導出為 Markdown
- [ ] 同步到雲端
- [ ] Web 界面

## 🎯 命令速查表

| 命令 | 縮寫 | 說明 | 範例 |
|------|------|------|------|
| add | - | 添加任務 | `todo.py add "任務"` |
| list | - | 列出任務 | `todo.py list` |
| done | - | 完成任務 | `todo.py done 1` |
| undone | - | 取消完成 | `todo.py undone 1` |
| edit | - | 編輯任務 | `todo.py edit 1 --task "新內容"` |
| delete | - | 刪除任務 | `todo.py delete 1` |
| clear | - | 清除已完成 | `todo.py clear` |

## 🤝 貢獻

歡迎提供改進建議！特別期待：

- 新功能想法
- 用戶體驗改進
- Bug 回報
- 文檔完善

## 📄 授權

MIT License

## 🔗 類似專案

- [taskwarrior](https://taskwarrior.org/) - 功能豐富的任務管理器
- [todo.txt](http://todotxt.org/) - 簡單的純文本任務管理
- [remember-the-milk](https://www.rememberthemilk.com/) - 線上任務管理

---

**使用 AI 讓任務管理更高效** 🚀

## 💬 常見問題

### Q: 如何備份我的任務？
A: 直接複製 `~/.todo.json` 文件即可。

### Q: 可以在多台電腦間同步嗎？
A: 可以將數據文件放在 Dropbox、Google Drive 等雲端目錄，使用 `--file` 參數指定。

### Q: 不小心刪除了任務怎麼辦？
A: 如果有備份，恢復 `.todo.json` 文件。建議定期備份。

### Q: 可以顯示顏色嗎？
A: 目前使用 Emoji，未來版本會添加終端顏色支援。
