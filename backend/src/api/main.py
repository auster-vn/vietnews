from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
import subprocess
import httpx
from pydantic import BaseModel
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from backend.src.db.neon import NeonDBClient
from backend.src.api.scheduler import start_scheduler, shutdown_scheduler, run_crawl_and_render
from backend.src.scraper.vietnamplus import VietnamPlusScraper
from backend.src.etl.cleaner import clean_summary
from backend.src.etl.classifier import calculate_hot_score
from backend.src.etl.pipeline import ETLPipeline

db_client = NeonDBClient()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize background scheduler on startup
    start_scheduler()
    yield
    # Shutdown background scheduler on termination
    shutdown_scheduler()

app = FastAPI(
    title="VietNews API",
    description="Automated news parser and image rendering service API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for all origins to allow Next.js app to fetch resources
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/articles")
async def get_articles(hot: bool = False, category: str = None, limit: int = 20):
    """
    Fetch crawled articles with optional filters.
    """
    try:
        articles = db_client.get_articles(hot=hot, category=category, limit=limit)
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/banner")
async def get_banner():
    """
    Fetch the top 5 highest hot_score articles rendered in the last 24h.
    """
    try:
        articles = db_client.get_banner_articles()
        return articles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/internal/crawl")
async def trigger_crawl(background_tasks: BackgroundTasks, x_cron_token: str = Header(None, alias="X-Cron-Token")):
    """
    Trigger the Scraper + ETL + Renderer loop immediately in the background.
    Protected by the X-Cron-Token header.
    """
    cron_secret = os.getenv("INTERNAL_CRON_SECRET", "")
    
    if not cron_secret or x_cron_token != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    background_tasks.add_task(run_crawl_and_render)
    return {"status": "crawling"}

class CrawlRequest(BaseModel):
    url: str

@app.post("/api/articles/crawl-now")
async def crawl_now(request: CrawlRequest):
    """
    Actively crawls a specific VietnamPlus article URL, runs the ETL pipeline, 
    triggers synchronous rendering, and returns the updated article JSON.
    """
    url = request.url.strip()
    
    # 1. Validate VietnamPlus URL domain
    if not any(url.startswith(prefix) for prefix in [
        "https://www.vietnamplus.vn",
        "http://www.vietnamplus.vn",
        "https://vietnamplus.vn",
        "http://vietnamplus.vn"
    ]):
        raise HTTPException(status_code=400, detail="Invalid URL. Only VietnamPlus article URLs are supported.")
        
    try:
        # Check if URL was already processed and has a completed graphic render
        existing = db_client.get_article_by_url(url)
        if existing and existing["is_rendered"]:
            return existing
            
        # 2. Download article page content
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = httpx.get(url, headers=headers, timeout=10.0)
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Article page not found or unreachable.")
            
        # 3. Parse elements using VietnamPlusScraper
        scraper = VietnamPlusScraper()
        article_data = scraper.parse_article(url, response.text)
        if not article_data["title"]:
            raise HTTPException(status_code=422, detail="Failed to parse article details from webpage.")
            
        # 4. Clean summary and calculate score
        article_data["summary"] = clean_summary(article_data.get("summary", ""))
        article_data["hot_score"] = calculate_hot_score(article_data)
        
        # 5. Insert article metadata into Neon database
        db_client.upsert_article(article_data)
        
        # Retrieve the updated row containing the UUID
        article = db_client.get_article_by_url(url)
        if not article:
            raise HTTPException(status_code=500, detail="Failed to save article to database.")
            
        article_id = article["id"]
        
        # 6. Execute TS renderer subprocess for this specific UUID synchronously
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        run_js_path = os.path.join(base_dir, "renderer", "dist", "run.js")
        
        if os.path.exists(run_js_path):
            result = subprocess.run(
                ["node", run_js_path, "--id", article_id],
                cwd=base_dir,
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print(f"Error rendering single article {article_id}: {result.stderr}")
        else:
            print(f"Renderer run script not found at: {run_js_path}")
            
        # 7. Fetch the final updated article
        updated_article = db_client.get_article_by_url(url)
        if not updated_article:
            raise HTTPException(status_code=500, detail="Failed to retrieve rendered article details.")
            
        return updated_article
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/articles/crawl-hot-now")
async def crawl_hot_now():
    """
    Triggers an immediate scan of VietnamPlus homepage, runs ETL/NLP classification,
    executes TS renderer for newly found hot articles, and returns the updated article feed.
    """
    try:
        # 1. Run the ETL pipeline to pull the latest 20 articles from the homepage
        pipeline = ETLPipeline()
        pipeline.run(limit=20)
        
        # 2. Trigger TS rendering subprocess for any unrendered hot articles
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        run_js_path = os.path.join(base_dir, "renderer", "dist", "run.js")
        
        if os.path.exists(run_js_path):
            result = subprocess.run(
                ["node", run_js_path],
                cwd=base_dir,
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                print(f"Error executing batch rendering: {result.stderr}")
        else:
            print(f"Renderer run script not found at: {run_js_path}")
            
        # 3. Retrieve the updated list of articles to update the feed immediately
        articles = db_client.get_articles(hot=False, category=None, limit=50)
        return articles
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
