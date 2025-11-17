# Telegram AI 聊天機器人

功能完整的 Telegram 聊天機器人，整合 OpenAI GPT 提供智能對話服務。

## 功能特點

- ✅ 智能對話（基於 GPT-3.5/GPT-4）
- ✅ 對話歷史記憶
- ✅ 多命令支援
- ✅ 互動式按鈕
- ✅ 繁體中文優化
- ✅ 範例問題展示

## 快速開始

### 1. 安裝依賴

```bash
pip install -r requirements.txt
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 文件，填入你的 Token 和 API 金鑰。

### 3. 獲取 Telegram Bot Token

1. 在 Telegram 中找到 @BotFather
2. 發送 `/newbot` 命令
3. 按照指示設定機器人名稱
4. 複製獲得的 Token

### 4. 執行機器人

```bash
python telegram_bot.py
```

## 使用指南

### 可用命令

- `/start` - 開始使用
- `/help` - 顯示幫助
- `/ask <問題>` - 詢問問題
- `/clear` - 清除歷史

更多詳細說明請參考原始碼註解。
