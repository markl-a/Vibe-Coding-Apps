# Slack AI 聊天機器人

將 AI 助手整合到 Slack 工作空間。

## 功能特點

- ✅ @提及機器人互動
- ✅ 直接訊息對話
- ✅ 斜線命令支援
- ✅ 對話上下文記憶
- ✅ Slack 格式化訊息

## 快速開始

### 1. 安裝依賴

```bash
pip install -r requirements.txt
```

### 2. 創建 Slack App

1. 前往 https://api.slack.com/apps
2. 創建新 App
3. 配置 OAuth Scopes 和 Event Subscriptions

### 3. 設定環境變數

```bash
cp .env.example .env
```

填入 Bot Token、App Token 和 OpenAI API Key。

### 4. 執行機器人

```bash
python slack_bot.py
```

更多詳細設定請參考 Slack API 文件。
