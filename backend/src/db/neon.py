import os
import psycopg2
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

class JSONDBClient:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        self.file_path = os.path.join(base_dir, "vietnews.json")
        self._init_db()

    def _init_db(self):
        if not os.path.exists(self.file_path):
            try:
                with open(self.file_path, "w", encoding="utf-8") as f:
                    json.dump([], f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error initializing JSON DB: {e}")

    def _read(self) -> List[Dict[str, Any]]:
        try:
            if not os.path.exists(self.file_path):
                self._init_db()
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading JSON DB: {e}")
            return []

    def _write(self, data: List[Dict[str, Any]]):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error writing to JSON DB: {e}")

    def upsert_article(self, article: Dict[str, Any]) -> None:
        data = self._read()
        now_str = datetime.now(timezone.utc).isoformat()
        
        found = False
        for item in data:
            if item["source_url"] == article["source_url"]:
                item["title"] = article["title"]
                item["summary"] = article["summary"]
                item["category"] = article["category"]
                item["thumbnail_url"] = article.get("thumbnail_url")
                item["hot_score"] = article.get("hot_score", 0)
                item["published_at"] = article["published_at"]
                item["updated_at"] = now_str
                if "image_width" in article:
                    item["image_width"] = article.get("image_width")
                if "image_height" in article:
                    item["image_height"] = article.get("image_height")
                found = True
                break
                
        if not found:
            new_item = {
                "id": article.get("id") or str(uuid.uuid4()),
                "source_url": article["source_url"],
                "title": article["title"],
                "summary": article["summary"],
                "category": article["category"],
                "thumbnail_url": article.get("thumbnail_url"),
                "rendered_image_url": article.get("rendered_image_url"),
                "image_width": article.get("image_width"),
                "image_height": article.get("image_height"),
                "hot_score": article.get("hot_score", 0),
                "is_rendered": article.get("is_rendered", False),
                "published_at": article["published_at"],
                "created_at": now_str,
                "updated_at": now_str
            }
            data.append(new_item)
            
        self._write(data)

    def get_unrendered_articles(self, limit: int = 20) -> List[Dict[str, Any]]:
        data = self._read()
        filtered = [
            item for item in data 
            if not item.get("is_rendered", False)
        ]
        filtered.sort(key=lambda x: (x.get("hot_score", 0), x.get("created_at", "")), reverse=True)
        return filtered[:limit]

    def get_articles(self, hot: bool = False, category: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        data = self._read()
        filtered = []
        for item in data:
            if hot and item.get("hot_score", 0) < 60:
                continue
            if category and item.get("category") != category:
                continue
            filtered.append(item)
            
        filtered.sort(key=lambda x: (x.get("hot_score", 0), x.get("published_at") or x.get("created_at") or ""), reverse=True)
        return filtered[:limit]

    def get_banner_articles(self) -> List[Dict[str, Any]]:
        data = self._read()
        now = datetime.now(timezone.utc)
        filtered = []
        for item in data:
            if not item.get("is_rendered", False):
                continue
            pub_at_str = item.get("published_at", "")
            try:
                pub_at_clean = pub_at_str.replace("Z", "+00:00")
                pub_at = datetime.fromisoformat(pub_at_clean)
                delta = now - pub_at
                if delta.total_seconds() <= 24 * 3600:
                    filtered.append(item)
            except Exception:
                filtered.append(item)
                
        filtered.sort(key=lambda x: (x.get("hot_score", 0), x.get("created_at", "")), reverse=True)
        return filtered[:5]

    def get_article_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        data = self._read()
        for item in data:
            if item["id"] == id:
                return item
        return None

    def get_article_by_url(self, url: str) -> Optional[Dict[str, Any]]:
        data = self._read()
        for item in data:
            if item["source_url"] == url:
                return item
        return None

    def delete_old_articles(self, days: int = 3) -> int:
        data = self._read()
        now = datetime.now(timezone.utc)
        retained = []
        deleted_count = 0
        for item in data:
            pub_at_str = item.get("published_at", "")
            try:
                pub_at_clean = pub_at_str.replace("Z", "+00:00")
                pub_at = datetime.fromisoformat(pub_at_clean)
                delta = now - pub_at
                if delta.total_seconds() <= days * 24 * 3600:
                    retained.append(item)
                else:
                    deleted_count += 1
            except Exception:
                retained.append(item)
        if deleted_count > 0:
            self._write(retained)
        return deleted_count



class NeonDBClient:
    def __init__(self):
        self.db_url = os.getenv("NEON_DATABASE_URL", "")
        if not self.db_url:
            self.local_client = JSONDBClient()
        else:
            self.local_client = None

    def _get_connection(self):
        url = self.db_url or "postgresql://localhost:5432/postgres"
        return psycopg2.connect(url)

    def upsert_article(self, article: Dict[str, Any]) -> None:
        if self.local_client:
            return self.local_client.upsert_article(article)
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            sql = """
                INSERT INTO articles (source_url, title, summary, category, thumbnail_url, hot_score, published_at, updated_at, image_width, image_height)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s)
                ON CONFLICT (source_url) DO UPDATE SET
                    title = EXCLUDED.title,
                    summary = EXCLUDED.summary,
                    category = EXCLUDED.category,
                    thumbnail_url = EXCLUDED.thumbnail_url,
                    hot_score = EXCLUDED.hot_score,
                    published_at = EXCLUDED.published_at,
                    image_width = COALESCE(EXCLUDED.image_width, articles.image_width),
                    image_height = COALESCE(EXCLUDED.image_height, articles.image_height),
                    updated_at = NOW()
            """
            cursor.execute(sql, (
                article["source_url"],
                article["title"],
                article["summary"],
                article["category"],
                article.get("thumbnail_url"),
                article.get("hot_score", 0),
                article["published_at"],
                article.get("image_width"),
                article.get("image_height")
            ))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_unrendered_articles(self, limit: int = 20) -> List[Dict[str, Any]]:
        if self.local_client:
            return self.local_client.get_unrendered_articles(limit)
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT id, source_url, title, summary, category, thumbnail_url, hot_score, published_at, image_width, image_height
                FROM articles
                WHERE is_rendered = FALSE
                ORDER BY hot_score DESC, created_at DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            rows = cursor.fetchall()
            articles = []
            for row in rows:
                articles.append({
                    "id": str(row[0]),
                    "source_url": row[1],
                    "title": row[2],
                    "summary": row[3],
                    "category": row[4],
                    "thumbnail_url": row[5],
                    "hot_score": row[6],
                    "published_at": row[7].isoformat() if hasattr(row[7], 'isoformat') else str(row[7]),
                    "image_width": row[8],
                    "image_height": row[9]
                })
            return articles
        finally:
            cursor.close()
            conn.close()

    def get_articles(self, hot: bool = False, category: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        if self.local_client:
            return self.local_client.get_articles(hot=hot, category=category, limit=limit)
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            conditions = []
            params = []
            if hot:
                conditions.append("hot_score >= 60")
            if category:
                conditions.append("category = %s")
                params.append(category)
                
            sql = """
                SELECT id, source_url, title, summary, category, thumbnail_url, hot_score, published_at, rendered_image_url, is_rendered, image_width, image_height, updated_at
                FROM articles
            """
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
            sql += " ORDER BY hot_score DESC, published_at DESC, created_at DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()
            articles = []
            for row in rows:
                articles.append({
                    "id": str(row[0]),
                    "source_url": row[1],
                    "title": row[2],
                    "summary": row[3],
                    "category": row[4],
                    "thumbnail_url": row[5],
                    "hot_score": row[6],
                    "published_at": row[7].isoformat() if hasattr(row[7], 'isoformat') else str(row[7]),
                    "rendered_image_url": row[8],
                    "is_rendered": row[9],
                    "image_width": row[10],
                    "image_height": row[11],
                    "updated_at": row[12].isoformat() if row[12] and hasattr(row[12], 'isoformat') else (str(row[12]) if row[12] else None)
                })
            return articles
        finally:
            cursor.close()
            conn.close()

    def get_banner_articles(self) -> List[Dict[str, Any]]:
        if self.local_client:
            return self.local_client.get_banner_articles()
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT id, source_url, title, summary, category, thumbnail_url, hot_score, published_at, rendered_image_url, is_rendered, image_width, image_height, updated_at
                FROM articles
                WHERE is_rendered = TRUE AND published_at >= NOW() - INTERVAL '24 hours'
                ORDER BY hot_score DESC, created_at DESC
                LIMIT 5
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            articles = []
            for row in rows:
                articles.append({
                    "id": str(row[0]),
                    "source_url": row[1],
                    "title": row[2],
                    "summary": row[3],
                    "category": row[4],
                    "thumbnail_url": row[5],
                    "hot_score": row[6],
                    "published_at": row[7].isoformat() if hasattr(row[7], 'isoformat') else str(row[7]),
                    "rendered_image_url": row[8],
                    "is_rendered": row[9],
                    "image_width": row[10],
                    "image_height": row[11],
                    "updated_at": row[12].isoformat() if row[12] and hasattr(row[12], 'isoformat') else (str(row[12]) if row[12] else None)
                })
            return articles
        finally:
            cursor.close()
            conn.close()

    def get_article_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        if self.local_client:
            return self.local_client.get_article_by_id(id)
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT id, source_url, title, summary, category, thumbnail_url, hot_score, published_at, rendered_image_url, is_rendered, image_width, image_height, updated_at
                FROM articles
                WHERE id = %s
            """
            cursor.execute(sql, (id,))
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": str(row[0]),
                "source_url": row[1],
                "title": row[2],
                "summary": row[3],
                "category": row[4],
                "thumbnail_url": row[5],
                "hot_score": row[6],
                "published_at": row[7].isoformat() if hasattr(row[7], 'isoformat') else str(row[7]),
                "rendered_image_url": row[8],
                "is_rendered": row[9],
                "image_width": row[10],
                "image_height": row[11],
                "updated_at": row[12].isoformat() if row[12] and hasattr(row[12], 'isoformat') else (str(row[12]) if row[12] else None)
            }
        finally:
            cursor.close()
            conn.close()

    def get_article_by_url(self, url: str) -> Optional[Dict[str, Any]]:
        if self.local_client:
            return self.local_client.get_article_by_url(url)
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT id, source_url, title, summary, category, thumbnail_url, hot_score, published_at, rendered_image_url, is_rendered, image_width, image_height, updated_at
                FROM articles
                WHERE source_url = %s
            """
            cursor.execute(sql, (url,))
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": str(row[0]),
                "source_url": row[1],
                "title": row[2],
                "summary": row[3],
                "category": row[4],
                "thumbnail_url": row[5],
                "hot_score": row[6],
                "published_at": row[7].isoformat() if hasattr(row[7], 'isoformat') else str(row[7]),
                "rendered_image_url": row[8],
                "is_rendered": row[9],
                "image_width": row[10],
                "image_height": row[11],
                "updated_at": row[12].isoformat() if row[12] and hasattr(row[12], 'isoformat') else (str(row[12]) if row[12] else None)
            }
        finally:
            cursor.close()
            conn.close()

    def delete_old_articles(self, days: int = 3) -> int:
        if self.local_client:
            return self.local_client.delete_old_articles(days)
            
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            threshold = datetime.now(timezone.utc) - timedelta(days=days)
            sql = "DELETE FROM articles WHERE published_at < %s;"
            cursor.execute(sql, (threshold,))
            deleted_count = cursor.rowcount
            conn.commit()
            return deleted_count
        finally:
            cursor.close()
            conn.close()

