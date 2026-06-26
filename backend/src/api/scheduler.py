from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
import os
import logging
from backend.src.etl.pipeline import ETLPipeline
from backend.src.db.neon import NeonDBClient

logger = logging.getLogger("scheduler")
scheduler = BackgroundScheduler()

def run_crawl_and_render():
    logger.info("Starting scheduled crawl and render job...")
    try:
        # 1. Clean database by deleting articles older than 3 days
        db_client = NeonDBClient()
        deleted_count = db_client.delete_old_articles(days=3)
        logger.info(f"Cleaned up {deleted_count} articles older than 3 days from database.")

        # 2. Crawl and parse articles
        pipeline = ETLPipeline()
        new_count = pipeline.run(limit=20)
        logger.info(f"Pipeline finished. Processed {new_count} new articles.")
        
        # 2. Trigger Satori Node.js rendering process
        # Absolute path calculation relative to this file:
        # scheduler.py is in backend/src/api/scheduler.py
        # project root is 4 directories up
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        run_js_path = os.path.join(base_dir, "renderer", "dist", "run.js")
        
        if os.path.exists(run_js_path):
            result = subprocess.run(["node", run_js_path], cwd=base_dir, capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"Rendering worker succeeded: {result.stdout.strip()}")
            else:
                logger.error(f"Rendering worker failed: {result.stderr.strip()}")
        else:
            logger.error(f"Renderer executable not found at {run_js_path}")
    except Exception as e:
        logger.exception(f"Error in scheduled crawl and render job: {e}")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(run_crawl_and_render, 'interval', hours=6, id='crawl_job')
        scheduler.start()
        logger.info("Background scheduler started successfully.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler shut down successfully.")
