"""
Configuration management for the chatbot
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Configuration class for chatbot settings"""

    # OpenAI settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Model provider settings
    MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "openai")
    DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gpt-3.5-turbo")

    # Ollama settings
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Chatbot settings
    SYSTEM_PROMPT = os.getenv(
        "SYSTEM_PROMPT",
        "You are a helpful AI assistant."
    )
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2000"))
    TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

    @classmethod
    def validate(cls):
        """Validate configuration"""
        if cls.MODEL_PROVIDER == "openai" and not cls.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is required when using OpenAI provider. "
                "Please set it in your .env file."
            )

        if cls.MODEL_PROVIDER not in ["openai", "ollama"]:
            raise ValueError(
                f"Invalid MODEL_PROVIDER: {cls.MODEL_PROVIDER}. "
                "Must be 'openai' or 'ollama'."
            )

        return True


# Validate configuration on import
if __name__ != "__main__":
    try:
        Config.validate()
    except ValueError as e:
        print(f"Configuration Warning: {e}")
