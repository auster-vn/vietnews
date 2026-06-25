import httpx
from selectolax.parser import HTMLParser
from typing import List, Dict, Any
from backend.src.scraper.base import BaseScraper

class VietnamPlusScraper(BaseScraper):
    def __init__(self):
        self.base_url = "https://www.vietnamplus.vn"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def extract_links(self, html: str) -> List[str]:
        """
        Extract absolute article URLs from the homepage HTML.
        """
        parser = HTMLParser(html)
        links = []
        static_paths = [
            "/gioi-thieu", "/ho-tro", "/quy-dinh", "/location", "/so-huu-tri-tue", 
            "/tin-doc-nhieu", "/huong-dan", "/chinh-sach", "/rss", "/contact", 
            "/lien-he", "/dich-vu-tin", "/quang-cao", "/sub", "/chuyen-trang", 
            "/mobile", "/site/"
        ]
        for node in parser.css("a[href]"):
            href = node.attributes.get("href", "").strip()
            if href.startswith(self.base_url):
                href = href[len(self.base_url):]
                
            if href.startswith("/"):
                # Exclude static/utility/promotional sections
                if any(sp in href for sp in static_paths) or href.startswith("/topic/"):
                    continue
                # Clean relative URL and normalize it
                # Filter out standard non-article pages
                if href.endswith(".vnp") or any(cat in href for cat in ["/chinh-tri/", "/kinh-te/", "/the-gioi/", "/xa-hoi/", "/the-thao/", "/khoa-hoc/", "/van-hoa/"]):
                    full_url = f"{self.base_url}{href}"
                    if full_url not in links:
                        links.append(full_url)
        return links

    def parse_article(self, url: str, html: str) -> Dict[str, Any]:
        """
        Parse article details from the HTML of an article page.
        """
        parser = HTMLParser(html)
        
        # Extract title from meta property or h1
        title_meta = parser.css_first('meta[property="og:title"]')
        title = title_meta.attributes.get("content", "").strip() if title_meta else ""
        if not title:
            title_h1 = parser.css_first("h1.details__headline")
            title = title_h1.text().strip() if title_h1 else ""
            
        # Extract summary from og:description
        summary_meta = parser.css_first('meta[property="og:description"]')
        summary = summary_meta.attributes.get("content", "").strip() if summary_meta else ""
        
        # Categorize based on URL segments
        category = "other"
        allowed_categories = ["chinh-tri", "kinh-te", "the-gioi", "xa-hoi", "the-thao", "khoa-hoc", "van-hoa"]
        for part in url.split("/"):
            if part in allowed_categories:
                category = part
                break
                
        # Fallback to article:section meta tag if URL categorization yielded "other"
        if category == "other":
            section_meta = parser.css_first('meta[property="article:section"]')
            section_content = section_meta.attributes.get("content", "").strip() if section_meta else ""
            if section_content:
                vietnamese_category_map = {
                    "chính trị": "chinh-tri",
                    "kinh tế": "kinh-te",
                    "thế giới": "the-gioi",
                    "xã hội": "xa-hoi",
                    "thể thao": "the-thao",
                    "khoa học": "khoa-hoc",
                    "công nghệ": "khoa-hoc",
                    "văn hóa": "van-hoa",
                    "giải trí": "van-hoa",
                    "pháp luật": "xa-hoi",
                    "đời sống": "xa-hoi"
                }
                for sec in section_content.split(","):
                    sec_clean = sec.strip().lower()
                    if sec_clean in vietnamese_category_map:
                        category = vietnamese_category_map[sec_clean]
                        break
                        
        # Extract thumbnail URL
        thumbnail_url = ""
        
        # 1. Prefer main featured image (usually styled with class "cms-photo")
        cms_img = parser.css_first("img.cms-photo")
        if cms_img:
            src = cms_img.attributes.get("data-src", "").strip() or cms_img.attributes.get("src", "").strip()
            if src and not src.startswith("data:image"):
                if src.startswith("/"):
                    src = f"https://www.vietnamplus.vn{src}"
                if src.lower().endswith(".avif"):
                    src = src[:-5] + ".webp"
                thumbnail_url = src
                
        # 2. Extract high-quality portrait cover photo for AMP Web Stories
        if not thumbnail_url:
            amp_story = parser.css_first("amp-story")
            if amp_story:
                first_amp_img = parser.css_first("amp-img")
                if first_amp_img:
                    src = first_amp_img.attributes.get("src", "").strip()
                    if src:
                        if src.startswith("/"):
                            src = f"https://www.vietnamplus.vn{src}"
                        if src.lower().endswith(".avif"):
                            src = src[:-5] + ".webp"
                        thumbnail_url = src
                        
        # 3. Fall back to first image in article body if no cms-photo or AMP cover is found
        if not thumbnail_url:
            body = parser.css_first(".article__body")
            if body:
                first_img = body.css_first("img")
                if first_img:
                    src = first_img.attributes.get("data-src", "").strip() or first_img.attributes.get("src", "").strip()
                    if src and not src.startswith("data:image"):
                        if src.startswith("/"):
                            src = f"https://www.vietnamplus.vn{src}"
                        if src.lower().endswith(".avif"):
                            src = src[:-5] + ".webp"
                        thumbnail_url = src
                        
        # 4. Fall back to og:image if no body or AMP image found
        if not thumbnail_url:
            thumb_meta = parser.css_first('meta[property="og:image"]')
            thumbnail_url = thumb_meta.attributes.get("content", "").strip() if thumb_meta else ""
        
        # Extract publication time
        pub_meta = parser.css_first('meta[property="article:published_time"]')
        published_at = pub_meta.attributes.get("content", "").strip() if pub_meta else ""
        
        return {
            "source_url": url,
            "title": title,
            "summary": summary,
            "category": category,
            "thumbnail_url": thumbnail_url,
            "published_at": published_at
        }

    def get_latest_articles(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch latest articles from VietnamPlus homepage.
        """
        try:
            response = httpx.get(self.base_url, headers=self.headers, timeout=10.0)
            if response.status_code != 200:
                return []
            
            links = self.extract_links(response.text)
            articles = []
            
            for link in links[:limit]:
                try:
                    art_resp = httpx.get(link, headers=self.headers, timeout=10.0)
                    if art_resp.status_code == 200:
                        article_data = self.parse_article(link, art_resp.text)
                        if article_data["title"]:
                            articles.append(article_data)
                except Exception:
                    # Robust handling of network failures for single pages
                    continue
            return articles
        except Exception:
            return []
