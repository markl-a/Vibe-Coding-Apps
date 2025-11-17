# Dependency Checker 範例

這個目錄包含依賴檢查的範例，展示 `dependency_checker.py` 的功能。

## 檔案說明

- `requirements.txt` - 標準依賴檔案範例
- `requirements-dev.txt` - 開發環境依賴範例
- `requirements-outdated.txt` - 包含過時依賴的範例（用於測試）
- `setup.py` - Python 專案設定檔範例
- `pyproject.toml` - 現代 Python 專案配置範例

## 使用範例

### 1. 基本依賴檢查

```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/dev-tools

# 檢查專案依賴
python dependency_checker.py

# 檢查特定 requirements 檔案
python dependency_checker.py --file examples/dependency_examples/requirements.txt
```

### 2. 檢查過時的依賴

```bash
# 檢查所有過時的套件
python dependency_checker.py --outdated

# 顯示可更新的版本
python dependency_checker.py --outdated --show-latest

# 使用範例過時檔案
python dependency_checker.py \
    --file examples/dependency_examples/requirements-outdated.txt \
    --outdated
```

### 3. 安全漏洞掃描

```bash
# 掃描安全漏洞
python dependency_checker.py --security

# 只顯示高危漏洞
python dependency_checker.py --security --severity high

# 產生安全報告
python dependency_checker.py --security --report security_report.json
```

### 4. 完整檢查

```bash
# 執行所有檢查
python dependency_checker.py --all

# 包含詳細資訊
python dependency_checker.py --all --verbose

# 產生完整報告
python dependency_checker.py --all --report dependency_report.json
```

### 5. 檢查相容性

```bash
# 檢查套件相容性
python dependency_checker.py --check-conflicts

# 檢查 Python 版本相容性
python dependency_checker.py --python-version 3.11

# 檢查所有相容性問題
python dependency_checker.py --compatibility
```

### 6. 授權檢查

```bash
# 檢查套件授權
python dependency_checker.py --licenses

# 只顯示特定授權
python dependency_checker.py --licenses --license-filter "MIT,Apache"

# 檢查不相容的授權
python dependency_checker.py --license-check
```

### 7. 更新依賴

```bash
# 產生更新建議
python dependency_checker.py --update-suggestions

# 自動更新 requirements.txt（備份原檔案）
python dependency_checker.py --update --backup

# 只更新小版本
python dependency_checker.py --update --minor-only
```

## 依賴檢查項目

### 1. 版本檢查

- 檢查已安裝版本
- 檢查 requirements 中指定的版本
- 比對版本是否一致

### 2. 過時檢查

- 檢查是否有新版本可用
- 顯示當前版本與最新版本差距
- 提供更新建議

### 3. 安全檢查

- 檢查已知的 CVE 漏洞
- 檢查安全公告
- 評估漏洞嚴重性

### 4. 相容性檢查

- 檢查套件之間的依賴衝突
- 檢查 Python 版本相容性
- 檢查作業系統相容性

### 5. 授權檢查

- 識別每個套件的授權
- 檢查授權相容性
- 標記潛在的授權問題

## 報告格式範例

### JSON 報告

```json
{
  "summary": {
    "total_packages": 45,
    "outdated": 5,
    "vulnerabilities": 2,
    "conflicts": 0
  },
  "outdated_packages": [
    {
      "name": "flask",
      "current": "2.0.0",
      "latest": "2.3.0",
      "update_type": "minor"
    }
  ],
  "vulnerabilities": [
    {
      "package": "pyyaml",
      "version": "5.3.1",
      "cve": "CVE-2020-14343",
      "severity": "high",
      "fixed_in": "5.4"
    }
  ]
}
```

### 文字報告

```
依賴檢查報告
====================

總套件數: 45
過時套件: 5
安全漏洞: 2
衝突: 0

過時的套件:
-----------
  flask (2.0.0 → 2.3.0)
  django (3.2.0 → 4.2.0)

安全漏洞:
---------
  [高危] pyyaml 5.3.1 - CVE-2020-14343
  修復版本: 5.4
```

## 最佳實踐

### 1. 版本固定

```txt
# 好的做法 - 固定版本
flask==2.3.0
requests==2.31.0

# 避免 - 不固定版本
flask
requests>=2.0.0
```

### 2. 分離依賴

```
requirements/
├── base.txt          # 基礎依賴
├── dev.txt          # 開發依賴
├── test.txt         # 測試依賴
└── production.txt   # 生產依賴
```

### 3. 使用 pip-tools

```bash
# 產生固定版本的依賴
pip-compile requirements.in

# 同步安裝
pip-sync requirements.txt
```

### 4. 定期更新

```bash
# 每週執行一次
python dependency_checker.py --outdated

# 每月執行一次
python dependency_checker.py --security
```

## 整合到 CI/CD

### GitHub Actions

```yaml
name: Dependency Check

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check dependencies
        run: |
          python dependency_checker.py --all --report report.json
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: dependency-report
          path: report.json
```

### GitLab CI

```yaml
dependency-check:
  script:
    - python dependency_checker.py --security --report security.json
  artifacts:
    reports:
      dependency_scanning: security.json
  only:
    - merge_requests
    - main
```

## 安全掃描工具整合

dependency_checker.py 可以與以下工具整合：

1. **Safety** - Python 套件安全檢查
2. **Snyk** - 全方位安全掃描
3. **Dependabot** - GitHub 自動更新
4. **Renovate** - 依賴更新自動化

## 常見問題

### Q: 如何處理過時的依賴？

```bash
# 1. 檢查過時狀態
python dependency_checker.py --outdated

# 2. 查看變更日誌
# 訪問套件的 GitHub/PyPI 頁面

# 3. 在開發環境測試更新
pip install --upgrade package_name

# 4. 執行完整測試
python test_runner.py

# 5. 更新 requirements.txt
pip freeze > requirements.txt
```

### Q: 如何修復安全漏洞？

```bash
# 1. 識別漏洞
python dependency_checker.py --security

# 2. 更新到安全版本
pip install --upgrade vulnerable_package

# 3. 驗證修復
python dependency_checker.py --security

# 4. 提交變更
git commit -am "fix: upgrade package to fix CVE-xxxx"
```

### Q: 如何解決依賴衝突？

```bash
# 1. 識別衝突
python dependency_checker.py --check-conflicts

# 2. 分析依賴樹
pip install pipdeptree
pipdeptree

# 3. 調整版本約束
# 編輯 requirements.txt

# 4. 重新安裝
pip install -r requirements.txt
```

## 自動化腳本範例

### 每日依賴檢查

```bash
#!/bin/bash
# daily_dependency_check.sh

DATE=$(date +%Y%m%d)
REPORT_DIR="dependency_reports"

mkdir -p $REPORT_DIR

python dependency_checker.py \
    --all \
    --report "$REPORT_DIR/report_$DATE.json"

# 如果發現問題，發送通知
if [ $? -ne 0 ]; then
    echo "發現依賴問題！" | mail -s "依賴檢查警報" team@example.com
fi
```

### 更新依賴腳本

```bash
#!/bin/bash
# update_dependencies.sh

# 備份
cp requirements.txt requirements.txt.backup

# 更新
python dependency_checker.py --update --minor-only

# 測試
python test_runner.py

if [ $? -eq 0 ]; then
    echo "更新成功！"
    rm requirements.txt.backup
else
    echo "測試失敗，恢復備份"
    mv requirements.txt.backup requirements.txt
fi
```

## 進階功能

### 1. 自訂安全資料庫

```bash
python dependency_checker.py \
    --security \
    --security-db custom_vulnerabilities.json
```

### 2. 依賴圖視覺化

```bash
python dependency_checker.py --graph dependency_graph.png
```

### 3. 批次檢查多個專案

```bash
python dependency_checker.py \
    --projects project1,project2,project3 \
    --report combined_report.json
```
