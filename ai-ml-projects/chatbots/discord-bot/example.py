"""
Discord Bot Example
展示如何使用和自定義 Discord 機器人
"""

import os
from discord_bot import DiscordChatbot
import discord
from discord import app_commands
from dotenv import load_dotenv

load_dotenv()


def example_basic():
    """基本使用範例"""
    print("=" * 60)
    print("基本使用範例")
    print("=" * 60)

    bot = DiscordChatbot(
        discord_token=os.getenv("DISCORD_BOT_TOKEN"),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    # 啟動機器人
    print("啟動機器人...")
    bot.run_bot()


def example_custom_prompt():
    """自定義系統提示範例"""
    print("=" * 60)
    print("自定義系統提示範例")
    print("=" * 60)

    bot = DiscordChatbot(
        discord_token=os.getenv("DISCORD_BOT_TOKEN"),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    # 自定義系統提示
    bot.system_prompt = """你是一個專業的程式設計助手。
專精於 Python、JavaScript 和系統架構。
請用技術術語回答問題，並提供程式碼範例。
保持回答簡潔但技術性強。"""

    print("系統提示已自定義為程式設計助手")
    bot.run_bot()


def example_custom_commands():
    """添加自定義命令範例"""
    print("=" * 60)
    print("自定義命令範例")
    print("=" * 60)

    class CustomBot(DiscordChatbot):
        """擴展的機器人類別"""

        async def _register_commands(self):
            """註冊命令（包括自定義命令）"""
            # 先註冊基礎命令
            await super()._register_commands()

            # 添加翻譯命令
            @self.tree.command(
                name="translate",
                description="翻譯文本到指定語言"
            )
            @app_commands.describe(
                text="要翻譯的文本",
                target_language="目標語言（例如：英文、日文）"
            )
            async def translate(
                interaction: discord.Interaction,
                text: str,
                target_language: str
            ):
                await interaction.response.defer(thinking=True)

                try:
                    prompt = f"請將以下文本翻譯成{target_language}：\n\n{text}"
                    response = await self._generate_response(
                        prompt,
                        interaction.user.id
                    )
                    await interaction.followup.send(response)
                except Exception as e:
                    await interaction.followup.send(f"翻譯時發生錯誤: {e}")

            # 添加總結命令
            @self.tree.command(
                name="summarize",
                description="總結文本內容"
            )
            @app_commands.describe(text="要總結的文本")
            async def summarize(interaction: discord.Interaction, text: str):
                await interaction.response.defer(thinking=True)

                try:
                    prompt = f"請用 3-5 點總結以下內容：\n\n{text}"
                    response = await self._generate_response(
                        prompt,
                        interaction.user.id
                    )
                    await interaction.followup.send(response)
                except Exception as e:
                    await interaction.followup.send(f"總結時發生錯誤: {e}")

            # 添加程式碼審查命令
            @self.tree.command(
                name="review",
                description="審查程式碼"
            )
            @app_commands.describe(code="要審查的程式碼")
            async def review(interaction: discord.Interaction, code: str):
                await interaction.response.defer(thinking=True)

                try:
                    prompt = f"""請審查以下程式碼，提供：
1. 程式碼品質評分（1-10）
2. 優點
3. 改進建議
4. 安全問題（如有）

程式碼：
```
{code}
```"""
                    response = await self._generate_response(
                        prompt,
                        interaction.user.id
                    )
                    await interaction.followup.send(response)
                except Exception as e:
                    await interaction.followup.send(f"審查時發生錯誤: {e}")

    bot = CustomBot(
        discord_token=os.getenv("DISCORD_BOT_TOKEN"),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    print("已添加自定義命令：/translate, /summarize, /review")
    bot.run_bot()


def example_event_handlers():
    """自定義事件處理器範例"""
    print("=" * 60)
    print("自定義事件處理器範例")
    print("=" * 60)

    class EventBot(DiscordChatbot):
        """帶有自定義事件處理的機器人"""

        async def on_member_join(self, member: discord.Member):
            """成員加入時觸發"""
            # 發送歡迎訊息到系統頻道
            if member.guild.system_channel:
                embed = discord.Embed(
                    title="🎉 歡迎新成員！",
                    description=f"歡迎 {member.mention} 加入伺服器！",
                    color=discord.Color.green()
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                await member.guild.system_channel.send(embed=embed)

        async def on_member_remove(self, member: discord.Member):
            """成員離開時觸發"""
            if member.guild.system_channel:
                await member.guild.system_channel.send(
                    f"👋 {member.name} 離開了伺服器。"
                )

        async def on_message_edit(self, before: discord.Message, after: discord.Message):
            """訊息被編輯時觸發"""
            # 忽略機器人訊息
            if before.author.bot:
                return

            # 可以記錄編輯歷史或做其他處理
            print(f"訊息被編輯: {before.content} -> {after.content}")

    bot = EventBot(
        discord_token=os.getenv("DISCORD_BOT_TOKEN"),
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    print("已添加事件處理器：成員加入/離開、訊息編輯")
    bot.run_bot()


if __name__ == "__main__":
    print("Discord Bot 範例")
    print()
    print("請選擇範例：")
    print("1. 基本使用")
    print("2. 自定義系統提示")
    print("3. 添加自定義命令")
    print("4. 自定義事件處理器")
    print()

    choice = input("請輸入選項 (1-4): ").strip()

    if choice == "1":
        example_basic()
    elif choice == "2":
        example_custom_prompt()
    elif choice == "3":
        example_custom_commands()
    elif choice == "4":
        example_event_handlers()
    else:
        print("無效的選項")
