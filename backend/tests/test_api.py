import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# Mock the database client and background task functions
@pytest.fixture
def mock_db(mocker):
    db_mock = MagicMock()
    mocker.patch("backend.src.api.main.db_client", db_mock)
    return db_mock

@pytest.fixture
def mock_run_crawl(mocker):
    run_crawl_mock = MagicMock()
    mocker.patch("backend.src.api.main.run_crawl_and_render", run_crawl_mock)
    return run_crawl_mock

@pytest.fixture
def client(mocker):
    # We import inside fixture to allow mocker.patch to run first if necessary
    from backend.src.api.main import app
    return TestClient(app)

def test_get_articles_default(client, mock_db):
    mock_db.get_articles.return_value = [{"title": "Article 1"}]
    response = client.get("/api/articles")
    assert response.status_code == 200
    assert response.json() == [{"title": "Article 1"}]
    mock_db.get_articles.assert_called_once_with(hot=False, category=None, limit=20)

def test_get_articles_with_filters(client, mock_db):
    mock_db.get_articles.return_value = [{"title": "Hot Political Article"}]
    response = client.get("/api/articles?hot=true&category=chinh-tri&limit=5")
    assert response.status_code == 200
    assert response.json() == [{"title": "Hot Political Article"}]
    mock_db.get_articles.assert_called_once_with(hot=True, category="chinh-tri", limit=5)

def test_get_banner(client, mock_db):
    mock_db.get_banner_articles.return_value = [{"title": "Banner Article"}]
    response = client.get("/api/banner")
    assert response.status_code == 200
    assert response.json() == [{"title": "Banner Article"}]
    mock_db.get_banner_articles.assert_called_once()

def test_post_internal_crawl_unauthorized(client, mock_run_crawl, mocker):
    mocker.patch("os.getenv", return_value="super-secret")
    response = client.post("/internal/crawl", headers={"X-Cron-Token": "wrong-secret"})
    assert response.status_code == 401
    mock_run_crawl.assert_not_called()

def test_post_internal_crawl_authorized(client, mock_run_crawl, mocker):
    mocker.patch("os.getenv", return_value="super-secret")
    response = client.post("/internal/crawl", headers={"X-Cron-Token": "super-secret"})
    assert response.status_code == 204
    assert response.content == b""
    # Verify that run_crawl_and_render was scheduled as a background task
    mock_run_crawl.assert_called_once()

def test_get_internal_crawl_authorized_token(client, mock_run_crawl, mocker):
    mock_run_crawl.reset_mock()
    mocker.patch("os.getenv", return_value="super-secret")
    response = client.get("/internal/crawl?token=super-secret")
    assert response.status_code == 204
    assert response.content == b""
    mock_run_crawl.assert_called_once()

def test_get_internal_crawl_authorized_secret(client, mock_run_crawl, mocker):
    mock_run_crawl.reset_mock()
    mocker.patch("os.getenv", return_value="super-secret")
    response = client.get("/internal/crawl?secret=super-secret")
    assert response.status_code == 204
    assert response.content == b""
    mock_run_crawl.assert_called_once()

def test_get_internal_crawl_authorized_header(client, mock_run_crawl, mocker):
    mock_run_crawl.reset_mock()
    mocker.patch("os.getenv", return_value="super-secret")
    response = client.get("/internal/crawl", headers={"X-Cron-Token": "super-secret"})
    assert response.status_code == 204
    assert response.content == b""
    mock_run_crawl.assert_called_once()

def test_get_internal_crawl_unauthorized(client, mock_run_crawl, mocker):
    mock_run_crawl.reset_mock()
    mocker.patch("os.getenv", return_value="super-secret")
    response = client.get("/internal/crawl", headers={"X-Cron-Token": "wrong-secret"})
    assert response.status_code == 401
    mock_run_crawl.assert_not_called()

def test_post_crawl_now_success(client, mock_db, mocker):
    # Mock scraper parsing
    mock_scraped = {
        "source_url": "https://www.vietnamplus.vn/chinh-tri/123.vnp",
        "title": "Crawl Now Article",
        "summary": "Tóm tắt.",
        "category": "chinh-tri",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "published_at": "2026-06-24T00:00:00+07:00"
    }
    mock_scraper = MagicMock()
    mock_scraper.get_latest_articles.return_value = []
    mock_scraper.parse_article.return_value = mock_scraped
    mocker.patch("backend.src.api.main.VietnamPlusScraper", return_value=mock_scraper)
    
    # Mock network page request
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = "<html></html>"
    mocker.patch("httpx.get", return_value=mock_resp)
    
    # Mock DB returns article with rendered image URL sequentially
    mock_article_not_rendered = {
        **mock_scraped,
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "is_rendered": False,
        "rendered_image_url": None
    }
    mock_article_rendered = {
        **mock_scraped,
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "is_rendered": True,
        "rendered_image_url": "https://cloudinary.com/rendered.png"
    }
    mock_db.get_article_by_url.side_effect = [None, mock_article_not_rendered, mock_article_rendered]
    
    # Mock os.path.exists to return True for the renderer path
    mocker.patch("os.path.exists", return_value=True)

    # Mock subprocess run to simulate successful node rendering
    mock_sub = mocker.patch("subprocess.run")
    mock_sub.return_value = MagicMock(returncode=0)
    
    response = client.post("/api/articles/crawl-now", json={"url": "https://www.vietnamplus.vn/chinh-tri/123.vnp"})
    
    assert response.status_code == 200
    assert response.json()["rendered_image_url"] == "https://cloudinary.com/rendered.png"
    
    # Verify DB and rendering sub-processes were called
    mock_db.upsert_article.assert_called_once()
    mock_sub.assert_called_once()
    assert "--id" in mock_sub.call_args[0][0]

def test_post_crawl_now_invalid_url(client):
    response = client.post("/api/articles/crawl-now", json={"url": "https://other-domain.com/art1"})
    assert response.status_code == 400
    assert "VietnamPlus article URL" in response.json()["detail"]

def test_post_crawl_hot_now_success(client, mock_db, mocker):
    # Mock ETLPipeline
    mock_pipeline = MagicMock()
    mock_pipeline.run.return_value = 5
    mocker.patch("backend.src.api.main.ETLPipeline", return_value=mock_pipeline)

    # Mock os.path.exists to return True for the renderer path
    mocker.patch("os.path.exists", return_value=True)

    # Mock subprocess run to simulate rendering
    mock_sub = mocker.patch("subprocess.run")
    mock_sub.return_value = MagicMock(returncode=0)

    # Mock DB articles retrieval
    mock_articles = [{"title": "Hot Article 1", "is_rendered": True}]
    mock_db.get_articles.return_value = mock_articles

    response = client.post("/api/articles/crawl-hot-now")
    
    assert response.status_code == 200
    assert response.json() == mock_articles

    # Verify pipeline was run and rendering subprocess was executed
    mock_pipeline.run.assert_called_once_with(limit=20)
    mock_sub.assert_called_once()
    mock_db.get_articles.assert_called_once_with(hot=False, category=None, limit=50)

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

