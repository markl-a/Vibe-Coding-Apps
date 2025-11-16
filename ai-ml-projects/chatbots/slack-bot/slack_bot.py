"""
Slack Bot - Slack 整合聊天機器人
將 AI 助手整合到 Slack 工作空間
"""

import os
import re
from typing import Dict, Optional
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler
import openai

load_dotenv()


class SlackChatbot:
    """Slack AI 聊天機器人"""

    def __init__(
        self,
        slack_bot_token: Optional[str] = None,
        slack_app_token: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ):
        """
        初始化 Slack 機器人

        Args:
            slack_bot_token: Slack Bot Token
            slack_app_token: Slack App Token (用於 Socket Mode)
            openai_api_key: OpenAI API 金鑰
        """
        # 設定 tokens
        self.slack_bot_token = slack_bot_token or os.getenv("SLACK_BOT_TOKEN")
        self.slack_app_token = slack_app_token or os.getenv("SLACK_APP_TOKEN")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")

        # 初始化 OpenAI
        openai.api_key = self.openai_api_key

        # 初始化 Slack App
        self.app = App(token=self.slack_bot_token)

        # 對話歷史（簡單的記憶體儲存）
        self.conversation_history: Dict[str, list] = {}

        # 註冊事件處理器
        self._register_handlers()

    def _register_handlers(self):
        """註冊所有事件處理器"""

        # 處理應用程式提及
        @self.app.event("app_mention")
        def handle_mention(event, say, logger):
            try:
                user = event['user']
                text = event['text']
                channel = event['channel']
                thread_ts = event.get('ts')

                # 移除機器人提及
                clean_text = re.sub(r'<@[A-Z0-9]+>', '', text).strip()

                if not clean_text:
                    say(
                        text=f"<@{user}> 你好！我是 AI 助手，有什麼可以幫助你的嗎？",
                        thread_ts=thread_ts
                    )
                    return

                # 生成回應
                logger.info(f"處理提及: {clean_text}")
                response = self._generate_response(
                    message=clean_text,
                    user_id=user,
                    channel_id=channel
                )

                # 在執行緒中回覆
                say(
                    text=f"<@{user}> {response}",
                    thread_ts=thread_ts
                )

            except Exception as e:
                logger.error(f"處理提及時發生錯誤: {e}")
                say(text=f"抱歉，處理您的訊息時發生錯誤。")

        # 處理直接訊息
        @self.app.event("message")
        def handle_message(event, say, logger):
            # 忽略機器人自己的訊息
            if event.get('bot_id'):
                return

            # 只處理直接訊息（DM）
            channel_type = event.get('channel_type')
            if channel_type != 'im':
                return

            try:
                user = event['user']
                text = event['text']
                thread_ts = event.get('thread_ts', event['ts'])

                logger.info(f"處理 DM: {text}")

                # 生成回應
                response = self._generate_response(
                    message=text,
                    user_id=user
                )

                # 回覆
                say(
                    text=response,
                    thread_ts=thread_ts
                )

            except Exception as e:
                logger.error(f"處理訊息時發生錯誤: {e}")
                say(text="抱歉，處理您的訊息時發生錯誤。")

        # 斜線命令：/ask
        @self.app.command("/ask")
        def handle_ask_command(ack, command, say, logger):
            ack()  # 確認收到命令

            try:
                user = command['user_id']
                text = command.get('text', '').strip()

                if not text:
                    say("請提供問題，例如：`/ask 什麼是機器學習？`")
                    return

                logger.info(f"處理 /ask 命令: {text}")

                # 生成回應
                response = self._generate_response(
                    message=text,
                    user_id=user
                )

                say(f"<@{user}> 問：{text}\n\n答：{response}")

            except Exception as e:
                logger.error(f"處理 /ask 命令時發生錯誤: {e}")
                say("抱歉，處理您的問題時發生錯誤。")

        # 斜線命令：/help
        @self.app.command("/help")
        def handle_help_command(ack, say):
            ack()

            help_text = """
*Slack AI 助手使用指南* 🤖

*與機器人互動的方式：*

1️⃣ *提及機器人*
   在任何頻道中：`@AI助手 你的問題`

2️⃣ *直接訊息*
   私訊機器人直接對話

3️⃣ *斜線命令*
   • `/ask <問題>` - 詢問問題
   • `/help` - 顯示此幫助訊息
   • `/clear` - 清除對話歷史

*範例：*
```
@AI助手 請解釋什麼是深度學習
/ask Python 和 JavaScript 有什麼不同？
```

有任何問題都可以問我！ 😊
            """

            say(help_text)

        # 斜線命令：/clear
        @self.app.command("/clear")
        def handle_clear_command(ack, command, say, logger):
            ack()

            try:
                user = command['user_id']

                # 清除該用戶的對話歷史
                if user in self.conversation_history:
                    del self.conversation_history[user]

                logger.info(f"已清除用戶 {user} 的對話歷史")
                say(f"<@{user}> 已清除您的對話歷史！")

            except Exception as e:
                logger.error(f"清除歷史時發生錯誤: {e}")
                say("清除歷史時發生錯誤。")

    def _generate_response(
        self,
        message: str,
        user_id: str,
        channel_id: Optional[str] = None
    ) -> str:
        """
        使用 OpenAI 生成回應

        Args:
            message: 用戶訊息
            user_id: 用戶 ID
            channel_id: 頻道 ID（可選）

        Returns:
            AI 生成的回應
        """
        try:
            # 取得對話歷史
            conversation_key = f"{user_id}_{channel_id}" if channel_id else user_id

            if conversation_key not in self.conversation_history:
                self.conversation_history[conversation_key] = []

            # 添加用戶訊息
            self.conversation_history[conversation_key].append({
                "role": "user",
                "content": message
            })

            # 保持歷史在合理長度（最近 10 條）
            history = self.conversation_history[conversation_key][-10:]

            # 系統提示
            system_prompt = """你是一個友善且樂於助人的 AI 助手，整合在 Slack 中。
請用簡潔、清晰的方式回答問題。
使用 Slack 的 markdown 格式（*粗體*、_斜體_、`程式碼`）。
保持回應簡短但有幫助。"""

            # 呼叫 OpenAI API
            messages = [{"role": "system", "content": system_prompt}] + history

            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )

            assistant_message = response.choices[0].message.content.strip()

            # 添加助手回應到歷史
            self.conversation_history[conversation_key].append({
                "role": "assistant",
                "content": assistant_message
            })

            return assistant_message

        except Exception as e:
            print(f"生成回應錯誤: {e}")
            return "抱歉，我現在無法處理您的請求。請稍後再試。"

    def start(self, port: int = 3000):
        """啟動機器人"""
        if self.slack_app_token:
            # Socket Mode（推薦用於開發）
            print("🚀 使用 Socket Mode 啟動 Slack 機器人...")
            handler = SocketModeHandler(self.app, self.slack_app_token)
            handler.start()
        else:
            # HTTP Mode
            print(f"🚀 在 port {port} 啟動 Slack 機器人...")
            self.app.start(port=port)


def main():
    """主程式"""
    print("=" * 50)
    print("Slack AI 聊天機器人")
    print("=" * 50)

    # 檢查必要的環境變數
    required_vars = ["SLACK_BOT_TOKEN", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print(f"\n❌ 缺少必要的環境變數: {', '.join(missing_vars)}")
        print("請設定 .env 檔案")
        return

    # 初始化並啟動機器人
    bot = SlackChatbot()

    print("\n✓ 機器人已初始化")
    print("✓ 正在連接到 Slack...\n")

    try:
        bot.start()
    except KeyboardInterrupt:
        print("\n\n👋 機器人已停止")
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")


if __name__ == "__main__":
    main()
