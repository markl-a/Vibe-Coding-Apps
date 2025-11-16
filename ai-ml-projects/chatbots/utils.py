"""
Utility functions for the chatbot
"""
import json
from datetime import datetime
from typing import List, Dict


def save_conversation(messages: List[Dict], filename: str) -> None:
    """
    Save conversation history to a JSON file

    Args:
        messages: List of message dictionaries
        filename: Output filename
    """
    data = {
        "timestamp": datetime.now().isoformat(),
        "messages": messages
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Conversation saved to {filename}")


def load_conversation(filename: str) -> List[Dict]:
    """
    Load conversation history from a JSON file

    Args:
        filename: Input filename

    Returns:
        List of message dictionaries
    """
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)

        messages = data.get("messages", [])
        print(f"Conversation loaded from {filename}")
        return messages
    except FileNotFoundError:
        print(f"File {filename} not found")
        return []
    except json.JSONDecodeError:
        print(f"Error decoding {filename}")
        return []


def count_tokens_estimate(text: str) -> int:
    """
    Estimate token count for a text string
    Simple estimation: ~4 characters per token

    Args:
        text: Input text

    Returns:
        Estimated token count
    """
    return len(text) // 4


def format_message(role: str, content: str) -> Dict:
    """
    Format a message dictionary

    Args:
        role: Message role (system, user, assistant)
        content: Message content

    Returns:
        Formatted message dictionary
    """
    return {
        "role": role,
        "content": content
    }


def print_colored(text: str, color: str = "white") -> None:
    """
    Print colored text to console

    Args:
        text: Text to print
        color: Color name (green, blue, yellow, red, white)
    """
    colors = {
        "green": "\033[92m",
        "blue": "\033[94m",
        "yellow": "\033[93m",
        "red": "\033[91m",
        "white": "\033[97m",
        "reset": "\033[0m"
    }

    color_code = colors.get(color.lower(), colors["white"])
    print(f"{color_code}{text}{colors['reset']}")


def truncate_history(messages: List[Dict], max_messages: int = 10) -> List[Dict]:
    """
    Truncate conversation history to keep only recent messages
    Always keeps the system message if present

    Args:
        messages: List of message dictionaries
        max_messages: Maximum number of messages to keep

    Returns:
        Truncated message list
    """
    if len(messages) <= max_messages:
        return messages

    # Keep system message if it exists
    system_messages = [msg for msg in messages if msg["role"] == "system"]
    other_messages = [msg for msg in messages if msg["role"] != "system"]

    # Keep only the most recent messages
    recent_messages = other_messages[-(max_messages - len(system_messages)):]

    return system_messages + recent_messages
