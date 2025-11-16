# Telegram Bot - Telegram 聊天機器人

🤖 功能完整的 Telegram AI 聊天機器人，支援多媒體、內聯鍵盤和群組對話

## 功能特點

- ✅ 私人對話
- ✅ 群組對話支援
- ✅ 命令處理 (/start, /help, /ask 等)
- ✅ 內聯鍵盤互動
- ✅ 圖片處理與分析
- ✅ 語音訊息轉文字
- ✅ 文件處理
- ✅ 對話歷史管理
- ✅ 多語言支援
- ✅ 使用者統計追蹤

## 快速開始

### 1. 建立 Telegram Bot

1. 在 Telegram 中找到 [@BotFather](https://t.me/botfather)
2. 發送 `/newbot` 命令
3. 按照指示設定機器人名稱和用戶名
4. 取得 Bot Token（格式：`123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）

### 2. 設定命令列表（可選）

向 @BotFather 發送 `/setcommands`，然後輸入：

```
start - 開始使用機器人
help - 顯示幫助訊息
ask - 詢問問題
clear - 清除對話歷史
language - 切換語言
```

### 3. 配置環境變數

```bash
cp .env.example .env
```

編輯 `.env`:
```
TELEGRAM_BOT_TOKEN=your-bot-token-here
OPENAI_API_KEY=your-openai-api-key
```

### 4. 安裝與執行

```bash
# 安裝依賴
pip install -r requirements.txt

# 執行機器人
python telegram_bot.py
```

## 使用方式

### 基本命令

```
/start - 開始使用並查看歡迎訊息
/help - 顯示所有可用命令
/ask <問題> - 詢問 AI 問題
/clear - 清除對話歷史
```

### 直接對話

直接發送訊息給機器人：

```
你好！請介紹一下深度學習
```

### 群組中使用

1. 將機器人加入群組
2. 提及機器人：`@YourBot 你的問題`
3. 或使用命令：`/ask 你的問題`

## 專案結構

```
telegram-bot/
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── .env.example          # 環境變數範例
├── telegram_bot.py       # 主程式
├── handlers.py           # 命令處理器
├── keyboards.py          # 鍵盤佈局
├── ai_assistant.py       # AI 邏輯
└── database.py           # 資料儲存
```

## 程式碼範例

### 基本訊息處理

```python
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters

async def start(update: Update, context):
    """處理 /start 命令"""
    await update.message.reply_text(
        "👋 你好！我是 AI 助手。\n\n"
        "發送任何訊息給我，我會盡力回答！"
    )

async def handle_message(update: Update, context):
    """處理一般訊息"""
    user_message = update.message.text
    response = generate_ai_response(user_message)
    await update.message.reply_text(response)

# 建立應用程式
app = ApplicationBuilder().token("YOUR_BOT_TOKEN").build()

# 註冊處理器
app.add_handler(CommandHandler("start", start))
app.add_handler(MessageHandler(filters.TEXT, handle_message))

# 啟動機器人
app.run_polling()
```

### 內聯鍵盤

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

async def show_menu(update: Update, context):
    """顯示互動式選單"""
    keyboard = [
        [
            InlineKeyboardButton("程式設計", callback_data='topic_programming'),
            InlineKeyboardButton("機器學習", callback_data='topic_ml')
        ],
        [
            InlineKeyboardButton("資料科學", callback_data='topic_ds'),
            InlineKeyboardButton("其他", callback_data='topic_other')
        ]
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "請選擇您感興趣的主題：",
        reply_markup=reply_markup
    )

async def button_callback(update: Update, context):
    """處理按鈕點擊"""
    query = update.callback_query
    await query.answer()

    topic = query.data.replace('topic_', '')
    await query.edit_message_text(f"您選擇了：{topic}")
```

### 處理圖片

```python
from telegram import Update

async def handle_photo(update: Update, context):
    """處理用戶發送的圖片"""
    # 取得最高解析度的圖片
    photo = update.message.photo[-1]

    # 下載圖片
    file = await context.bot.get_file(photo.file_id)
    await file.download_to_drive('user_photo.jpg')

    # 處理圖片（例如：使用 Vision API）
    caption = update.message.caption or "請分析這張圖片"
    response = analyze_image('user_photo.jpg', caption)

    await update.message.reply_text(response)
```

### 語音訊息處理

```python
async def handle_voice(update: Update, context):
    """處理語音訊息"""
    voice = update.message.voice

    # 下載語音檔案
    file = await context.bot.get_file(voice.file_id)
    await file.download_to_drive('voice.ogg')

    # 轉換為文字（使用 Whisper API）
    text = transcribe_audio('voice.ogg')

    # 生成回應
    response = generate_ai_response(text)

    await update.message.reply_text(
        f"你說：{text}\n\n{response}"
    )
```

## 進階功能

### 1. 對話歷史管理

```python
from collections import defaultdict

# 儲存每個用戶的對話歷史
user_conversations = defaultdict(list)

async def handle_message(update: Update, context):
    user_id = update.effective_user.id
    message = update.message.text

    # 添加到歷史
    user_conversations[user_id].append({
        "role": "user",
        "content": message
    })

    # 使用歷史生成回應
    response = generate_with_history(user_conversations[user_id])

    user_conversations[user_id].append({
        "role": "assistant",
        "content": response
    })

    await update.message.reply_text(response)
```

### 2. 多語言支援

```python
MESSAGES = {
    'zh-TW': {
        'welcome': '歡迎使用 AI 助手！',
        'help': '我可以回答各種問題，試著問我吧！'
    },
    'en': {
        'welcome': 'Welcome to AI Assistant!',
        'help': 'I can answer various questions, ask me!'
    }
}

def get_user_language(user_id):
    # 從資料庫取得用戶語言設定
    return user_languages.get(user_id, 'zh-TW')

async def start(update: Update, context):
    user_id = update.effective_user.id
    lang = get_user_language(user_id)
    await update.message.reply_text(MESSAGES[lang]['welcome'])
```

### 3. 使用者權限管理

```python
ADMIN_IDS = [123456789, 987654321]  # 管理員 ID 列表

def is_admin(user_id):
    return user_id in ADMIN_IDS

async def admin_only_command(update: Update, context):
    user_id = update.effective_user.id

    if not is_admin(user_id):
        await update.message.reply_text("此命令僅限管理員使用。")
        return

    # 執行管理員功能
    stats = get_bot_statistics()
    await update.message.reply_text(f"機器人統計：\n{stats}")
```

### 4. 錯誤處理

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def error_handler(update: Update, context):
    """處理錯誤"""
    logger.error(f"更新 {update} 發生錯誤：{context.error}")

    if update and update.effective_message:
        await update.effective_message.reply_text(
            "抱歉，處理您的請求時發生錯誤。請稍後再試。"
        )

# 註冊錯誤處理器
app.add_error_handler(error_handler)
```

## 實用命令範例

### 天氣查詢

```python
async def weather(update: Update, context):
    """查詢天氣"""
    if not context.args:
        await update.message.reply_text("請提供城市名稱，例如：/weather 台北")
        return

    city = ' '.join(context.args)
    weather_info = get_weather(city)  # 呼叫天氣 API

    await update.message.reply_text(f"{city} 的天氣：\n{weather_info}")
```

### 提醒功能

```python
from datetime import datetime, timedelta

async def remind(update: Update, context):
    """設定提醒"""
    # /remind 60 買晚餐
    if len(context.args) < 2:
        await update.message.reply_text(
            "用法：/remind <分鐘> <訊息>\n"
            "例如：/remind 60 買晚餐"
        )
        return

    minutes = int(context.args[0])
    message = ' '.join(context.args[1:])

    # 設定提醒
    context.job_queue.run_once(
        send_reminder,
        when=timedelta(minutes=minutes),
        data={'chat_id': update.effective_chat.id, 'message': message}
    )

    await update.message.reply_text(f"✓ 已設定 {minutes} 分鐘後的提醒")

async def send_reminder(context):
    """發送提醒"""
    job_data = context.job.data
    await context.bot.send_message(
        chat_id=job_data['chat_id'],
        text=f"⏰ 提醒：{job_data['message']}"
    )
```

## 部署

### Webhook 模式（生產環境推薦）

```python
from telegram.ext import ApplicationBuilder

app = ApplicationBuilder().token("YOUR_TOKEN").build()

# 設定 webhook
app.run_webhook(
    listen="0.0.0.0",
    port=8443,
    url_path="YOUR_TOKEN",
    webhook_url=f"https://yourdomain.com/{YOUR_TOKEN}"
)
```

### Polling 模式（開發環境）

```python
app.run_polling()
```

### Heroku 部署

```bash
# Procfile
web: python telegram_bot.py

# 部署
heroku create your-telegram-bot
heroku config:set TELEGRAM_BOT_TOKEN=your-token
heroku config:set OPENAI_API_KEY=your-key
git push heroku main
```

### Docker 部署

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "telegram_bot.py"]
```

## 最佳實踐

1. **回應速度**：使用 `await update.message.reply_text()` 快速回應
2. **錯誤處理**：始終添加錯誤處理器
3. **日誌記錄**：記錄重要操作和錯誤
4. **速率限制**：避免過度頻繁的 API 呼叫
5. **安全性**：驗證用戶輸入，防止注入攻擊

## 監控與統計

```python
import time
from collections import defaultdict

stats = {
    'messages_received': 0,
    'commands_executed': defaultdict(int),
    'active_users': set(),
    'start_time': time.time()
}

async def track_message(update: Update, context):
    stats['messages_received'] += 1
    stats['active_users'].add(update.effective_user.id)

async def stats_command(update: Update, context):
    uptime = time.time() - stats['start_time']
    uptime_hours = uptime / 3600

    message = f"""
📊 機器人統計

訊息數：{stats['messages_received']}
活躍用戶：{len(stats['active_users'])}
運行時間：{uptime_hours:.1f} 小時
    """
    await update.message.reply_text(message)
```

## 常見問題

### Q: 機器人沒有回應？
檢查 token 是否正確，並確認機器人正在運行。

### Q: 如何限制機器人只在私聊中工作？
使用 `filters.ChatType.PRIVATE` 過濾器。

### Q: 如何處理大量用戶？
考慮使用資料庫（Redis、PostgreSQL）儲存對話歷史。

## 技術棧

- **Python 3.8+**
- **python-telegram-bot** - Telegram Bot SDK
- **OpenAI API** - AI 回應生成
- **SQLite / PostgreSQL** - 資料儲存（可選）

## 參考資源

- [python-telegram-bot 文檔](https://docs.python-telegram-bot.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather 指南](https://core.telegram.org/bots#botfather)

## 授權

MIT License
