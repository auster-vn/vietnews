import pytest
from unittest.mock import MagicMock
from backend.src.queue.redis_client import RedisClient

def test_redis_is_duplicate_false(mocker):
    # Mock redis instance
    mock_redis = MagicMock()
    mock_redis.sismember.return_value = 0
    mocker.patch("redis.Redis", return_value=mock_redis)
    
    client = RedisClient()
    url = "https://example.com/article1"
    
    assert not client.is_duplicate(url)
    mock_redis.sismember.assert_called_once_with("seen_urls", url)

def test_redis_is_duplicate_true(mocker):
    mock_redis = MagicMock()
    mock_redis.sismember.return_value = 1
    mocker.patch("redis.Redis", return_value=mock_redis)
    
    client = RedisClient()
    url = "https://example.com/article1"
    
    assert client.is_duplicate(url)
    mock_redis.sismember.assert_called_once_with("seen_urls", url)

def test_redis_add_url(mocker):
    mock_redis = MagicMock()
    mocker.patch("redis.Redis", return_value=mock_redis)
    
    client = RedisClient()
    url = "https://example.com/article1"
    
    client.add_url(url)
    mock_redis.sadd.assert_called_once_with("seen_urls", url)
    mock_redis.expire.assert_called_once_with("seen_urls", 172800)
