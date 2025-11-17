# 快速開始指南

這是一個快速參考指南，幫助您快速上手所有自動化工具。

## 目錄

1. [Git Auto Sync](#1-git-auto-sync) - Git 倉庫自動同步
2. [Docker Cleanup](#2-docker-cleanup) - Docker 清理
3. [Cleanup Old Files](#3-cleanup-old-files) - 清理舊檔案
4. [System Health Check](#4-system-health-check) - 系統健康檢查
5. [Batch Rename](#5-batch-rename) - 批次重新命名
6. [Auto Backup](#6-auto-backup) - 自動備份
7. [Log Rotator](#7-log-rotator) - 日誌輪替

---

## 1. Git Auto Sync

**一句話介紹：** 自動同步多個 Git 倉庫

**最常用的 3 個指令：**

```bash
# 查看倉庫狀態
python3 ../git_auto_sync.py /path/to/repo --status-only

# 同步單個倉庫（拉取 + 推送）
python3 ../git_auto_sync.py /path/to/repo

# 遞迴同步目錄下所有倉庫
python3 ../git_auto_sync.py ~/projects --recursive
```

**查看完整範例：**
```bash
./git_auto_sync_example.sh
```

---

## 2. Docker Cleanup

**一句話介紹：** 清理 Docker 資源，釋放磁碟空間

**最常用的 3 個指令：**

```bash
# 預覽要清理的內容
python3 ../docker_cleanup.py --all --dry-run

# 清理所有未使用的資源（不含卷）
python3 ../docker_cleanup.py --all

# 完整清理（含卷）- 謹慎使用
python3 ../docker_cleanup.py --all --volumes
```

**查看完整範例：**
```bash
./docker_cleanup_example.sh
```

---

## 3. Cleanup Old Files

**一句話介紹：** 自動清理舊檔案，釋放磁碟空間

**最常用的 3 個指令：**

```bash
# 預覽要刪除的檔案
python3 ../cleanup_old_files.py /tmp --days 30 --dry-run

# 刪除 30 天前的檔案
python3 ../cleanup_old_files.py /tmp --days 30

# 安全模式（移至垃圾桶）
python3 ../cleanup_old_files.py /tmp --days 30 --safe-mode
```

**查看完整範例：**
```bash
./cleanup_old_files_example.sh
```

---

## 4. System Health Check

**一句話介紹：** 檢查系統健康狀態（CPU、記憶體、磁碟等）

**最常用的 3 個指令：**

```bash
# 執行所有檢查
python3 ../system_health_check.py

# 只檢查關鍵資源
python3 ../system_health_check.py --check cpu,memory,disk

# 輸出 JSON 格式
python3 ../system_health_check.py --output json > health.json
```

**退出碼說明：**
- `0` = 正常
- `1` = 警告
- `2` = 錯誤

**查看完整範例：**
```bash
./system_health_check_example.sh
```

---

## 5. Batch Rename

**一句話介紹：** 批次重新命名檔案

**最常用的 3 個指令：**

```bash
# 預覽重新命名
python3 ../batch_rename.py --prefix "IMG_" *.jpg --preview

# 添加前綴
python3 ../batch_rename.py --prefix "IMG_" *.jpg

# 添加序號
python3 ../batch_rename.py --numbering *.pdf
```

**撤銷操作：**
```bash
python3 ../batch_rename.py --undo
```

**查看完整範例：**
```bash
./batch_rename_example.sh
```

---

## 6. Auto Backup

**一句話介紹：** 自動備份檔案和目錄

**最常用的 3 個指令：**

```bash
# 模擬備份
python3 ../auto_backup.py /source /backup --dry-run

# 完整備份 + 壓縮
python3 ../auto_backup.py /source /backup --compress tar.gz

# 增量備份 + 壓縮 + 驗證
python3 ../auto_backup.py /source /backup --incremental --compress tar.gz --verify
```

**查看完整範例：**
```bash
./auto_backup_example.sh
```

---

## 7. Log Rotator

**一句話介紹：** 自動輪替和管理日誌檔案

**最常用的 3 個指令：**

```bash
# 列出所有備份
python3 ../log_rotator.py /var/log/app.log --list

# 每日輪替 + 壓縮
python3 ../log_rotator.py /var/log/app.log --daily --compress

# 基於大小輪替（超過 100MB）
python3 ../log_rotator.py /var/log/app.log --max-size 100M --compress
```

**查看完整範例：**
```bash
./log_rotator_example.sh
```

---

## 自動化設定（Crontab）

### 設定 Crontab

```bash
# 編輯 crontab
crontab -e
```

### 推薦的自動化任務

```bash
# 每天凌晨 2 點同步 Git 倉庫
0 2 * * * python3 /path/to/git_auto_sync.py ~/projects --recursive --no-push

# 每週日凌晨 3 點清理 Docker
0 3 * * 0 python3 /path/to/docker_cleanup.py --all

# 每天凌晨 0 點輪替日誌
0 0 * * * python3 /path/to/log_rotator.py /var/log/app.log --daily --compress

# 每小時執行系統健康檢查
0 * * * * python3 /path/to/system_health_check.py --cpu-alert 85

# 每天凌晨 1 點備份重要資料
0 1 * * * python3 /path/to/auto_backup.py ~/Documents /mnt/backup --incremental --compress tar.gz

# 每週清理暫存檔案
0 4 * * 0 python3 /path/to/cleanup_old_files.py /tmp --days 7 --force
```

---

## 常用參數說明

### 通用參數

- `--help` / `-h` - 顯示幫助資訊
- `--verbose` / `-v` - 顯示詳細資訊
- `--dry-run` - 預覽模式（不實際執行）
- `--force` / `-f` - 強制執行（不需確認）

### 大小單位

- `K` - KB (1024 bytes)
- `M` - MB (1024 KB)
- `G` - GB (1024 MB)
- `T` - TB (1024 GB)

範例：`--size-gt 100M` 表示大於 100MB

---

## 最佳實踐

### 1. 先預覽，再執行

```bash
# 先用 --dry-run 或 --preview 查看結果
python3 script.py --dry-run

# 確認無誤後再實際執行
python3 script.py
```

### 2. 記錄日誌

```bash
# 將輸出記錄到日誌檔案
python3 script.py >> /var/log/automation.log 2>&1
```

### 3. 設定告警

```bash
# 執行失敗時發送郵件
python3 script.py || mail -s "Script Failed" admin@example.com
```

### 4. 定期檢查

定期檢查自動化任務的執行狀態：

```bash
# 查看 crontab 日誌
grep CRON /var/log/syslog

# 查看特定任務的日誌
tail -f /var/log/automation.log
```

---

## 故障排查

### 權限問題

```bash
# 設定執行權限
chmod +x script.py

# 以 root 權限執行（謹慎使用）
sudo python3 script.py
```

### Python 模組缺失

```bash
# 安裝所需模組
pip install -r ../requirements.txt
```

### 找不到 Python

```bash
# 使用完整路徑
/usr/bin/python3 script.py

# 或在腳本開頭加入 shebang
#!/usr/bin/env python3
```

---

## 進階技巧

### 1. 組合多個工具

```bash
#!/bin/bash
# 完整的系統維護流程

# 健康檢查
python3 system_health_check.py --cpu-alert 90 || exit 1

# 清理舊檔案
python3 cleanup_old_files.py /tmp --days 7 --force

# 輪替日誌
python3 log_rotator.py /var/log/app.log --daily --compress

# 清理 Docker
python3 docker_cleanup.py --all

# 備份
python3 auto_backup.py ~/Documents /mnt/backup --incremental --compress tar.gz
```

### 2. 使用設定檔

許多工具支援設定檔，便於管理複雜的配置：

```json
{
  "repos": [
    "/home/user/project1",
    "/home/user/project2"
  ]
}
```

```bash
python3 git_auto_sync.py --config repos.json
```

### 3. 整合監控系統

將輸出整合到監控系統：

```bash
python3 system_health_check.py --output json | \
    jq -r '.checks.cpu.usage_percent' | \
    curl -X POST -d @- http://monitoring-server/metrics
```

---

## 獲取幫助

### 查看工具文檔

```bash
python3 ../script.py --help
```

### 查看詳細範例

```bash
# 每個工具都有詳細的範例腳本
./tool_name_example.sh
```

### 查閱完整文檔

```bash
# 閱讀 README.md
cat README.md
```

---

## 安全提醒

1. **備份重要數據** - 在使用清理工具前務必備份
2. **使用預覽模式** - 先用 `--dry-run` 檢查結果
3. **謹慎使用 --force** - 避免誤刪重要檔案
4. **限制權限** - 避免以 root 權限執行非必要的任務
5. **定期測試** - 定期測試備份的還原流程

---

**建議：** 從查看範例腳本開始，了解每個工具的實際使用方式！

```bash
# 查看所有範例
ls -lh *.sh

# 執行特定範例
./git_auto_sync_example.sh
```
