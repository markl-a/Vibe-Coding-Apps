"""
AI Chatbot with support for multiple backends (OpenAI, Ollama)
"""
import sys
from typing import List, Dict, Optional, Generator
import openai
import requests

from config import Config
from utils import (
    save_conversation,
    load_conversation,
    format_message,
    print_colored,
    truncate_history
)


class Chatbot:
    """AI Chatbot class supporting multiple model providers"""

    def __init__(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ):
        """
        Initialize the chatbot

        Args:
            provider: Model provider ('openai' or 'ollama')
            model: Model name
            system_prompt: System prompt for the chatbot
            temperature: Temperature for response generation
            max_tokens: Maximum tokens in response
        """
        self.provider = provider or Config.MODEL_PROVIDER
        self.model = model or Config.DEFAULT_MODEL
        self.temperature = temperature or Config.TEMPERATURE
        self.max_tokens = max_tokens or Config.MAX_TOKENS

        # Initialize conversation history
        self.messages: List[Dict] = []

        # Set system prompt
        if system_prompt or Config.SYSTEM_PROMPT:
            self.messages.append(
                format_message("system", system_prompt or Config.SYSTEM_PROMPT)
            )

        # Configure provider
        if self.provider == "openai":
            self._setup_openai()
        elif self.provider == "ollama":
            self._setup_ollama()
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _setup_openai(self):
        """Setup OpenAI client"""
        if not Config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")

        self.client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

    def _setup_ollama(self):
        """Setup Ollama client"""
        self.ollama_url = f"{Config.OLLAMA_BASE_URL}/api/chat"

    def chat(self, user_message: str) -> str:
        """
        Send a message and get a response

        Args:
            user_message: User's message

        Returns:
            Assistant's response
        """
        # Add user message to history
        self.messages.append(format_message("user", user_message))

        # Get response based on provider
        if self.provider == "openai":
            response = self._chat_openai()
        elif self.provider == "ollama":
            response = self._chat_ollama()
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

        # Add assistant response to history
        self.messages.append(format_message("assistant", response))

        return response

    def _chat_openai(self) -> str:
        """Get response from OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=self.messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"

    def _chat_ollama(self) -> str:
        """Get response from Ollama"""
        try:
            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "messages": self.messages,
                    "stream": False
                }
            )
            response.raise_for_status()
            return response.json()["message"]["content"]
        except Exception as e:
            return f"Error: {str(e)}"

    def chat_stream(self, user_message: str) -> Generator[str, None, None]:
        """
        Send a message and get a streaming response

        Args:
            user_message: User's message

        Yields:
            Chunks of the assistant's response
        """
        # Add user message to history
        self.messages.append(format_message("user", user_message))

        full_response = ""

        if self.provider == "openai":
            try:
                stream = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    stream=True
                )

                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield content
            except Exception as e:
                yield f"Error: {str(e)}"

        elif self.provider == "ollama":
            try:
                response = requests.post(
                    self.ollama_url,
                    json={
                        "model": self.model,
                        "messages": self.messages,
                        "stream": True
                    },
                    stream=True
                )

                for line in response.iter_lines():
                    if line:
                        import json
                        data = json.loads(line)
                        if "message" in data:
                            content = data["message"]["content"]
                            full_response += content
                            yield content
            except Exception as e:
                yield f"Error: {str(e)}"

        # Add complete response to history
        self.messages.append(format_message("assistant", full_response))

    def get_history(self) -> List[Dict]:
        """Get conversation history"""
        return self.messages.copy()

    def clear_history(self):
        """Clear conversation history (keeps system prompt)"""
        system_messages = [msg for msg in self.messages if msg["role"] == "system"]
        self.messages = system_messages

    def save_history(self, filename: str):
        """Save conversation history to file"""
        save_conversation(self.messages, filename)

    def load_history(self, filename: str):
        """Load conversation history from file"""
        self.messages = load_conversation(filename)

    def truncate_history(self, max_messages: int = 10):
        """Truncate conversation history"""
        self.messages = truncate_history(self.messages, max_messages)


def main():
    """Main function for CLI interface"""
    print_colored("=== AI Chatbot ===", "green")
    print_colored(f"Provider: {Config.MODEL_PROVIDER}", "blue")
    print_colored(f"Model: {Config.DEFAULT_MODEL}", "blue")
    print_colored("Type 'quit' or 'exit' to end the conversation\n", "yellow")

    # Initialize chatbot
    try:
        bot = Chatbot()
    except ValueError as e:
        print_colored(f"Error: {e}", "red")
        sys.exit(1)

    # Main conversation loop
    while True:
        try:
            # Get user input
            user_input = input("\nYou: ").strip()

            if not user_input:
                continue

            # Check for exit commands
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print_colored("\nGoodbye!", "green")

                # Ask to save conversation
                save = input("Save conversation? (y/n): ").strip().lower()
                if save == 'y':
                    filename = input("Filename (default: conversation.json): ").strip()
                    filename = filename or "conversation.json"
                    bot.save_history(filename)

                break

            # Get response
            print_colored("\nAssistant: ", "blue", end="")
            response = bot.chat(user_input)
            print(response)

        except KeyboardInterrupt:
            print_colored("\n\nInterrupted. Goodbye!", "yellow")
            break
        except Exception as e:
            print_colored(f"\nError: {e}", "red")


if __name__ == "__main__":
    main()
