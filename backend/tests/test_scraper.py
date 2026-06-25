import pytest
from unittest.mock import MagicMock
from backend.src.scraper.vietnamplus import VietnamPlusScraper

MOCK_HOMEPAGE_HTML = """
<html>
<body>
    <div class="story-list">
        <article class="story">
            <a href="/chinh-tri/ban-tin-chinh-tri-nong/123.vnp">Bản tin chính trị nóng</a>
        </article>
        <article class="story">
            <a href="/kinh-te/ban-tin-kinh-te-moi/456.vnp">Bản tin kinh tế mới</a>
        </article>
        <article class="story">
            <a href="https://example.com/other-site">External Link</a>
        </article>
    </div>
</body>
</html>
"""

MOCK_ARTICLE_HTML = """
<html>
<head>
    <meta property="og:title" content="Bản tin chính trị nóng" />
    <meta property="og:description" content="Tóm tắt bản tin chính trị nóng trong ngày hôm nay." />
    <meta property="og:image" content="https://img.vietnamplus.vn/123.jpg" />
    <meta property="article:published_time" content="2026-06-24T00:00:00+07:00" />
</head>
<body>
    <div class="breadcrumb">
        <a href="/">Trang chủ</a>
        <a href="/chinh-tri/">Chính trị</a>
    </div>
    <h1 class="details__headline">Bản tin chính trị nóng</h1>
</body>
</html>
"""

def test_extract_article_links():
    scraper = VietnamPlusScraper()
    links = scraper.extract_links(MOCK_HOMEPAGE_HTML)
    assert len(links) == 2
    assert "https://www.vietnamplus.vn/chinh-tri/ban-tin-chinh-tri-nong/123.vnp" in links
    assert "https://www.vietnamplus.vn/kinh-te/ban-tin-kinh-te-moi/456.vnp" in links

def test_parse_article_details():
    scraper = VietnamPlusScraper()
    url = "https://www.vietnamplus.vn/chinh-tri/ban-tin-chinh-tri-nong/123.vnp"
    details = scraper.parse_article(url, MOCK_ARTICLE_HTML)
    
    assert details["source_url"] == url
    assert details["title"] == "Bản tin chính trị nóng"
    assert details["summary"] == "Tóm tắt bản tin chính trị nóng trong ngày hôm nay."
    assert details["category"] == "chinh-tri"
    assert details["thumbnail_url"] == "https://img.vietnamplus.vn/123.jpg"
    assert details["published_at"] == "2026-06-24T00:00:00+07:00"

def test_scraper_get_latest_articles(mocker):
    scraper = VietnamPlusScraper()
    
    # Mock network responses
    mock_get = mocker.patch("httpx.get")
    
    # Mock response for homepage
    mock_resp_home = MagicMock()
    mock_resp_home.status_code = 200
    mock_resp_home.text = MOCK_HOMEPAGE_HTML
    
    # Mock response for articles
    mock_resp_art = MagicMock()
    mock_resp_art.status_code = 200
    mock_resp_art.text = MOCK_ARTICLE_HTML
    
    mock_get.side_effect = [mock_resp_home, mock_resp_art, mock_resp_art]
    
    articles = scraper.get_latest_articles(limit=2)
    assert len(articles) == 2
    assert articles[0]["title"] == "Bản tin chính trị nóng"
    assert articles[0]["category"] == "chinh-tri"

def test_parse_amp_story_article_details():
    scraper = VietnamPlusScraper()
    url = "https://www.vietnamplus.vn/toa-thanh-cao-dai-tay-ninh-diem-nhan-du-lich-van-hoa-doc-dao-vung-nam-bo-post1112004.vnp"
    amp_html = """
    <html>
    <head>
        <meta property="og:title" content="Tòa Thánh Cao Đài" />
        <meta property="og:description" content="Tóm tắt." />
        <meta property="og:image" content="https://img.vietnamplus.vn/cropped-landscape.jpg" />
    </head>
    <body>
        <amp-story standalone title="Tòa Thánh Cao Đài" publisher="VietnamPlus">
            <amp-story-page id="cover">
                <amp-img src="https://img.vietnamplus.vn/original-portrait.png.avif" alt="Cover"></amp-img>
            </amp-story-page>
        </amp-story>
    </body>
    </html>
    """
    details = scraper.parse_article(url, amp_html)
    assert details["thumbnail_url"] == "https://img.vietnamplus.vn/original-portrait.png.webp"
