import pytest
from unittest.mock import MagicMock, ANY
from datetime import datetime, timezone
from backend.src.db.neon import NeonDBClient

def test_upsert_article(mocker):
    mocker.patch("os.getenv", return_value="postgresql://mock:mock@localhost:5432/mock")
    # Mock psycopg2.connect
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mocker.patch("psycopg2.connect", return_value=mock_conn)
    
    client = NeonDBClient()
    
    article_data = {
        "source_url": "https://example.com/art1",
        "title": "Bản tin thời tiết",
        "summary": "Tóm tắt bản tin thời tiết.",
        "category": "xa-hoi",
        "thumbnail_url": "https://example.com/art1.jpg",
        "hot_score": 75,
        "published_at": datetime.now(timezone.utc).isoformat()
    }
    
    client.upsert_article(article_data)
    
    # Assert cursor executed the INSERT ON CONFLICT query
    mock_cursor.execute.assert_called_once()
    sql_arg = mock_cursor.execute.call_args[0][0]
    params_arg = mock_cursor.execute.call_args[0][1]
    
    assert "INSERT INTO articles" in sql_arg
    assert "ON CONFLICT (source_url)" in sql_arg
    assert "DO UPDATE SET" in sql_arg
    assert params_arg[0] == article_data["source_url"]
    assert params_arg[1] == article_data["title"]
    assert params_arg[2] == article_data["summary"]
    
    # Assert connection committed
    mock_conn.commit.assert_called_once()
    mock_cursor.close.assert_called_once()

def test_get_unrendered_articles(mocker):
    mocker.patch("os.getenv", return_value="postgresql://mock:mock@localhost:5432/mock")
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mocker.patch("psycopg2.connect", return_value=mock_conn)
    
    # Mock database query results
    mock_cursor.fetchall.return_value = [
        (
            "123e4567-e89b-12d3-a456-426614174000",
            "https://example.com/art1",
            "Bản tin thời tiết",
            "Tóm tắt",
            "xa-hoi",
            "https://example.com/art1.jpg",
            75,
            datetime.now(timezone.utc),
            1200,
            630
        )
    ]
    
    client = NeonDBClient()
    articles = client.get_unrendered_articles(limit=10)
    
    assert len(articles) == 1
    assert articles[0]["title"] == "Bản tin thời tiết"
    assert articles[0]["hot_score"] == 75
    
    mock_cursor.execute.assert_called_once()
    sql_arg = mock_cursor.execute.call_args[0][0]
    params_arg = mock_cursor.execute.call_args[0][1]
    
    assert "WHERE is_rendered = FALSE" in sql_arg
    assert params_arg[0] == 10
    mock_cursor.close.assert_called_once()
