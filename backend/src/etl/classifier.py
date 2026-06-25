from datetime import datetime, timezone
from typing import Dict, Any

def calculate_hot_score(article: Dict[str, Any]) -> int:
    """
    Calculates the hot_score (0-100) for a given article.
    Scoring rules:
    - Freshness: <= 1h (+40), <= 3h (+30), <= 6h (+20), <= 12h (+10), > 12h (0)
    - Category Weight: chinh-tri (+25), kinh-te (+20), the-gioi (+20), xa-hoi (+15), other (+5)
    - Keyword Boost: title contains ["khẩn", "ngay", "nóng", "chính thức", "đột phá"] (+15)
    """
    published_at_raw = article.get("published_at")
    
    # Parse published_at timestamp
    pub_dt = None
    if isinstance(published_at_raw, str):
        try:
            pub_dt = datetime.fromisoformat(published_at_raw)
        except Exception:
            pass
    elif isinstance(published_at_raw, datetime):
        pub_dt = published_at_raw
        
    freshness_points = 0
    if pub_dt:
        # Resolve aware/naive timezone differences
        if pub_dt.tzinfo is not None:
            now = datetime.now(pub_dt.tzinfo)
        else:
            now = datetime.now()
            
        diff = now - pub_dt
        diff_hours = diff.total_seconds() / 3600.0
        
        # We handle negative diffs (e.g. slight clock desync) as <= 1h
        if diff_hours <= 1.0:
            freshness_points = 40
        elif diff_hours <= 3.0:
            freshness_points = 30
        elif diff_hours <= 6.0:
            freshness_points = 20
        elif diff_hours <= 12.0:
            freshness_points = 10
        else:
            freshness_points = 0
            
    # Category weighting
    category = article.get("category", "other")
    category_weights = {
        "chinh-tri": 25,
        "kinh-te": 20,
        "the-gioi": 20,
        "xa-hoi": 15,
        "other": 5
    }
    category_points = category_weights.get(category, 5)
    
    # Keyword boosting
    title = article.get("title", "") or ""
    keywords = ["khẩn", "ngay", "nóng", "chính thức", "đột phá"]
    title_lower = title.lower()
    
    keyword_boost = 0
    if any(kw in title_lower for kw in keywords):
        keyword_boost = 15
        
    total_score = freshness_points + category_points + keyword_boost
    
    # Clamp total score between 0 and 100
    return max(0, min(100, total_score))
