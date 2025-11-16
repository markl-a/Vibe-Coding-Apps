import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))

    # Redis
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    CACHE_EXPIRATION = int(os.getenv('CACHE_EXPIRATION', 3600))

    # Weather API Keys
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
    WEATHERAPI_KEY = os.getenv('WEATHERAPI_KEY', '')

    # Rate Limiting
    RATE_LIMIT = os.getenv('RATE_LIMIT', '100 per hour')
    RATE_LIMIT_STORAGE_URL = os.getenv('RATE_LIMIT_STORAGE_URL', f'redis://{REDIS_HOST}:{REDIS_PORT}/1')

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
