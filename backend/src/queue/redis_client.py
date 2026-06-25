import os
import redis
from typing import Optional

class RedisClient:
    def __init__(self):
        host = os.getenv("REDIS_HOST", "localhost")
        port_raw = os.getenv("REDIS_PORT", "6379")
        password = os.getenv("REDIS_PASSWORD", None)
        
        try:
            port = int(port_raw)
        except ValueError:
            port = 6379
            
        if password == "":
            password = None
            
        self.client = redis.Redis(
            host=host,
            port=port,
            password=password,
            decode_responses=True,
            socket_timeout=5.0
        )

    def is_duplicate(self, url: str) -> bool:
        """
        Check if the source_url has already been scraped.
        """
        try:
            return self.client.sismember("seen_urls", url) == 1
        except Exception:
            # In case Redis is offline during local testing or transient network issues
            return False

    def add_url(self, url: str) -> bool:
        """
        Add the source_url to the seen set and set key expiration to 48 hours.
        """
        try:
            self.client.sadd("seen_urls", url)
            self.client.expire("seen_urls", 172800)  # 48 hours
            return True
        except Exception:
            return False
