import os
import psycopg2
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def run_migrations():
    db_url = os.getenv("NEON_DATABASE_URL", "")
    if not db_url:
        print("Notice: NEON_DATABASE_URL is not set. Skipping Postgres migrations since local JSON DB is active.")
        return
        
    print("Running database migrations...")
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Create table using postgres native gen_random_uuid() for primary key
        create_table_query = """
        CREATE TABLE IF NOT EXISTS articles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_url VARCHAR(512) UNIQUE NOT NULL,
            title VARCHAR(256) NOT NULL,
            summary VARCHAR(500),
            category VARCHAR(50), -- 'chinh-tri', 'kinh-te', 'the-gioi', 'xa-hoi', 'the-thao', 'khoa-hoc', 'van-hoa', 'other'
            thumbnail_url VARCHAR(512),
            rendered_image_url VARCHAR(512),
            image_width INTEGER,
            image_height INTEGER,
            hot_score INTEGER DEFAULT 0,
            is_rendered BOOLEAN DEFAULT FALSE,
            published_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """
        cursor.execute(create_table_query)
        
        # Add columns for existing tables
        cursor.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_width INTEGER;")
        cursor.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_height INTEGER;")
        
        # Create indexes to speed up sorting by score and age
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_hot_score ON articles(hot_score DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);")
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Database migrations applied successfully.")
    except Exception as e:
        print(f"Error executing migrations: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
