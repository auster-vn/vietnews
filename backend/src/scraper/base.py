from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseScraper(ABC):
    @abstractmethod
    def get_latest_articles(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch and parse the latest articles.
        Returns a list of dicts containing article details:
        - source_url (str)
        - title (str)
        - summary (str)
        - category (str)
        - thumbnail_url (str)
        - published_at (str)
        """
        pass
