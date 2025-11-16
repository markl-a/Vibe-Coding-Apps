# Slack Bot - Slack 整合聊天機器人

💬 將 AI 聊天機器人整合到 Slack 工作空間，提升團隊協作效率

## 功能特點

- ✅ Slack 工作空間整合
- ✅ 斜線命令支援
- ✅ 提及回應 (@bot)
- ✅ 私訊對話
- ✅ 頻道訊息處理
- ✅ 互動式按鈕和選單
- ✅ 檔案處理
- ✅ 執行緒回覆
- ✅ 表情符號反應
- ✅ 使用者資訊追蹤

## 快速開始

### 1. 建立 Slack App

1. 前往 [Slack API](https://api.slack.com/apps)
2. 點擊「Create New App」
3. 選擇「From scratch」
4. 輸入應用程式名稱和選擇工作空間

### 2. 設定權限

在「OAuth & Permissions」中添加以下 Bot Token Scopes：

```
app_mentions:read
channels:history
channels:read
chat:write
files:read
im:history
im:read
im:write
users:read
```

### 3. 安裝到工作空間

1. 在「Install App」頁面點擊「Install to Workspace」
2. 授權應用程式
3. 複製「Bot User OAuth Token」

### 4. 啟用 Event Subscriptions

1. 在「Event Subscriptions」中啟用 Events
2. 設定 Request URL（稍後由 ngrok 提供）
3. 訂閱以下 Bot Events：
   - `app_mention`
   - `message.im`
   - `message.channels`

### 5. 配置環境變數

```bash
cp .env.example .env
```

編輯 `.env`:
```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
OPENAI_API_KEY=your-openai-api-key
```

### 6. 執行機器人

```bash
# 安裝依賴
pip install -r requirements.txt

# 執行機器人
python slack_bot.py
```

### 7. 設定 ngrok（開發環境）

```bash
# 安裝 ngrok
# 執行 ngrok
ngrok http 3000

# 將 ngrok URL 複製到 Slack Event Subscriptions 的 Request URL
# 例如：https://abc123.ngrok.io/slack/events
```

## 使用方式

### 提及機器人

在任何頻道中提及機器人：

```
@YourBot 請解釋什麼是機器學習？
```

### 斜線命令

使用自定義命令：

```
/ask 什麼是深度學習？
/help 顯示幫助訊息
/clear 清除對話歷史
```

### 私訊

直接與機器人私訊對話：

```
你好！我想了解 Python 的基礎知識
```

## 專案結構

```
slack-bot/
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── .env.example          # 環境變數範例
├── slack_bot.py          # Slack 機器人主程式
├── handlers.py           # 事件處理器
├── commands.py           # 斜線命令
├── ai_assistant.py       # AI 助手邏輯
└── utils.py              # 工具函數
```

## 程式碼範例

### 基本訊息處理

```python
from slack_bot import SlackBot

# 初始化機器人
bot = SlackBot(
    token=os.getenv("SLACK_BOT_TOKEN"),
    signing_secret=os.getenv("SLACK_SIGNING_SECRET")
)

# 處理提及事件
@bot.event("app_mention")
def handle_mention(event, say):
    text = event['text']
    user = event['user']

    # 生成回應
    response = generate_ai_response(text)

    # 回覆
    say(f"<@{user}> {response}")

# 啟動機器人
bot.start()
```

### 互動式按鈕

```python
@bot.command("/ask")
def handle_ask(ack, command, say):
    ack()  # 確認收到命令

    # 顯示互動式按鈕
    say({
        "blocks": [
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": "請選擇主題："}
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "程式設計"},
                        "action_id": "topic_programming"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "機器學習"},
                        "action_id": "topic_ml"
                    }
                ]
            }
        ]
    })
```

## 進階功能

### 1. 執行緒回覆

在執行緒中保持對話上下文：

```python
@bot.event("message")
def handle_message(event, say):
    thread_ts = event.get("thread_ts", event["ts"])

    # 在執行緒中回覆
    say(
        text="這是我的回應",
        thread_ts=thread_ts
    )
```

### 2. 檔案處理

處理用戶上傳的檔案：

```python
@bot.event("file_shared")
def handle_file(event, client):
    file_id = event['file_id']

    # 取得檔案資訊
    file_info = client.files_info(file=file_id)

    # 下載並處理檔案
    process_file(file_info)
```

### 3. 模態視窗

顯示互動式表單：

```python
@bot.command("/feedback")
def open_modal(ack, body, client):
    ack()

    client.views_open(
        trigger_id=body["trigger_id"],
        view={
            "type": "modal",
            "title": {"type": "plain_text", "text": "意見回饋"},
            "submit": {"type": "plain_text", "text": "提交"},
            "blocks": [
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input",
                        "multiline": True
                    },
                    "label": {"type": "plain_text", "text": "您的意見"}
                }
            ]
        }
    )
```

### 4. 排程訊息

定時發送訊息：

```python
import schedule
import time

def send_daily_summary():
    bot.client.chat_postMessage(
        channel="#general",
        text="這是您的每日摘要..."
    )

# 每天早上 9 點發送
schedule.every().day.at("09:00").do(send_daily_summary)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 斜線命令列表

| 命令 | 說明 | 範例 |
|------|------|------|
| `/ask <問題>` | 詢問 AI 助手 | `/ask 什麼是 Python?` |
| `/help` | 顯示幫助訊息 | `/help` |
| `/clear` | 清除對話歷史 | `/clear` |
| `/feedback <訊息>` | 提供意見回饋 | `/feedback 很棒的機器人！` |

## 最佳實踐

### 1. 回應速度

- 立即確認收到命令（`ack()`）
- 長時間處理使用背景執行緒
- 顯示「正在處理...」訊息

### 2. 錯誤處理

```python
@bot.error
def handle_errors(error, body, logger):
    logger.exception(f"錯誤: {error}")
    # 通知管理員或記錄到監控系統
```

### 3. 速率限制

遵守 Slack API 速率限制：
- 每個工作空間每分鐘最多 1 次訊息
- 使用速率限制器控制請求頻率

### 4. 安全性

- 驗證請求簽名
- 不在程式碼中硬編碼 token
- 使用環境變數儲存敏感資訊

## 部署

### Heroku

```bash
# 安裝 Heroku CLI
heroku create your-slack-bot

# 設定環境變數
heroku config:set SLACK_BOT_TOKEN=your-token
heroku config:set SLACK_SIGNING_SECRET=your-secret
heroku config:set OPENAI_API_KEY=your-key

# 部署
git push heroku main
```

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "slack_bot.py"]
```

## 監控與除錯

### 啟用除錯日誌

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 查看事件日誌

在 Slack App 設定中查看「Event Subscriptions」的請求日誌。

## 常見問題

### Q: 機器人沒有回應？

- 檢查 token 是否正確
- 確認已將機器人加入頻道
- 查看 Event Subscriptions 是否正確設定

### Q: 如何在多個頻道使用？

將機器人加入任何頻道即可：`/invite @YourBot`

### Q: 如何客製化回應？

修改 `ai_assistant.py` 中的提示詞或邏輯。

## 技術棧

- **Python 3.8+**
- **Slack Bolt** - Slack SDK
- **OpenAI API** - AI 回應生成
- **ngrok** - 本地開發隧道
- **Flask** - Web 伺服器（可選）

## 參考資源

- [Slack Bolt 文檔](https://slack.dev/bolt-python/)
- [Slack API 文檔](https://api.slack.com/)
- [Slack App 設定指南](https://api.slack.com/start/building)

## 授權

MIT License
