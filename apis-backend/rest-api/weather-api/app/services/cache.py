import redis
import json
from app.config import Config

class CacheService:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=Config.REDIS_HOST,
            port=Config.REDIS_PORT,
            db=Config.REDIS_DB,
            password=Config.REDIS_PASSWORD,
            decode_responses=True
        )
        self.expiration = Config.CACHE_EXPIRATION

    def get(self, key):
        """從快取中獲取數據"""
        try:
            data = self.redis_client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, key, value, expiration=None):
        """設置快取數據"""
        try:
            exp = expiration if expiration else self.expiration
            self.redis_client.setex(
                key,
                exp,
                json.dumps(value)
            )
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    def delete(self, key):
        """刪除快取數據"""
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    def clear_all(self):
        """清除所有快取"""
        try:
            self.redis_client.flushdb()
            return True
        except Exception as e:
            print(f"Cache clear error: {e}")
            return False

cache_service = CacheService()
