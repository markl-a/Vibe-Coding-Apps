"""
Telegram Bot - Telegram 聊天機器人
功能完整的 AI 聊天機器人，支援命令、對話歷史和多媒體
"""

import os
import logging
from typing import Dict, List
from collections import defaultdict
from dotenv import load_dotenv

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes
)

import openai

load_dotenv()

# 設定日誌
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class TelegramChatbot:
    """Telegram AI 聊天機器人"""

    def __init__(
        self,
        telegram_token: str,
        openai_api_key: str
    ):
        """
        初始化機器人

        Args:
            telegram_token: Telegram Bot Token
            openai_api_key: OpenAI API 金鑰
        """
        self.telegram_token = telegram_token
        self.openai_api_key = openai_api_key

        # 設定 OpenAI
        openai.api_key = self.openai_api_key

        # 對話歷史（記憶體儲存）
        self.conversations: Dict[int, List[Dict]] = defaultdict(list)

        # 建立應用程式
        self.app = ApplicationBuilder().token(self.telegram_token).build()

        # 註冊處理器
        self._register_handlers()

    def _register_handlers(self):
        """註冊所有命令和訊息處理器"""

        # 命令處理器
        self.app.add_handler(CommandHandler("start", self.start_command))
        self.app.add_handler(CommandHandler("help", self.help_command))
        self.app.add_handler(CommandHandler("ask", self.ask_command))
        self.app.add_handler(CommandHandler("clear", self.clear_command))

        # 訊息處理器
        self.app.add_handler(MessageHandler(
            filters.TEXT & ~filters.COMMAND,
            self.handle_message
        ))

        # 回調查詢處理器（按鈕點擊）
        self.app.add_handler(CallbackQueryHandler(self.button_callback))

        # 錯誤處理器
        self.app.add_error_handler(self.error_handler)

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理 /start 命令"""
        user = update.effective_user
        welcome_message = f"""
👋 你好 {user.first_name}！

我是 AI 聊天機器人，很高興為您服務！

*我可以做什麼？*
• 💬 回答各種問題
• 🧠 進行智能對話
• 📚 提供資訊和建議
• 💡 協助解決問題

*如何使用？*
直接發送訊息給我，或使用以下命令：

/help - 查看所有命令
/ask <問題> - 詢問問題
/clear - 清除對話歷史

試著問我任何問題吧！ 😊
        """

        # 顯示快速選項鍵盤
        keyboard = [
            [
                InlineKeyboardButton("📝 範例問題", callback_data='show_examples'),
                InlineKeyboardButton("❓ 幫助", callback_data='show_help')
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理 /help 命令"""
        help_text = """
*📖 命令列表*

/start - 開始使用機器人
/help - 顯示此幫助訊息
/ask <問題> - 詢問 AI 問題
/clear - 清除對話歷史

*💡 使用提示*

1️⃣ *直接對話*
   直接發送訊息即可對話

2️⃣ *使用命令*
   `/ask 什麼是機器學習？`

3️⃣ *連續對話*
   我會記住對話內容，可以連續提問

4️⃣ *清除歷史*
   使用 `/clear` 開始新對話

*範例問題：*
• 請解釋深度學習
• Python 和 JavaScript 的區別？
• 如何學習機器學習？
• 寫一個排序演算法

有任何問題都可以問我！ 🤖
        """

        await update.message.reply_text(
            help_text,
            parse_mode='Markdown'
        )

    async def ask_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理 /ask 命令"""
        user_id = update.effective_user.id

        # 檢查是否提供了問題
        if not context.args:
            await update.message.reply_text(
                "請提供問題，例如：\n"
                "`/ask 什麼是人工智慧？`",
                parse_mode='Markdown'
            )
            return

        # 組合問題
        question = ' '.join(context.args)

        # 顯示處理中訊息
        processing_msg = await update.message.reply_text("🤔 思考中...")

        # 生成回應
        response = await self._generate_response(question, user_id)

        # 刪除處理中訊息
        await processing_msg.delete()

        # 發送回應
        await update.message.reply_text(response)

    async def clear_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理 /clear 命令"""
        user_id = update.effective_user.id

        # 清除對話歷史
        if user_id in self.conversations:
            message_count = len(self.conversations[user_id])
            del self.conversations[user_id]
            await update.message.reply_text(
                f"✅ 已清除 {message_count // 2} 條對話記錄！\n"
                "現在可以開始新的對話了。"
            )
        else:
            await update.message.reply_text("目前沒有對話記錄。")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理一般文字訊息"""
        user_id = update.effective_user.id
        message_text = update.message.text

        logger.info(f"收到訊息 from {user_id}: {message_text}")

        # 顯示輸入中狀態
        await context.bot.send_chat_action(
            chat_id=update.effective_chat.id,
            action="typing"
        )

        # 生成回應
        response = await self._generate_response(message_text, user_id)

        # 發送回應
        await update.message.reply_text(response)

    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理按鈕點擊"""
        query = update.callback_query
        await query.answer()

        callback_data = query.data

        if callback_data == 'show_examples':
            examples = """
*📝 範例問題*

*程式設計：*
• 如何學習 Python？
• 解釋物件導向程式設計
• 寫一個快速排序演算法

*機器學習：*
• 什麼是深度學習？
• 解釋神經網路的原理
• 監督式學習和非監督式學習的差異？

*一般知識：*
• 區塊鏈是什麼？
• 雲端運算的優勢
• 5G 技術的應用

試著問我這些問題，或任何你想了解的！
            """
            await query.edit_message_text(
                text=examples,
                parse_mode='Markdown'
            )

        elif callback_data == 'show_help':
            await self.help_command(update, context)

    async def _generate_response(self, message: str, user_id: int) -> str:
        """
        生成 AI 回應

        Args:
            message: 用戶訊息
            user_id: 用戶 ID

        Returns:
            AI 生成的回應
        """
        try:
            # 添加用戶訊息到歷史
            self.conversations[user_id].append({
                "role": "user",
                "content": message
            })

            # 保持歷史在合理長度（最近 20 條訊息）
            conversation = self.conversations[user_id][-20:]

            # 系統提示
            system_message = {
                "role": "system",
                "content": """你是一個友善、專業且樂於助人的 AI 助手。
請用繁體中文回答，除非用戶使用其他語言。
保持回答簡潔清晰，但要有足夠的資訊量。
如果不確定答案，請誠實說明。
可以使用適當的表情符號讓對話更生動。"""
            }

            # 組合訊息
            messages = [system_message] + conversation

            # 呼叫 OpenAI API
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )

            assistant_message = response.choices[0].message.content.strip()

            # 添加助手回應到歷史
            self.conversations[user_id].append({
                "role": "assistant",
                "content": assistant_message
            })

            return assistant_message

        except Exception as e:
            logger.error(f"生成回應時發生錯誤: {e}")
            return (
                "抱歉，處理您的請求時發生錯誤。😔\n"
                "請稍後再試，或使用 /clear 開始新對話。"
            )

    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """處理錯誤"""
        logger.error(f"更新 {update} 發生錯誤：{context.error}")

        if update and update.effective_message:
            await update.effective_message.reply_text(
                "抱歉，發生了一些錯誤。😔\n"
                "請稍後再試。"
            )

    def run(self):
        """啟動機器人（Polling 模式）"""
        logger.info("🤖 Telegram 機器人啟動中...")
        self.app.run_polling()


def main():
    """主程式"""
    print("=" * 50)
    print("Telegram AI 聊天機器人")
    print("=" * 50)

    # 檢查環境變數
    telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    if not telegram_token:
        print("\n❌ 錯誤: 找不到 TELEGRAM_BOT_TOKEN")
        print("請設定 .env 檔案")
        return

    if not openai_api_key:
        print("\n❌ 錯誤: 找不到 OPENAI_API_KEY")
        print("請設定 .env 檔案")
        return

    # 初始化並啟動機器人
    print("\n✓ 環境變數已載入")
    print("✓ 正在啟動機器人...\n")

    bot = TelegramChatbot(
        telegram_token=telegram_token,
        openai_api_key=openai_api_key
    )

    try:
        bot.run()
    except KeyboardInterrupt:
        print("\n\n👋 機器人已停止")
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")


if __name__ == "__main__":
    main()
