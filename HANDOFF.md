# VietNews — Project Handoff Documentation

> **Project Tagline:** "Mỗi tin hot, một tấm ảnh — tự động, đẹp, không quảng cáo."
> **Current Status:** 100% Implemented & Verified.

---

## 1. Project Overview & Directory Structure

VietNews is an end-to-end serverless automation system that crawls news from VietnamPlus, computes priority scoring using rule-based ETL/NLP, renders hot news articles into high-quality graphic images using Satori, and serves them via a Next.js 14 frontend.

```
vietnews/
├── CLAUDE.md                   ← Build and test command reference
├── CONTEXT.md                  ← Domain terminology definitions
├── HANDOFF.md                  ← This documentation file
├── .github/
│   └── workflows/
│       └── ci.yml              ← GitHub Actions CI pipeline
├── backend/
│   ├── pyproject.toml          ← Python project configuration
│   ├── src/
│   │   ├── api/
│   │   │   ├── main.py         ← FastAPI router & endpoints
│   │   │   └── scheduler.py    ← APScheduler crawler/renderer cron loop
│   │   ├── db/
│   │   │   ├── migrations.py   ← PostgreSQL tables initializer
│   │   │   └── neon.py         ← psycopg2 Neon DB queries client
│   │   ├── etl/
│   │   │   ├── cleaner.py      ← Summary HTML sanitizer & text length clipper
│   │   │   ├── classifier.py   ← Article priority hot_score evaluation rules
│   │   │   └── pipeline.py     ← ETL orchestrator
│   │   ├── queue/
│   │   │   └── redis_client.py ← seen_urls deduplication client wrapper
│   │   └── scraper/
│   │       ├── base.py         ← Scraper abstract base class
│   │       └── vietnamplus.py  ← selectolax DOM parser crawler
│   └── tests/
│       ├── test_api.py         ← FastAPI endpoints mock tests
│       ├── test_db.py          ← PostgreSQL query mock tests
│       ├── test_etl.py         ← Cleaner, classifier, & pipeline tests
│       ├── test_redis.py       ← Deduplication cache mock tests
│       └── test_scraper.py     ← vietnamplus parser HTML mock tests
├── renderer/
│   ├── package.json            ← Node dependencies & Vitest setup
│   ├── tsconfig.json           ← TypeScript React compiler configurations
│   ├── fonts/
│   │   ├── Inter-Regular.ttf   ← TrueType latin-vietnamese fonts
│   │   └── Inter-Bold.ttf
│   ├── src/
│   │   ├── template.tsx        ← Editorial dark theme JSX component
│   │   ├── satori_render.ts    ← Satori & resvg PNG graphic generator
│   │   ├── cloudinary_uploader.ts ← Cloudinary CDN wrapper & batch DB updater
│   │   └── run.ts              ← Standalone renderer CLI execution script
│   └── tests/
│       └── render.test.ts      ← Vitest rendering pipeline tests
├── frontend/
│   ├── package.json            ← Next.js 14 dependencies & Vitest setup
│   ├── tsconfig.json           ← Next.js TypeScript config
│   ├── tailwind.config.ts      ← Tailwind theme configs
│   ├── vitest.config.ts        ← Vitest JSDOM environment config
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      ← Root layout loaded with Inter font
│   │   │   ├── page.tsx        ← ISR-backed parallel server-fetching index page
│   │   │   └── globals.css     ← Tailwind CSS utilities
│   │   └── components/
│   │       ├── Banner.tsx      ← Asymmetric featured article component (60% width)
│   │       ├── NewsFeed.tsx    ← 3-column responsive grid showing rendered PNGs
│   │       └── __tests__/
│   │           └── components.test.tsx ← Banner & NewsFeed Vitest tests
└── scripts/
    └── smoke_test.sh           ← cURL health check and JSON payload validator
```

---

## 2. Technical Stack & Deployment Configuration

### Credentials & Environment Variables
The application requires the following variables configured on their respective host providers:

#### Koyeb.com (FastAPI App & Background Scheduler Worker)
- `NEON_DATABASE_URL`: Connection string for Neon serverless PostgreSQL.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Credentials for Redis Cloud seen URL deduplication.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Credentials for storing PNG files.
- `INTERNAL_CRON_SECRET`: Secret header token to protect internal crawl endpoints.

#### Netlify (Next.js 14 App)
- `NEXT_PUBLIC_API_URL`: Points to the deployed Koyeb FastAPI server (e.g. `https://[your-app].koyeb.app`).

### Execution Mechanics
1. **Scraping Loop:** Run automatically every 30 minutes in Python using APScheduler.
2. **Subprocess Rendering:** Once scraping finishes, the scheduler invokes the compiled Node rendering worker script:
   ```bash
   node renderer/dist/run.js
   ```
   This fetches unrendered hot articles, compiles JSX templates to PNG, uploads them to Cloudinary, and marks them as rendered in the DB.

---

## 3. Core Developer Commands

### Running Backend Tests
Execute within `backend/`:
```bash
PYTHONPATH=.. uv run pytest tests/ -v
```

### Running Image Renderer Tests
Execute within `renderer/`:
```bash
npm run test
```

### Running Frontend Tests
Execute within `frontend/`:
```bash
npm run test
```

### Running Database Migrations
Deploy new schema tables to Postgres:
```bash
python -m backend.src.db.migrations
```

### Running Production Smoke Tests
Verify live deployment reachability:
```bash
bash scripts/smoke_test.sh [API_URL] [FRONTEND_URL]
```

---

## 4. Crawl on Demand Feature (Active News Fetching)
Users can actively submit article URLs from VietnamPlus via the frontend search form:
1. **Frontend (`CrawlForm.tsx`):** A glassmorphic form component on the home page captures the user input URL, validates that it matches the VietnamPlus domain, issues a `POST /api/articles/crawl-now` request to the backend, and handles the loading and success states.
2. **Backend (`POST /api/articles/crawl-now`):** FastAPI scrapes the page content using HTTPX/selectolax, processes details through the ETL cleaner and classifier, persists details in Neon PostgreSQL, and synchronously calls the renderer subprocess:
   ```bash
   node renderer/dist/run.js --id [article_uuid]
   ```
3. **Renderer:** The TypeScript rendering script parses `--id`, queries Postgres for the single article row, outputs the beautiful editorial graphic image through Satori/resvg, and uploads to Cloudinary.
4. **Immediate Preview:** The Next.js frontend displays the completed graphic card preview instantly to the user on completion.

---

## 5. Global Crawl & Render On-Demand Feature
Users can refresh and crawl the latest hot news available on the VietnamPlus homepage via the top header refresh button:
1. **Frontend (`MainFeed.tsx`):** Renders the navigation header, the glowing "Cập nhật tin mới" refresh button, the glassmorphic status logger overlay, and manages the client-side feed state.
2. **Backend (`POST /api/articles/crawl-hot-now`):** FastAPI executes `ETLPipeline().run(limit=20)` to scrape the latest articles from VietnamPlus homepage, processes and classifies them, runs the Node batch renderer subprocess to render any newly found hot articles, and returns the updated article feed list.
3. **Immediate Update:** The frontend `MainFeed` component prepends and renders the fresh hot articles instantly without requiring a page reload.

---

## 6. Local Fallback Mode (Offline Dev Setup)

If no cloud credentials (`NEON_DATABASE_URL`, `REDIS_HOST`, `CLOUDINARY_CLOUD_NAME`) are supplied:
1. **JSON DB client fallback:** The system saves parsed articles directly to a shared `vietnews.json` database.
2. **Local Image rendering fallback:** PNG files are generated and stored inside `frontend/public/uploads/` instead of Cloudinary.
3. **Vietnamese Glyph Support & Simplification:** Standard 68KB subsets of Inter were replaced by full TTF versions (~320KB) downloaded from Google Fonts, resolving all text rendering bugs. Additionally, the summary/description text block has been completely removed from the graphic card template to simplify card layouts and enhance readability for small cards in the grid.
4. **Local Verification:**
   - Execute crawl: `curl -X POST http://localhost:8000/api/articles/crawl-hot-now`
   - Execute crawl single: `curl -X POST -H "Content-Type: application/json" -d '{"url": "https://www.vietnamplus.vn/[slug].vnp"}' http://localhost:8000/api/articles/crawl-now`
   - Outputs will be saved as static files locally and served dynamically by the Next.js app.

