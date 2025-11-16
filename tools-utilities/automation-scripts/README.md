# 🤖 Automation Scripts - 自動化腳本

> 🤖 **AI-Driven Development** - 使用 AI 快速開發強大的自動化腳本

這個子專案包含各種使用 AI 輔助開發的自動化腳本，提升日常工作效率。

## 📋 專案目標

開發一系列實用的自動化腳本，涵蓋：
- 檔案批次處理
- 系統維護自動化
- 資料備份與同步
- 任務排程管理
- 環境設定自動化

## 🎯 已實作腳本

### 1. **batch_rename.py** - 批次檔案重新命名
強大的批次重新命名工具，支援多種模式和預覽功能。

**功能特色：**
- 多種重新命名模式（前綴、後綴、替換、序號）
- 正規表達式支援
- 預覽模式（安全確認）
- 撤銷功能
- 遞迴處理子目錄

**使用範例：**
```bash
# 添加前綴
python batch_rename.py --prefix "IMG_" *.jpg

# 替換文字
python batch_rename.py --replace "old" "new" *.txt

# 添加序號
python batch_rename.py --numbering --start 1 *.pdf

# 預覽模式
python batch_rename.py --preview --prefix "backup_" *

# 使用正規表達式
python batch_rename.py --regex "(\d{4})-(\d{2})-(\d{2})" "\3-\2-\1" *.log
```

### 2. **auto_backup.py** - 自動備份工具
智能備份腳本，支援增量備份和壓縮。

**功能特色：**
- 完整與增量備份
- 自動壓縮（zip/tar.gz）
- 備份輪替（保留最近 N 個備份）
- 排除規則支援
- 郵件通知（可選）
- 備份驗證

**使用範例：**
```bash
# 完整備份
python auto_backup.py /source/dir /backup/dir

# 增量備份
python auto_backup.py /source/dir /backup/dir --incremental

# 壓縮備份
python auto_backup.py /source/dir /backup/dir --compress zip

# 保留最近 7 個備份
python auto_backup.py /source/dir /backup/dir --keep 7

# 排除特定檔案
python auto_backup.py /source/dir /backup/dir --exclude "*.tmp,*.log"
```

### 3. **cleanup_old_files.py** - 舊檔案清理工具
自動清理舊檔案和暫存檔的腳本。

**功能特色：**
- 根據修改時間清理
- 檔案大小過濾
- 檔案類型過濾
- 安全模式（移至回收站）
- 詳細報告
- 排程執行支援

**使用範例：**
```bash
# 刪除 30 天前的檔案
python cleanup_old_files.py /tmp --days 30

# 清理大於 100MB 的檔案
python cleanup_old_files.py /downloads --size-gt 100M

# 只清理特定類型
python cleanup_old_files.py /logs --pattern "*.log"

# 安全模式（移至回收站）
python cleanup_old_files.py /temp --days 7 --safe-mode

# 產生報告不刪除
python cleanup_old_files.py /data --days 90 --dry-run
```

### 4. **env_setup.sh** - 開發環境設定腳本
一鍵設定開發環境的 Shell 腳本。

**功能特色：**
- 自動安裝常用工具
- Git 配置
- SSH 金鑰設定
- 開發工具安裝
- 自訂配置支援

**使用範例：**
```bash
# 基本設定
bash env_setup.sh

# 只安裝 Git 工具
bash env_setup.sh --git-only

# 完整開發環境
bash env_setup.sh --full

# 自訂配置
bash env_setup.sh --config my_config.yaml
```

### 5. **log_rotator.py** - 日誌輪替工具
自動化日誌檔案管理和輪替。

**功能特色：**
- 基於大小的輪替
- 基於時間的輪替
- 自動壓縮舊日誌
- 保留策略
- 多個日誌目錄支援

**使用範例：**
```bash
# 輪替大於 10MB 的日誌
python log_rotator.py /var/log/app.log --max-size 10M

# 每日輪替
python log_rotator.py /var/log/app.log --daily

# 保留最近 30 個日誌
python log_rotator.py /var/log/app.log --keep 30

# 壓縮舊日誌
python log_rotator.py /var/log/app.log --compress
```

### 6. **system_health_check.py** - 系統健康檢查
定期檢查系統狀態並發送報告。

**功能特色：**
- CPU、記憶體、磁碟檢查
- 服務狀態監控
- 網路連接測試
- 自訂檢查項目
- 告警通知

**使用範例：**
```bash
# 執行健康檢查
python system_health_check.py

# 檢查特定項目
python system_health_check.py --check cpu,memory,disk

# 設定告警閾值
python system_health_check.py --cpu-alert 80 --mem-alert 90

# 輸出 JSON 報告
python system_health_check.py --output json
```

## 🛠️ 技術棧

### 程式語言
- **Python 3.8+** - 主要腳本語言
- **Bash/Shell** - 系統管理腳本
- **PowerShell** - Windows 自動化

### 核心函式庫
- **os / pathlib** - 檔案系統操作
- **shutil** - 高階檔案操作
- **subprocess** - 執行系統命令
- **schedule** - 任務排程
- **configparser** - 配置檔案處理

### 輔助工具
- **argparse** - 命令列參數解析
- **logging** - 日誌記錄
- **json / yaml** - 資料格式處理
- **smtplib** - 郵件通知
- **psutil** - 系統資訊

## 🚀 快速開始

### 環境需求

```bash
# Python 3.8 或更高版本
python --version

# 安裝依賴
pip install -r requirements.txt
```

### 執行腳本

```bash
# 進入 automation-scripts 目錄
cd tools-utilities/automation-scripts

# 查看腳本說明
python batch_rename.py --help
python auto_backup.py --help

# 執行腳本
python batch_rename.py --preview *.txt
```

### 設定排程執行

#### Linux/Mac (crontab)
```bash
# 編輯 crontab
crontab -e

# 每天凌晨 2 點執行備份
0 2 * * * /usr/bin/python3 /path/to/auto_backup.py /data /backup

# 每週日執行清理
0 3 * * 0 /usr/bin/python3 /path/to/cleanup_old_files.py /tmp --days 7

# 每小時執行健康檢查
0 * * * * /usr/bin/python3 /path/to/system_health_check.py
```

#### Windows (Task Scheduler)
```powershell
# 使用 PowerShell 創建排程任務
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\path\to\auto_backup.py C:\data C:\backup"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "DailyBackup" -Action $action -Trigger $trigger
```

## 📁 專案結構

```
automation-scripts/
├── README.md                       # 本文件
├── requirements.txt                # Python 依賴
├── batch_rename.py                 # 批次重新命名
├── auto_backup.py                  # 自動備份
├── cleanup_old_files.py            # 清理舊檔案
├── env_setup.sh                    # 環境設定
├── log_rotator.py                  # 日誌輪替
├── system_health_check.py          # 系統健康檢查
├── configs/                        # 配置檔案
│   ├── backup_config.yaml
│   ├── cleanup_config.yaml
│   └── health_check_config.yaml
├── tests/                          # 測試檔案
│   ├── test_batch_rename.py
│   ├── test_auto_backup.py
│   └── test_cleanup.py
└── examples/                       # 範例腳本
    ├── custom_backup.sh
    ├── weekly_maintenance.sh
    └── deploy_automation.py
```

## 🤖 AI 開發工作流程

### 使用 AI 工具開發自動化腳本

1. **需求分析**
   ```
   提示詞範例:
   "開發一個 Python 腳本，用於批次重新命名檔案。
   支援添加前綴、後綴、替換文字、添加序號等功能。
   提供預覽模式和撤銷功能。
   使用 argparse 處理命令列參數。"
   ```

2. **腳本生成**
   - 使用 Claude Code 生成完整腳本
   - AI 協助處理邊界情況
   - 自動添加錯誤處理

3. **測試與優化**
   - AI 生成測試案例
   - 優化效能和可靠性
   - 改善使用者體驗

4. **文檔生成**
   - AI 協助撰寫使用說明
   - 生成範例程式碼
   - 建立故障排除指南

## 💡 最佳實踐

### 1. 安全性考量
- ✅ 使用預覽模式進行危險操作
- ✅ 實作撤銷/回復功能
- ✅ 驗證使用者輸入
- ✅ 處理權限問題
- ✅ 記錄所有操作

### 2. 錯誤處理
- ✅ 捕捉並處理異常
- ✅ 提供清晰的錯誤訊息
- ✅ 實作重試機制
- ✅ 記錄錯誤日誌
- ✅ 優雅地退出

### 3. 效能優化
- ✅ 使用批次操作
- ✅ 避免重複 I/O
- ✅ 多執行緒/多進程
- ✅ 進度顯示
- ✅ 資源清理

### 4. 可維護性
- ✅ 清晰的程式碼結構
- ✅ 配置檔案分離
- ✅ 完整的文檔
- ✅ 版本控制
- ✅ 測試覆蓋

## 📚 使用場景

### 日常維護
```bash
# 每日備份重要資料
python auto_backup.py ~/Documents ~/Backup/Documents --incremental

# 清理下載目錄
python cleanup_old_files.py ~/Downloads --days 30

# 輪替應用程式日誌
python log_rotator.py ~/app/logs/app.log --max-size 50M --keep 10
```

### 專案管理
```bash
# 批次重新命名專案檔案
python batch_rename.py --prefix "project_v2_" src/*.py

# 備份專案目錄
python auto_backup.py ~/projects/myapp ~/backups --compress tar.gz
```

### 系統管理
```bash
# 健康檢查並發送報告
python system_health_check.py --email admin@example.com

# 清理系統暫存檔
python cleanup_old_files.py /tmp --days 7 --safe-mode
```

## 🧪 測試

```bash
# 執行所有測試
pytest tests/

# 執行特定測試
pytest tests/test_batch_rename.py

# 測試覆蓋率
pytest --cov=. tests/

# 詳細輸出
pytest -v tests/
```

## 📊 腳本狀態

| 腳本 | 狀態 | 語言 | 測試 |
|------|------|------|------|
| batch_rename.py | ✅ 完成 | Python | ✅ |
| auto_backup.py | ✅ 完成 | Python | ✅ |
| cleanup_old_files.py | ✅ 完成 | Python | ✅ |
| env_setup.sh | ✅ 完成 | Bash | ✅ |
| log_rotator.py | ✅ 完成 | Python | ✅ |
| system_health_check.py | ✅ 完成 | Python | ✅ |

## 🔜 未來計劃

### 即將推出的腳本

- **database_backup.py** - 資料庫自動備份
- **docker_cleanup.py** - Docker 容器清理
- **ssl_cert_monitor.py** - SSL 憑證監控
- **git_auto_sync.py** - Git 倉庫自動同步
- **media_organizer.py** - 媒體檔案自動整理

### 改進計劃

- [ ] 新增 GUI 介面（使用 PyQt）
- [ ] 雲端備份支援（AWS S3, Google Drive）
- [ ] Webhook 通知支援
- [ ] 更多配置選項
- [ ] 性能監控儀表板

## 🤝 貢獻

歡迎貢獻新的自動化腳本或改進現有腳本！

### 貢獻指南

1. Fork 專案
2. 創建特性分支
3. 實作腳本（使用 AI 輔助）
4. 撰寫測試
5. 更新文檔
6. 提交 Pull Request

### 腳本要求

- 必須有完整的說明文檔
- 包含使用範例
- 提供錯誤處理
- 通過所有測試
- 遵循程式碼規範

## ⚠️ 注意事項

1. **備份重要資料** - 執行破壞性操作前先備份
2. **測試環境** - 先在測試環境驗證
3. **權限檢查** - 確保有足夠的權限
4. **資源監控** - 注意系統資源使用
5. **日誌檢查** - 定期檢查執行日誌

## 📄 授權

MIT License - 詳見 LICENSE 檔案

## 📞 支援

- 問題回報: GitHub Issues
- 功能建議: GitHub Discussions
- 文檔: 查看各腳本的 --help

---

**使用 AI 打造更智能的自動化腳本** 🤖

> 💡 所有腳本都使用 AI 輔助開發，展示了 AI 在自動化開發中的強大能力。
