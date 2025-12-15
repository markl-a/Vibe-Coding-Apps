import os
from pydantic_settings import BaseSettings
from typing import List

def get_required_env(key: str, default: str = None) -> str:
    """Get required environment variable or raise error in production."""
    value = os.getenv(key, default)
    if value is None and os.getenv('ENVIRONMENT', 'development') == 'production':
        raise ValueError(f"Required environment variable {key} is not set")
    return value or default or ""

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "E-commerce API"
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true'
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database - Required in production
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/ecommerce_db')

    # Security - Required in production
    SECRET_KEY: str = get_required_env('SECRET_KEY', 'dev-only-secret-key-change-in-production')
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
