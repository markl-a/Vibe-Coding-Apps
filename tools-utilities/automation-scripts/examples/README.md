# Automation Scripts - 使用範例

這個目錄包含了所有自動化腳本工具的實用範例。每個範例都是可以直接執行或參考的腳本。

## 目錄結構

```
examples/
├── README.md                           # 本文件
├── git_auto_sync_example.sh           # Git 自動同步範例
├── docker_cleanup_example.sh          # Docker 清理範例
├── cleanup_old_files_example.sh       # 舊檔案清理範例
├── system_health_check_example.sh     # 系統健康檢查範例
├── batch_rename_example.sh            # 批次重新命名範例
├── auto_backup_example.sh             # 自動備份範例
└── log_rotator_example.sh             # 日誌輪替範例
```

## 工具列表

### 1. Git Auto Sync (git_auto_sync.py)

**功能：** 自動同步多個 Git 倉庫，支援拉取、推送和狀態檢查。

**主要特性：**
- 單個或多個倉庫同步
- 自動提交未提交的更改
- 支援 rebase 模式
- 遞迴搜索子目錄中的 Git 倉庫
- JSON 輸出格式

**基本用法：**

```bash
# 查看單個倉庫狀態
python3 git_auto_sync.py /path/to/repo --status-only

# 同步單個倉庫
python3 git_auto_sync.py /path/to/repo

# 只拉取不推送
python3 git_auto_sync.py /path/to/repo --no-push

# 自動提交並同步
python3 git_auto_sync.py /path/to/repo --commit --message "Auto sync"

# 遞迴同步目錄下的所有倉庫
python3 git_auto_sync.py /path/to/projects --recursive
```

**常見場景：**

1. **每日自動同步（crontab）**
   ```bash
   # 每天凌晨 2 點自動同步所有項目
   0 2 * * * python3 /path/to/git_auto_sync.py ~/projects --recursive --no-push
   ```

2. **使用設定檔管理多個倉庫**
   ```json
   {
     "repos": [
       "/home/user/project1",
       "/home/user/project2",
       "/home/user/project3"
     ]
   }
   ```
   ```bash
   python3 git_auto_sync.py --config repos.json
   ```

**預期輸出：**
```
================================================================================
Git 倉庫同步報告
================================================================================

[1] my-project - ✓ 成功
路徑: /home/user/my-project
  ✓ PULL: Already up to date.
  ✓ PUSH: Everything up-to-date

================================================================================
總計: 1 個倉庫, 成功: 1, 失敗: 0
================================================================================
```

---

### 2. Docker Cleanup (docker_cleanup.py)

**功能：** 自動清理 Docker 容器、映像、卷和網路，釋放磁碟空間。

**主要特性：**
- 清理已停止的容器
- 移除懸空映像（dangling images）
- 清理未使用的卷
- 清理未使用的網路
- 系統級清理（docker system prune）
- 預覽模式

**基本用法：**

```bash
# 清理已停止的容器
python3 docker_cleanup.py --stopped-containers

# 清理懸空映像
python3 docker_cleanup.py --dangling-images

# 清理未使用的卷
python3 docker_cleanup.py --unused-volumes

# 清理所有未使用的資源（不包含卷）
python3 docker_cleanup.py --all

# 完整清理（包含卷）
python3 docker_cleanup.py --all --volumes

# 預覽模式
python3 docker_cleanup.py --all --dry-run

# 系統清理
python3 docker_cleanup.py --system-prune
```

**常見場景：**

1. **每週自動清理（crontab）**
   ```bash
   # 每週日凌晨 3 點執行清理
   0 3 * * 0 python3 /path/to/docker_cleanup.py --all
   ```

2. **磁碟空間不足緊急清理**
   ```bash
   # 檢查磁碟使用率，超過 90% 執行清理
   if [ $(df / | tail -1 | awk '{print $5}' | sed 's/%//') -gt 90 ]; then
       python3 docker_cleanup.py --all --volumes
   fi
   ```

**預期輸出：**
```
================================================================================
Docker 清理報告
================================================================================

[stopped_containers]
找到: 5 個
已刪除: 5 個
失敗: 0 個

[dangling_images]
找到: 3 個
已刪除: 3 個
失敗: 0 個

================================================================================
總計刪除: 8 個資源
================================================================================
```

---

### 3. Cleanup Old Files (cleanup_old_files.py)

**功能：** 自動清理指定目錄中的舊檔案，支援多種過濾條件。

**主要特性：**
- 按檔案年齡過濾（天數）
- 按檔案大小過濾
- 支援檔案名稱模式匹配
- 安全模式（移至垃圾桶）
- 遞迴處理子目錄
- 預覽模式

**基本用法：**

```bash
# 刪除 30 天前的檔案
python3 cleanup_old_files.py /tmp --days 30

# 清理大於 100MB 的檔案
python3 cleanup_old_files.py ~/Downloads --size-gt 100M

# 清理小於 1KB 的空檔案
python3 cleanup_old_files.py /tmp --size-lt 1K

# 只清理 .log 檔案
python3 cleanup_old_files.py /var/log --pattern "*.log" --days 7

# 安全模式（移至垃圾桶）
python3 cleanup_old_files.py /temp --days 7 --safe-mode

# 預覽模式
python3 cleanup_old_files.py /data --days 90 --dry-run

# 遞迴清理子目錄
python3 cleanup_old_files.py ~/projects --days 180 --recursive
```

**常見場景：**

1. **清理暫存目錄**
   ```bash
   # 清理系統暫存目錄（30 天前）
   python3 cleanup_old_files.py /tmp --days 30 --force

   # 清理下載目錄（90 天前）
   python3 cleanup_old_files.py ~/Downloads --days 90 --force
   ```

2. **清理備份檔案**
   ```bash
   # 保留最近 30 天的備份
   python3 cleanup_old_files.py ~/backups --days 30 --pattern "*.tar.gz" --dry-run
   ```

**預期輸出：**
```
清理結果：
--------------------------------------------------------------------------------
成功: 15 個檔案
失敗: 0 個檔案
釋放空間: 245.67 MB
--------------------------------------------------------------------------------
```

---

### 4. System Health Check (system_health_check.py)

**功能：** 定期檢查系統狀態並生成報告，支援 CPU、記憶體、磁碟、網路等檢查。

**主要特性：**
- CPU 使用率檢查
- 記憶體使用率檢查
- 磁碟空間檢查
- 網路狀態檢查
- 進程監控
- 系統運行時間檢查
- 自定義告警閾值
- JSON 輸出格式

**基本用法：**

```bash
# 執行所有檢查
python3 system_health_check.py

# 只檢查 CPU 和記憶體
python3 system_health_check.py --check cpu,memory

# 設定自定義告警閾值
python3 system_health_check.py --cpu-alert 90 --mem-alert 95 --disk-alert 90

# 輸出 JSON 格式
python3 system_health_check.py --output json > health_report.json

# 只檢查磁碟空間
python3 system_health_check.py --check disk --disk-alert 80
```

**常見場景：**

1. **每小時健康檢查（crontab）**
   ```bash
   # 每小時執行一次健康檢查
   0 * * * * python3 /path/to/system_health_check.py --cpu-alert 80 >> /var/log/health.log
   ```

2. **告警通知**
   ```bash
   python3 system_health_check.py --cpu-alert 85
   if [ $? -eq 1 ] || [ $? -eq 2 ]; then
       mail -s "系統健康告警" admin@example.com < health_report.txt
   fi
   ```

**預期輸出：**
```
================================================================================
系統健康檢查報告
================================================================================
時間: 2025-11-17T10:30:00
主機: myserver
平台: Linux-4.4.0-x86_64-with-glibc2.31
整體狀態: OK
================================================================================

[CPU] - OK
--------------------------------------------------------------------------------
使用率: 35.2%
核心數: 4 物理 / 8 邏輯

[MEMORY] - OK
--------------------------------------------------------------------------------
記憶體: 8.5GB / 16.0GB (53.1%)
Swap: 0.2GB / 4.0GB (5.0%)

[DISK] - OK
--------------------------------------------------------------------------------
/: 45.2GB / 100.0GB (45%)
/home: 120.5GB / 500.0GB (24%)

================================================================================
```

**退出碼：**
- `0` - 系統正常
- `1` - 有警告
- `2` - 有錯誤

---

### 5. Batch Rename (batch_rename.py)

**功能：** 批次重新命名檔案，支援多種命名規則。

**主要特性：**
- 添加前綴/後綴
- 文字替換（支援不區分大小寫）
- 添加序號
- 正規表達式重新命名
- 大小寫轉換
- 預覽模式
- 撤銷功能

**基本用法：**

```bash
# 添加前綴
python3 batch_rename.py --prefix "IMG_" *.jpg

# 添加後綴（在副檔名前）
python3 batch_rename.py --suffix "_backup" *.txt

# 替換文字
python3 batch_rename.py --replace "old" "new" *

# 添加序號
python3 batch_rename.py --numbering *.pdf

# 自定義序號格式
python3 batch_rename.py --numbering --start 10 --digits 5 --separator "-" *.jpg

# 正規表達式重新命名
python3 batch_rename.py --regex "(\d{4})-(\d{2})" "\2-\1" *

# 轉換為小寫
python3 batch_rename.py --lowercase *.TXT

# 預覽模式
python3 batch_rename.py --prefix "IMG_" *.jpg --preview

# 撤銷上次操作
python3 batch_rename.py --undo
```

**常見場景：**

1. **整理照片檔案**
   ```bash
   # 添加日期前綴和序號
   python3 batch_rename.py \
       --prefix "$(date +'%Y%m%d')_" \
       --numbering \
       --start 1 \
       --digits 4 \
       *.jpg
   ```

2. **清理檔名中的空格**
   ```bash
   # 將空格替換為底線
   python3 batch_rename.py --replace " " "_" *
   ```

**預期輸出：**
```
找到 10 個檔案

=== 預覽模式（不會實際重新命名） ===

✓ 成功: 10 個檔案
  /home/user/photo1.jpg
  -> /home/user/IMG_photo1.jpg

  /home/user/photo2.jpg
  -> /home/user/IMG_photo2.jpg

  ...

提示: 移除 --preview 參數以實際執行重新命名
```

---

### 6. Auto Backup (auto_backup.py)

**功能：** 自動備份檔案和目錄，支援完整備份和增量備份。

**主要特性：**
- 完整備份
- 增量備份（只備份變更的檔案）
- 多種壓縮格式（zip, tar, tar.gz）
- 備份驗證
- 自動清理舊備份
- 排除特定檔案
- 模擬執行

**基本用法：**

```bash
# 完整備份
python3 auto_backup.py /source /backup

# 增量備份
python3 auto_backup.py /source /backup --incremental

# 壓縮備份（ZIP）
python3 auto_backup.py /source /backup --compress zip

# 壓縮備份（TAR.GZ）
python3 auto_backup.py /source /backup --compress tar.gz

# 保留最近 7 個備份
python3 auto_backup.py /source /backup --keep 7

# 排除特定檔案
python3 auto_backup.py /source /backup --exclude "*.tmp,*.log,*.cache"

# 驗證備份
python3 auto_backup.py /source /backup --compress zip --verify

# 模擬執行
python3 auto_backup.py /source /backup --dry-run
```

**常見場景：**

1. **每日自動備份（crontab）**
   ```bash
   # 每天凌晨 2 點執行增量備份
   0 2 * * * python3 /path/to/auto_backup.py \
       ~/Documents \
       /mnt/backup \
       --incremental \
       --compress tar.gz \
       --keep 30
   ```

2. **每週完整備份**
   ```bash
   # 每週日執行完整備份
   0 1 * * 0 python3 /path/to/auto_backup.py \
       ~/Projects \
       /mnt/backup/weekly \
       --compress tar.gz \
       --keep 8
   ```

3. **備份到遠端伺服器**
   ```bash
   # 備份並上傳到遠端
   python3 auto_backup.py ~/Documents /tmp/backup --compress tar.gz
   scp /tmp/backup/*.tar.gz user@remote:/backups/
   ```

**預期輸出：**
```
開始備份: /home/user/Documents -> /mnt/backup
模式: 增量
壓縮: tar.gz

=== 備份完成 ===
備份位置: /mnt/backup/Documents_20251117_143000.tar.gz
已複製: 145 個檔案
已跳過: 1023 個檔案
總大小: 234.56 MB

✓ 備份驗證成功

清理舊備份（保留最近 7 個）...
已刪除舊備份: Documents_20251010_020000.tar.gz
```

---

### 7. Log Rotator (log_rotator.py)

**功能：** 自動化日誌檔案管理和輪替，支援基於大小和時間的輪替策略。

**主要特性：**
- 基於大小輪替
- 基於時間輪替（每日、每週、每月）
- 強制輪替
- 日誌壓縮（gzip）
- 自動清理舊日誌
- 列出所有備份

**基本用法：**

```bash
# 基於大小輪替（超過 10MB）
python3 log_rotator.py /var/log/app.log --max-size 10M

# 每日輪替
python3 log_rotator.py /var/log/app.log --daily

# 每週輪替
python3 log_rotator.py /var/log/app.log --weekly

# 每月輪替
python3 log_rotator.py /var/log/app.log --monthly

# 輪替並壓縮
python3 log_rotator.py /var/log/app.log --daily --compress

# 保留最近 30 個備份
python3 log_rotator.py /var/log/app.log --daily --keep 30

# 強制輪替
python3 log_rotator.py /var/log/app.log --force

# 列出所有備份
python3 log_rotator.py /var/log/app.log --list
```

**常見場景：**

1. **每日自動輪替（crontab）**
   ```bash
   # 每天凌晨 0 點執行日誌輪替
   0 0 * * * python3 /path/to/log_rotator.py \
       /var/log/app.log \
       --daily \
       --compress \
       --keep 30
   ```

2. **基於大小的自動輪替**
   ```bash
   # 每小時檢查，超過 100MB 則輪替
   0 * * * * python3 /path/to/log_rotator.py \
       /var/log/app.log \
       --max-size 100M \
       --compress \
       --keep 20
   ```

3. **多個應用的日誌輪替**
   ```bash
   #!/bin/bash
   LOGS=(
       "/var/log/app1/app.log"
       "/var/log/app2/app.log"
       "/var/log/nginx/access.log"
   )

   for LOG in "${LOGS[@]}"; do
       python3 log_rotator.py "$LOG" --daily --compress --keep 30
   done
   ```

**預期輸出：**
```
2025-11-17 14:30:00 - INFO - 輪替日誌: /var/log/app.log -> /var/log/app.20251117_143000.log
2025-11-17 14:30:00 - INFO - 創建新日誌檔案: /var/log/app.log
2025-11-17 14:30:00 - INFO - 壓縮檔案: /var/log/app.20251117_143000.log -> /var/log/app.20251117_143000.log.gz
2025-11-17 14:30:00 - INFO - 已刪除源檔案: /var/log/app.20251117_143000.log
2025-11-17 14:30:00 - INFO - 刪除舊備份: /var/log/app.20251010_020000.log.gz
2025-11-17 14:30:00 - INFO - 日誌輪替完成
```

---

## 最佳實踐

### 1. 使用 Crontab 自動化

所有工具都可以整合到 crontab 中實現自動化：

```bash
# 編輯 crontab
crontab -e

# 範例任務
0 2 * * * /path/to/git_auto_sync.py ~/projects --recursive
0 3 * * 0 /path/to/docker_cleanup.py --all
0 0 * * * /path/to/log_rotator.py /var/log/app.log --daily
```

### 2. 日誌記錄

建議將所有自動化任務的輸出記錄到日誌檔案：

```bash
python3 script.py >> /var/log/automation.log 2>&1
```

### 3. 錯誤通知

整合郵件通知以便及時發現問題：

```bash
python3 script.py || mail -s "Script Error" admin@example.com
```

### 4. 預覽模式

在生產環境執行前，先使用預覽模式（`--dry-run` 或 `--preview`）測試：

```bash
python3 cleanup_old_files.py /important --days 7 --dry-run
```

### 5. 備份策略

遵循 3-2-1 備份原則：
- **3** 份副本
- **2** 種不同媒體
- **1** 份異地備份

### 6. 監控和告警

定期檢查工具的執行狀態並設置告警：

```bash
python3 system_health_check.py --cpu-alert 85
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    # 發送告警
fi
```

---

## 常見問題

### Q: 如何讓腳本在背景執行？

A: 使用 `nohup` 或 `screen`：
```bash
nohup python3 script.py &
```

### Q: 如何設定權限？

A: 使用 `chmod` 設定執行權限：
```bash
chmod +x script.py
```

### Q: 如何查看工具的詳細幫助？

A: 使用 `--help` 參數：
```bash
python3 script.py --help
```

### Q: 如何處理大量檔案？

A: 使用批次處理或分批執行，避免一次處理過多檔案。

### Q: 備份失敗如何恢復？

A: 定期測試還原流程，確保備份可用。

---

## 進階使用

### 整合到監控系統

將健康檢查整合到 Prometheus、Grafana 等監控系統：

```bash
python3 system_health_check.py --output json | \
    jq -r '.checks.cpu.usage_percent' | \
    curl -X POST -d @- http://pushgateway:9091/metrics/job/health_check
```

### 建立完整的自動化流程

結合多個工具建立完整的自動化流程：

```bash
#!/bin/bash
# 完整的系統維護腳本

# 1. 檢查系統健康
python3 system_health_check.py --cpu-alert 90

# 2. 清理舊檔案
python3 cleanup_old_files.py /tmp --days 7 --force

# 3. 輪替日誌
python3 log_rotator.py /var/log/app.log --daily --compress

# 4. 清理 Docker
python3 docker_cleanup.py --all

# 5. 備份重要數據
python3 auto_backup.py ~/Documents /mnt/backup --incremental --compress tar.gz

# 6. 同步 Git 倉庫
python3 git_auto_sync.py ~/projects --recursive --no-push
```

---

## 支援和貢獻

如有問題或建議，歡迎：
1. 查看工具的 `--help` 文檔
2. 檢查日誌檔案
3. 提交 Issue 或 Pull Request

---

## 授權

這些工具按原樣提供，使用前請先在測試環境中驗證。

**最後更新：** 2025-11-17
