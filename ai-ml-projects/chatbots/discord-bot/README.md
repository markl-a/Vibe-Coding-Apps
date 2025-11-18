# Discord Bot - Discord AI 聊天機器人

🤖 功能完整的 Discord AI 助手，支援斜線命令、對話歷史和智能互動

## 功能特點

- ✅ 斜線命令支援（/ask, /help, /clear, /stats）
- ✅ 提及回應（@bot）
- ✅ 私訊對話
- ✅ 對話歷史記錄
- ✅ 表情符號反應
- ✅ 多伺服器支援
- ✅ Discord Embed 訊息
- ✅ 長訊息自動分段
- ✅ 即時狀態顯示

## 快速開始

### 1. 安裝依賴

```bash
pip install -r requirements.txt
```

### 2. 創建 Discord Bot

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 點擊 "New Application"
3. 在 "Bot" 標籤頁創建 bot
4. 複製 Bot Token
5. 在 "OAuth2" > "URL Generator" 中：
   - 選擇 Scopes: `bot`, `applications.commands`
   - 選擇 Bot Permissions:
     - Send Messages
     - Send Messages in Threads
     - Embed Links
     - Read Message History
     - Add Reactions
     - Use Slash Commands
6. 使用生成的 URL 邀請 bot 到你的伺服器

### 3. 配置環境變數

創建 `.env` 檔案：

```bash
DISCORD_BOT_TOKEN=your_discord_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. 執行機器人

```bash
python discord_bot.py
```

## 使用方式

### 斜線命令

```
/ask <問題>    - 向 AI 詢問問題
/clear         - 清除對話歷史
/help          - 顯示幫助訊息
/stats         - 顯示統計資訊
```

### 提及機器人

在任何頻道中提及機器人：

```
@AI助手 你好，請解釋什麼是量子計算？
```

### 私訊對話

直接私訊機器人即可開始對話。

## 使用範例

```python
# 在程式中使用
from discord_bot import DiscordChatbot

bot = DiscordChatbot(
    discord_token="YOUR_TOKEN",
    openai_api_key="YOUR_KEY"
)

bot.run_bot()
```

## 專案結構

```
discord-bot/
├── README.md              # 專案說明
├── requirements.txt       # 依賴套件
├── .env.example          # 環境變數範例
├── discord_bot.py        # 機器人主程式
└── example.py            # 使用範例
```

## 進階功能

### 自定義系統提示

```python
bot = DiscordChatbot(
    discord_token="YOUR_TOKEN",
    openai_api_key="YOUR_KEY"
)

bot.system_prompt = """
你是一個專業的程式設計助手。
請用 Python 和技術術語回答問題。
"""

bot.run_bot()
```

### 添加自定義命令

```python
@bot.tree.command(
    name="translate",
    description="翻譯文本"
)
async def translate(interaction: discord.Interaction, text: str, target_lang: str):
    # 實作翻譯邏輯
    pass
```

## Discord 特色功能

### 1. Embed 訊息

機器人使用 Discord Embed 來顯示格式化的幫助訊息和統計資訊。

### 2. 反應表情

機器人會在處理訊息時添加反應表情（✅/❌）。

### 3. 狀態顯示

機器人顯示自定義狀態：「正在收聽 /help 查看指令」

### 4. 長訊息處理

自動將超過 2000 字符的回應分段發送。

## 注意事項

1. **API 成本** - 使用 OpenAI API 會產生費用
2. **速率限制** - Discord 有訊息速率限制
3. **權限** - 確保 bot 有足夠的權限
4. **隱私** - 對話歷史存儲在記憶體中
5. **Intents** - 需要啟用 Message Content Intent

## 疑難排解

### Bot 無法回應

1. 檢查 Bot Token 是否正確
2. 確認已啟用 "Message Content Intent"
3. 檢查 bot 權限是否足夠

### 斜線命令不顯示

1. 等待命令同步（可能需要 1 小時）
2. 重新邀請 bot（使用新的 OAuth URL）
3. 檢查 `applications.commands` scope

### API 錯誤

1. 驗證 OpenAI API Key
2. 檢查 API 配額
3. 查看錯誤日誌

## 部署

### 使用 systemd（Linux）

創建 `/etc/systemd/system/discord-bot.service`：

```ini
[Unit]
Description=Discord AI Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/discord-bot
ExecStart=/usr/bin/python3 discord_bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

啟動服務：

```bash
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
```

### 使用 Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "discord_bot.py"]
```

## 技術棧

- **Python 3.8+**
- **discord.py 2.0+** - Discord API wrapper
- **OpenAI GPT-4** - AI 模型
- **python-dotenv** - 環境變數管理

## 授權

MIT License

## 支援

如有問題或建議，請：
1. 查閱 [Discord.py 文檔](https://discordpy.readthedocs.io/)
2. 查閱 [Discord Developer Portal](https://discord.com/developers/docs)
3. 提交 Issue

---

**Happy Coding! 🚀**
