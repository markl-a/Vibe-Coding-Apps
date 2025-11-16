# Example Project

使用 doc_generator.py 生成的範例 README

## 簡介

這是一個使用 AI 輔助開發工具建立的專案範例。

## 功能特色

- 自動化程式碼生成
- 智能程式碼格式化
- 完整的測試覆蓋
- 自動化部署流程
- 完善的文檔系統

## 安裝

```bash
# 複製專案
git clone https://github.com/example/example-project.git

# 進入目錄
cd example-project

# 安裝依賴
pip install -r requirements.txt
```

## 使用

### 開發模式

```bash
# 啟動開發伺服器
python main.py
```

### 執行測試

```bash
# 執行所有測試
python test_runner.py

# 執行特定測試
python test_runner.py tests/test_user.py

# 產生覆蓋率報告
python test_runner.py --coverage --html
```

### 程式碼格式化

```bash
# 檢查格式
python code_formatter.py src/ --check

# 自動修復
python code_formatter.py src/ --fix
```

### 部署

```bash
# 部署到測試環境
python deploy_helper.py --env staging

# 部署到生產環境
python deploy_helper.py --env production --tag v1.0.0
```

## 專案結構

```
example-project/
├── README.md
├── requirements.txt
├── src/
│   ├── main.py
│   └── models/
├── tests/
│   └── test_main.py
├── docs/
│   └── api.md
└── deploy/
    └── Dockerfile
```

## API 文檔

詳見 [API 文檔](docs/api.md)

## 開發指南

### 環境設置

1. 建立虛擬環境
2. 安裝依賴
3. 配置環境變數
4. 執行測試確認環境正常

### 貢獻流程

1. Fork 專案
2. 建立特性分支
3. 提交變更
4. 推送到分支
5. 建立 Pull Request

## 授權

MIT License

## 聯絡

- Email: dev@example.com
- 問題回報: GitHub Issues

---

使用 AI 開發工具建立 ⚡
