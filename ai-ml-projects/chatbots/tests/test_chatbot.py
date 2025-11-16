"""
Unit tests for the chatbot
"""
import unittest
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from chatbot import Chatbot
from utils import (
    format_message,
    count_tokens_estimate,
    truncate_history
)


class TestChatbot(unittest.TestCase):
    """Test cases for Chatbot class"""

    @patch('chatbot.Config')
    def test_chatbot_initialization(self, mock_config):
        """Test chatbot initialization"""
        mock_config.MODEL_PROVIDER = "openai"
        mock_config.DEFAULT_MODEL = "gpt-3.5-turbo"
        mock_config.SYSTEM_PROMPT = "Test prompt"
        mock_config.TEMPERATURE = 0.7
        mock_config.MAX_TOKENS = 2000
        mock_config.OPENAI_API_KEY = "test_key"

        bot = Chatbot()

        self.assertEqual(bot.provider, "openai")
        self.assertEqual(bot.model, "gpt-3.5-turbo")
        self.assertEqual(len(bot.messages), 1)
        self.assertEqual(bot.messages[0]["role"], "system")

    def test_clear_history(self):
        """Test clearing conversation history"""
        bot = Chatbot.__new__(Chatbot)
        bot.messages = [
            {"role": "system", "content": "System"},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi"}
        ]

        bot.clear_history()

        self.assertEqual(len(bot.messages), 1)
        self.assertEqual(bot.messages[0]["role"], "system")

    def test_get_history(self):
        """Test getting conversation history"""
        bot = Chatbot.__new__(Chatbot)
        bot.messages = [
            {"role": "user", "content": "Hello"}
        ]

        history = bot.get_history()

        self.assertEqual(len(history), 1)
        self.assertIsNot(history, bot.messages)  # Should be a copy


class TestUtils(unittest.TestCase):
    """Test cases for utility functions"""

    def test_format_message(self):
        """Test message formatting"""
        msg = format_message("user", "Hello")

        self.assertEqual(msg["role"], "user")
        self.assertEqual(msg["content"], "Hello")

    def test_count_tokens_estimate(self):
        """Test token counting estimation"""
        text = "Hello world"
        tokens = count_tokens_estimate(text)

        self.assertGreater(tokens, 0)
        self.assertLess(tokens, len(text))

    def test_truncate_history(self):
        """Test history truncation"""
        messages = [
            {"role": "system", "content": "System"},
            {"role": "user", "content": "1"},
            {"role": "assistant", "content": "1"},
            {"role": "user", "content": "2"},
            {"role": "assistant", "content": "2"},
            {"role": "user", "content": "3"},
            {"role": "assistant", "content": "3"}
        ]

        truncated = truncate_history(messages, max_messages=4)

        # Should keep system message + 3 most recent messages
        self.assertEqual(len(truncated), 4)
        self.assertEqual(truncated[0]["role"], "system")
        self.assertEqual(truncated[-1]["content"], "3")


if __name__ == "__main__":
    unittest.main()
