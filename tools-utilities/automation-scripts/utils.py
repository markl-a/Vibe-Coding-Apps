#!/usr/bin/env python3
"""
utils.py - 自動化腳本通用工具模組
提供通知、進度條、AI輔助等共用功能
"""

import os
import sys
import json
import logging
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Optional, List, Any
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None

logger = logging.getLogger(__name__)


# ============================================================================
# 進度條工具
# ============================================================================

class ProgressBar:
    """進度條包裝器，支援tqdm或簡易進度顯示"""

    def __init__(self, total: int, desc: str = "", disable: bool = False):
        """
        初始化進度條

        Args:
            total: 總項目數
            desc: 描述文字
            disable: 是否禁用進度條
        """
        self.total = total
        self.current = 0
        self.desc = desc
        self.disable = disable

        if tqdm and not disable:
            self.pbar = tqdm(total=total, desc=desc)
        else:
            self.pbar = None
            if not disable and desc:
                print(f"{desc}: 0/{total}")

    def update(self, n: int = 1):
        """更新進度"""
        self.current += n
        if self.pbar:
            self.pbar.update(n)
        elif not self.disable:
            print(f"\r{self.desc}: {self.current}/{self.total}", end='', flush=True)

    def close(self):
        """關閉進度條"""
        if self.pbar:
            self.pbar.close()
        elif not self.disable:
            print()  # 換行

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


# ============================================================================
# 通知工具
# ============================================================================

class Notifier:
    """通知管理器，支援郵件和Webhook"""

    def __init__(self, config: Optional[Dict] = None):
        """
        初始化通知器

        Args:
            config: 通知配置
        """
        self.config = config or {}

    def send_email(
        self,
        subject: str,
        body: str,
        to_emails: List[str],
        html: bool = False
    ) -> bool:
        """
        發送郵件通知

        Args:
            subject: 郵件主題
            body: 郵件內容
            to_emails: 收件人列表
            html: 是否為HTML格式

        Returns:
            bool: 是否成功
        """
        try:
            email_config = self.config.get('email', {})

            if not email_config:
                logger.warning("未配置郵件設定")
                return False

            smtp_server = email_config.get('smtp_server')
            smtp_port = email_config.get('smtp_port', 587)
            username = email_config.get('username')
            password = email_config.get('password')
            from_email = email_config.get('from_email', username)

            if not all([smtp_server, username, password]):
                logger.error("郵件配置不完整")
                return False

            # 創建郵件
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email
            msg['To'] = ', '.join(to_emails)

            # 添加內容
            if html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))

            # 發送郵件
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(username, password)
                server.send_message(msg)

            logger.info(f"郵件已發送至: {', '.join(to_emails)}")
            return True

        except Exception as e:
            logger.error(f"發送郵件失敗: {e}")
            return False

    def send_webhook(
        self,
        webhook_url: str,
        data: Dict,
        headers: Optional[Dict] = None
    ) -> bool:
        """
        發送Webhook通知

        Args:
            webhook_url: Webhook URL
            data: 要發送的數據
            headers: HTTP標頭

        Returns:
            bool: 是否成功
        """
        try:
            headers = headers or {'Content-Type': 'application/json'}

            response = requests.post(
                webhook_url,
                json=data,
                headers=headers,
                timeout=10
            )

            response.raise_for_status()
            logger.info(f"Webhook已發送至: {webhook_url}")
            return True

        except Exception as e:
            logger.error(f"發送Webhook失敗: {e}")
            return False

    def send_slack(self, message: str, channel: Optional[str] = None) -> bool:
        """
        發送Slack通知

        Args:
            message: 訊息內容
            channel: 頻道名稱

        Returns:
            bool: 是否成功
        """
        slack_config = self.config.get('slack', {})
        webhook_url = slack_config.get('webhook_url')

        if not webhook_url:
            logger.warning("未配置Slack webhook")
            return False

        data = {
            'text': message
        }

        if channel:
            data['channel'] = channel

        return self.send_webhook(webhook_url, data)

    def send_discord(self, message: str) -> bool:
        """
        發送Discord通知

        Args:
            message: 訊息內容

        Returns:
            bool: 是否成功
        """
        discord_config = self.config.get('discord', {})
        webhook_url = discord_config.get('webhook_url')

        if not webhook_url:
            logger.warning("未配置Discord webhook")
            return False

        data = {
            'content': message
        }

        return self.send_webhook(webhook_url, data)


# ============================================================================
# AI 輔助工具
# ============================================================================

class AIAssistant:
    """AI 輔助工具類"""

    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo"):
        """
        初始化AI助手

        Args:
            api_key: API密鑰（如果未提供，從環境變數讀取）
            model: 使用的模型
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model
        self.api_endpoint = "https://api.openai.com/v1/chat/completions"

    def generate_text(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> Optional[str]:
        """
        生成文字

        Args:
            prompt: 提示詞
            max_tokens: 最大token數
            temperature: 溫度參數

        Returns:
            Optional[str]: 生成的文字
        """
        if not self.api_key:
            logger.warning("未設定 OPENAI_API_KEY，無法使用AI功能")
            return None

        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            }

            data = {
                'model': self.model,
                'messages': [
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': max_tokens,
                'temperature': temperature
            }

            response = requests.post(
                self.api_endpoint,
                headers=headers,
                json=data,
                timeout=30
            )

            response.raise_for_status()
            result = response.json()

            return result['choices'][0]['message']['content'].strip()

        except Exception as e:
            logger.error(f"AI生成失敗: {e}")
            return None

    def generate_commit_message(self, diff: str) -> Optional[str]:
        """
        根據git diff生成提交訊息

        Args:
            diff: git diff 輸出

        Returns:
            Optional[str]: 生成的提交訊息
        """
        prompt = f"""根據以下 git diff，生成一個簡潔的提交訊息（使用繁體中文）。
提交訊息應該：
1. 第一行是簡短的摘要（不超過50字）
2. 如果需要，第二行空白，第三行開始是詳細說明
3. 使用動詞開頭（如：新增、修改、修復、刪除等）

Git Diff:
{diff[:2000]}

請只輸出提交訊息，不要包含其他說明文字。"""

        return self.generate_text(prompt, max_tokens=200, temperature=0.5)

    def analyze_system_health(self, health_data: Dict) -> Optional[str]:
        """
        分析系統健康數據並提供建議

        Args:
            health_data: 系統健康檢查數據

        Returns:
            Optional[str]: 分析和建議
        """
        prompt = f"""作為系統管理專家，請分析以下系統健康數據並提供優化建議（使用繁體中文）：

{json.dumps(health_data, indent=2, ensure_ascii=False)}

請提供：
1. 主要問題識別
2. 潛在風險評估
3. 具體優化建議
4. 優先級排序

請以清晰的格式輸出，使用要點列表。"""

        return self.generate_text(prompt, max_tokens=800, temperature=0.3)

    def suggest_file_organization(self, files: List[str]) -> Optional[Dict]:
        """
        建議檔案整理方案

        Args:
            files: 檔案列表

        Returns:
            Optional[Dict]: 整理建議
        """
        file_list = '\n'.join(files[:100])  # 限制檔案數量

        prompt = f"""請為以下檔案建議一個合理的目錄結構（使用繁體中文）：

檔案列表：
{file_list}

請以JSON格式輸出，格式如下：
{{
    "分類1": ["file1", "file2"],
    "分類2": ["file3", "file4"]
}}

只輸出JSON，不要包含其他文字。"""

        result = self.generate_text(prompt, max_tokens=1000, temperature=0.5)

        if result:
            try:
                # 嘗試從結果中提取JSON
                import re
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass

        return None


# ============================================================================
# 配置管理
# ============================================================================

class ConfigManager:
    """配置文件管理器"""

    @staticmethod
    def load_config(config_path: Path) -> Optional[Dict]:
        """
        載入配置文件

        Args:
            config_path: 配置文件路徑

        Returns:
            Optional[Dict]: 配置內容
        """
        try:
            if not config_path.exists():
                logger.warning(f"配置文件不存在: {config_path}")
                return None

            with open(config_path, 'r', encoding='utf-8') as f:
                if config_path.suffix == '.json':
                    return json.load(f)
                elif config_path.suffix in ['.yaml', '.yml']:
                    try:
                        import yaml
                        return yaml.safe_load(f)
                    except ImportError:
                        logger.error("需要安裝 PyYAML 來讀取 YAML 文件")
                        return None
                else:
                    logger.error(f"不支援的配置文件格式: {config_path.suffix}")
                    return None

        except Exception as e:
            logger.error(f"載入配置文件失敗: {e}")
            return None

    @staticmethod
    def save_config(config: Dict, config_path: Path) -> bool:
        """
        保存配置文件

        Args:
            config: 配置內容
            config_path: 配置文件路徑

        Returns:
            bool: 是否成功
        """
        try:
            config_path.parent.mkdir(parents=True, exist_ok=True)

            with open(config_path, 'w', encoding='utf-8') as f:
                if config_path.suffix == '.json':
                    json.dump(config, f, indent=2, ensure_ascii=False)
                elif config_path.suffix in ['.yaml', '.yml']:
                    try:
                        import yaml
                        yaml.safe_dump(config, f, allow_unicode=True)
                    except ImportError:
                        logger.error("需要安裝 PyYAML 來保存 YAML 文件")
                        return False
                else:
                    logger.error(f"不支援的配置文件格式: {config_path.suffix}")
                    return False

            logger.info(f"配置已保存至: {config_path}")
            return True

        except Exception as e:
            logger.error(f"保存配置文件失敗: {e}")
            return False


# ============================================================================
# 檔案大小工具
# ============================================================================

def format_size(size_bytes: int) -> str:
    """
    格式化檔案大小為人類可讀格式

    Args:
        size_bytes: 檔案大小（字節）

    Returns:
        str: 格式化的大小字符串
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def parse_size(size_str: str) -> int:
    """
    解析大小字符串為字節數

    Args:
        size_str: 大小字符串（如 "100M", "1.5G"）

    Returns:
        int: 字節數
    """
    units = {
        'B': 1,
        'K': 1024,
        'KB': 1024,
        'M': 1024 ** 2,
        'MB': 1024 ** 2,
        'G': 1024 ** 3,
        'GB': 1024 ** 3,
        'T': 1024 ** 4,
        'TB': 1024 ** 4
    }

    size_str = size_str.upper().strip()

    # 嘗試匹配單位
    for unit, multiplier in sorted(units.items(), key=lambda x: -len(x[0])):
        if size_str.endswith(unit):
            try:
                number = float(size_str[:-len(unit)])
                return int(number * multiplier)
            except ValueError:
                pass

    # 如果沒有單位，假設是字節
    try:
        return int(size_str)
    except ValueError:
        raise ValueError(f"無法解析大小: {size_str}")


# ============================================================================
# 時間格式化工具
# ============================================================================

def format_duration(seconds: int) -> str:
    """
    格式化時間長度

    Args:
        seconds: 秒數

    Returns:
        str: 格式化的時間字符串
    """
    if seconds < 60:
        return f"{seconds}秒"
    elif seconds < 3600:
        minutes = seconds // 60
        secs = seconds % 60
        return f"{minutes}分{secs}秒"
    elif seconds < 86400:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{hours}小時{minutes}分"
    else:
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        return f"{days}天{hours}小時"


if __name__ == '__main__':
    # 簡單測試
    print("=== 工具模組測試 ===\n")

    # 測試大小格式化
    print(f"格式化大小: {format_size(1024 * 1024 * 500)}")
    print(f"解析大小: {parse_size('100M')} 字節")

    # 測試時間格式化
    print(f"格式化時間: {format_duration(3665)}")

    # 測試進度條
    print("\n測試進度條:")
    with ProgressBar(100, desc="處理中") as pbar:
        import time
        for i in range(100):
            time.sleep(0.01)
            pbar.update(1)

    print("\n✓ 測試完成")
