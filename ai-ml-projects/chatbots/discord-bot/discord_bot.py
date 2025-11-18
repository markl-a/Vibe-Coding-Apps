"""
Discord Bot - Discord 整合聊天機器人
功能完整的 AI 助手，支援斜線命令、對話歷史、表情符號反應等
"""

import os
import logging
from typing import Dict, List, Optional
from collections import defaultdict
from datetime import datetime
from dotenv import load_dotenv

import discord
from discord import app_commands
from discord.ext import commands
import openai

load_dotenv()

# 設定日誌
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class DiscordChatbot(commands.Bot):
    """Discord AI 聊天機器人"""

    def __init__(
        self,
        discord_token: str,
        openai_api_key: str,
        command_prefix: str = "!"
    ):
        """
        初始化機器人

        Args:
            discord_token: Discord Bot Token
            openai_api_key: OpenAI API 金鑰
            command_prefix: 命令前綴
        """
        # 設定intents
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True

        super().__init__(
            command_prefix=command_prefix,
            intents=intents,
            help_command=None  # 使用自定義幫助命令
        )

        self.discord_token = discord_token
        self.openai_api_key = openai_api_key

        # 設定 OpenAI
        self.client = openai.OpenAI(api_key=self.openai_api_key)

        # 對話歷史（按用戶ID存儲）
        self.conversations: Dict[int, List[Dict]] = defaultdict(list)

        # 系統提示
        self.system_prompt = """你是一個友善、專業且樂於助人的 AI 助手，整合在 Discord 中。
請用繁體中文回答，除非用戶使用其他語言。
保持回答簡潔清晰，但要有足夠的資訊量。
可以使用適當的 Discord markdown 格式（**粗體**、*斜體*、`程式碼`）。
如果不確定答案，請誠實說明。"""

    async def setup_hook(self):
        """設置機器人"""
        # 註冊命令
        await self._register_commands()

        # 同步斜線命令到Discord
        try:
            synced = await self.tree.sync()
            logger.info(f"已同步 {len(synced)} 個斜線命令")
        except Exception as e:
            logger.error(f"同步命令時發生錯誤: {e}")

    async def _register_commands(self):
        """註冊斜線命令"""

        @self.tree.command(
            name="ask",
            description="向 AI 助手詢問問題"
        )
        @app_commands.describe(question="你想問的問題")
        async def ask(interaction: discord.Interaction, question: str):
            await interaction.response.defer(thinking=True)

            try:
                user_id = interaction.user.id
                response = await self._generate_response(question, user_id)

                # Discord 訊息長度限制為 2000 字符
                if len(response) > 2000:
                    # 分段發送
                    chunks = [response[i:i+2000] for i in range(0, len(response), 2000)]
                    await interaction.followup.send(chunks[0])
                    for chunk in chunks[1:]:
                        await interaction.followup.send(chunk)
                else:
                    await interaction.followup.send(response)

            except Exception as e:
                logger.error(f"處理 /ask 命令時發生錯誤: {e}")
                await interaction.followup.send(
                    "抱歉，處理您的問題時發生錯誤。請稍後再試。"
                )

        @self.tree.command(
            name="clear",
            description="清除你的對話歷史"
        )
        async def clear(interaction: discord.Interaction):
            user_id = interaction.user.id

            if user_id in self.conversations:
                message_count = len(self.conversations[user_id])
                del self.conversations[user_id]
                await interaction.response.send_message(
                    f"✅ 已清除 {message_count // 2} 條對話記錄！",
                    ephemeral=True
                )
            else:
                await interaction.response.send_message(
                    "目前沒有對話記錄。",
                    ephemeral=True
                )

        @self.tree.command(
            name="help",
            description="顯示幫助訊息"
        )
        async def help_command(interaction: discord.Interaction):
            embed = discord.Embed(
                title="🤖 Discord AI 助手",
                description="我是你的 AI 助手，可以回答各種問題！",
                color=discord.Color.blue()
            )

            embed.add_field(
                name="📝 斜線命令",
                value="""
                `/ask <問題>` - 詢問 AI 問題
                `/clear` - 清除對話歷史
                `/help` - 顯示此幫助訊息
                `/stats` - 顯示統計資訊
                """,
                inline=False
            )

            embed.add_field(
                name="💬 使用方式",
                value="""
                1️⃣ **提及機器人**: @AI助手 你的問題
                2️⃣ **私訊對話**: 直接發送訊息
                3️⃣ **斜線命令**: 使用 `/ask` 命令
                """,
                inline=False
            )

            embed.add_field(
                name="✨ 功能特點",
                value="""
                • 智能對話，保留上下文
                • 支援多種語言
                • Markdown 格式化回應
                • 表情符號反應
                """,
                inline=False
            )

            embed.set_footer(text="Powered by OpenAI GPT")

            await interaction.response.send_message(embed=embed)

        @self.tree.command(
            name="stats",
            description="顯示統計資訊"
        )
        async def stats(interaction: discord.Interaction):
            user_id = interaction.user.id
            message_count = len(self.conversations.get(user_id, []))
            total_users = len(self.conversations)

            embed = discord.Embed(
                title="📊 統計資訊",
                color=discord.Color.green()
            )

            embed.add_field(
                name="你的對話",
                value=f"{message_count // 2} 輪對話",
                inline=True
            )

            embed.add_field(
                name="總用戶數",
                value=f"{total_users} 位用戶",
                inline=True
            )

            await interaction.response.send_message(
                embed=embed,
                ephemeral=True
            )

    async def on_ready(self):
        """機器人就緒時觸發"""
        logger.info(f"✅ 已登入為 {self.user} (ID: {self.user.id})")
        logger.info(f"已加入 {len(self.guilds)} 個伺服器")

        # 設定狀態
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.listening,
                name="/help 查看指令"
            )
        )

    async def on_message(self, message: discord.Message):
        """處理訊息"""
        # 忽略機器人自己的訊息
        if message.author == self.user:
            return

        # 處理命令
        await self.process_commands(message)

        # 處理提及
        if self.user.mentioned_in(message):
            await self._handle_mention(message)
            return

        # 處理私訊
        if isinstance(message.channel, discord.DMChannel):
            await self._handle_dm(message)

    async def _handle_mention(self, message: discord.Message):
        """處理提及機器人的訊息"""
        # 移除提及部分
        content = message.content.replace(f'<@{self.user.id}>', '').strip()

        if not content:
            await message.reply(
                "👋 你好！我是 AI 助手。使用 `/help` 查看我能做什麼！"
            )
            return

        # 顯示輸入中狀態
        async with message.channel.typing():
            try:
                user_id = message.author.id
                response = await self._generate_response(content, user_id)

                # 添加反應表情
                await message.add_reaction("✅")

                # 回覆訊息
                if len(response) > 2000:
                    chunks = [response[i:i+2000] for i in range(0, len(response), 2000)]
                    await message.reply(chunks[0])
                    for chunk in chunks[1:]:
                        await message.channel.send(chunk)
                else:
                    await message.reply(response)

            except Exception as e:
                logger.error(f"處理提及時發生錯誤: {e}")
                await message.add_reaction("❌")
                await message.reply("抱歉，處理您的訊息時發生錯誤。")

    async def _handle_dm(self, message: discord.Message):
        """處理私訊"""
        async with message.channel.typing():
            try:
                user_id = message.author.id
                response = await self._generate_response(
                    message.content,
                    user_id
                )

                if len(response) > 2000:
                    chunks = [response[i:i+2000] for i in range(0, len(response), 2000)]
                    await message.channel.send(chunks[0])
                    for chunk in chunks[1:]:
                        await message.channel.send(chunk)
                else:
                    await message.channel.send(response)

            except Exception as e:
                logger.error(f"處理私訊時發生錯誤: {e}")
                await message.channel.send(
                    "抱歉，處理您的訊息時發生錯誤。"
                )

    async def _generate_response(
        self,
        message: str,
        user_id: int
    ) -> str:
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

            # 組合訊息
            messages = [
                {"role": "system", "content": self.system_prompt}
            ] + conversation

            # 呼叫 OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=1500,
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
                "請稍後再試，或使用 `/clear` 開始新對話。"
            )

    def run_bot(self):
        """啟動機器人"""
        logger.info("🤖 Discord 機器人啟動中...")
        self.run(self.discord_token)


def main():
    """主程式"""
    print("=" * 50)
    print("Discord AI 聊天機器人")
    print("=" * 50)

    # 檢查環境變數
    discord_token = os.getenv("DISCORD_BOT_TOKEN")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    if not discord_token:
        print("\n❌ 錯誤: 找不到 DISCORD_BOT_TOKEN")
        print("請設定 .env 檔案")
        return

    if not openai_api_key:
        print("\n❌ 錯誤: 找不到 OPENAI_API_KEY")
        print("請設定 .env 檔案")
        return

    # 初始化並啟動機器人
    print("\n✓ 環境變數已載入")
    print("✓ 正在啟動機器人...\n")

    bot = DiscordChatbot(
        discord_token=discord_token,
        openai_api_key=openai_api_key
    )

    try:
        bot.run_bot()
    except KeyboardInterrupt:
        print("\n\n👋 機器人已停止")
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")


if __name__ == "__main__":
    main()
