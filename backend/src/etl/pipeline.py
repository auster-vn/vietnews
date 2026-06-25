from backend.src.scraper.vietnamplus import VietnamPlusScraper
from backend.src.queue.redis_client import RedisClient
from backend.src.db.neon import NeonDBClient
from backend.src.etl.cleaner import clean_summary
from backend.src.etl.classifier import calculate_hot_score

class ETLPipeline:
    def __init__(self):
        self.scraper = VietnamPlusScraper()
        self.redis_client = RedisClient()
        self.db_client = NeonDBClient()

    def run(self, limit: int = 20) -> int:
        """
        Runs the ETL pipeline:
        1. Crawls VietnamPlus homepage for latest articles.
        2. Filters out duplicates using Redis.
        3. Cleans summary and evaluates hot_score.
        4. Saves articles to PostgreSQL.
        5. Marks URL as seen in Redis.
        Returns the number of newly processed articles.
        """
        articles = self.scraper.get_latest_articles(limit=limit)
        newly_processed = 0
        
        for art in articles:
            url = art["source_url"]
            if self.redis_client.is_duplicate(url):
                continue
                
            # Clean summary content
            art["summary"] = clean_summary(art.get("summary", ""))
            
            # Calculate classification/priority score
            art["hot_score"] = calculate_hot_score(art)
            
            # Persist to Neon Postgres DB
            self.db_client.upsert_article(art)
            
            # Track in Redis seen cache (48 hour TTL)
            self.redis_client.add_url(url)
            
            newly_processed += 1
            
        return newly_processed
