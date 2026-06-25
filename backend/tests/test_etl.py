import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone, timedelta
from backend.src.etl.cleaner import clean_summary
from backend.src.etl.classifier import calculate_hot_score
from backend.src.etl.pipeline import ETLPipeline

def test_clean_summary_strips_html():
    dirty = "<p>Bản tin <strong>quan trọng</strong> tối nay.</p>"
    assert clean_summary(dirty) == "Bản tin quan trọng tối nay."

def test_clean_summary_whitespace():
    dirty = "   Bản tin    rất  nhiều    khoảng  trắng.   "
    assert clean_summary(dirty) == "Bản tin rất nhiều khoảng trắng."

def test_clean_summary_caps_length():
    dirty = "A" * 500
    cleaned = clean_summary(dirty)
    assert len(cleaned) == 280
    assert cleaned.endswith("...")

def test_calculate_hot_score_fresh_political_news():
    # Fresh political news with a keyword "khẩn"
    now_iso = datetime.now(timezone.utc).isoformat()
    article = {
        "published_at": now_iso,
        "category": "chinh-tri",
        "title": "Bản tin khẩn về thời tiết"
    }
    score = calculate_hot_score(article)
    # Fresh: 40, Cat: 25, Keyword: 15. Total = 80
    assert score == 80

def test_calculate_hot_score_old_other_news():
    # 24 hours old, other category, no keyword boost
    old_time = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    article = {
        "published_at": old_time,
        "category": "other",
        "title": "Bản tin bình thường"
    }
    score = calculate_hot_score(article)
    # Freshness: 0, Cat: 5, Keyword: 0. Total = 5
    assert score == 5

def test_calculate_hot_score_clamped():
    # Fresh, chinh-tri, multiple keyword boosts, score should cap at 80 (since components max out at 40 + 25 + 15)
    now_iso = datetime.now(timezone.utc).isoformat()
    article = {
        "published_at": now_iso,
        "category": "chinh-tri",
        "title": "Nóng khẩn cấp chính thức công bố đột phá mới"
    }
    score = calculate_hot_score(article)
    assert score == 80

def test_pipeline_run(mocker):
    # Mock Scraper, Redis, DB client
    mock_scraper = MagicMock()
    mock_scraper.get_latest_articles.return_value = [
        {
            "source_url": "https://example.com/art1",
            "title": "Bản tin chính trị nóng",
            "summary": "Tóm tắt.",
            "category": "chinh-tri",
            "thumbnail_url": "https://example.com/art1.jpg",
            "published_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "source_url": "https://example.com/art2",
            "title": "Bản tin kinh tế",
            "summary": "Tóm tắt.",
            "category": "kinh-te",
            "thumbnail_url": "https://example.com/art2.jpg",
            "published_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    mock_redis = MagicMock()
    # Mock art1 as duplicate, art2 as new
    mock_redis.is_duplicate.side_effect = lambda url: url == "https://example.com/art1"
    
    mock_db = MagicMock()
    
    # Patch constructors where they are imported inside the pipeline module
    mocker.patch("backend.src.etl.pipeline.VietnamPlusScraper", return_value=mock_scraper)
    mocker.patch("backend.src.etl.pipeline.RedisClient", return_value=mock_redis)
    mocker.patch("backend.src.etl.pipeline.NeonDBClient", return_value=mock_db)
    
    pipeline = ETLPipeline()
    processed_count = pipeline.run(limit=10)
    
    # Processed count should be 1 (art1 skipped, art2 processed)
    assert processed_count == 1
    
    # Assert DB upsert called for art2
    mock_db.upsert_article.assert_called_once()
    upserted_arg = mock_db.upsert_article.call_args[0][0]
    assert upserted_arg["source_url"] == "https://example.com/art2"
    assert upserted_arg["hot_score"] == 60 # Fresh (40) + kinh-te (20) = 60
    
    # Assert Redis add_url called for art2
    mock_redis.add_url.assert_called_once_with("https://example.com/art2")
