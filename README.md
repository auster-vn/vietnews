# VietNews 📰
> **An Automated Real-Time Hot News Aggregator & Infographics Generation Pipeline.**

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vietnews-seven.vercel.app/)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Node Version](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker Support](https://img.shields.io/badge/Docker-Supported-blue?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Live Demo**: [https://vietnews-seven.vercel.app/](https://vietnews-seven.vercel.app/)

---

## 📖 Introduction
**VietNews** is a full-stack, automated data engineering and visualization pipeline that scrapes major news streams (like VietnamPlus), filters and ranks stories using an algorithmic **Hot Score**, dynamically renders custom vector news infographics using **Node.js Satori**, and hosts a premium real-time operations dashboard for cross-device viewing.

### 🌟 Key Features
- **High-Performance Crawler & ETL:** Uses Python's `Selectolax` parser to scrape articles efficiently, utilizing Redis Cloud cache to prevent duplicate content ingestion.
- **Hot Score Engine:** Ranks articles algorithmically from `0` to `100` based on category urgency, temporal decay, and headline density.
- **Dynamic Infographics Renderer:** Uses React templates compiled by Node.js/TypeScript `Satori` to produce high-resolution, lightweight SVG-to-PNG visual assets.
- **Cloud Storage Sync:** Seamlessly uploads rendered news cards to `Cloudinary CDN`.
- **Hybrid Preview Architecture:** Supports high-fidelity live CSS rendering of the cards on the client-side for optimization alongside static PNG fallback options.
- **Premium Multi-Device UI:**
  - **Desktop**: Real-time split-screen Operations Dashboard with metrics overview, automatic autoplay scanner, zoomable lightbox modal, and rapid filter/search drawers.
  - **Mobile**: Intuitive Tinder-style swipe interface for quick news scanning.

---

## 📐 System Architecture

The following diagram illustrates how data flows from the scraper, through the database layers and the image renderer, to the user's dashboard.

```mermaid
graph TD
    %% Scraper & Pipeline%%
    VP[VietnamPlus.vn] -->|Scrape HTML| ETL[Python ETL Scraper]
    Redis[(Redis Cloud Cache)] <-->|Check Duplicates| ETL
    ETL -->|Calculate Hot Score| DB[(Neon PostgreSQL)]
    
    %% Renderer %%
    DB -->|Fetch Unrendered Articles| Render[Node.js Satori Renderer]
    Render -->|Render JSX to PNG| Cloudinary[Cloudinary CDN]
    Cloudinary -->|Save Image URL| DB
    
    %% API & Clients %%
    DB -->|Data Endpoint| API[FastAPI Gateway]
    API -->|Fetch JSON Feed| Next[Next.js Client]
    
    classDef main fill:#3b82f6,stroke:#1d4ed8,color:#fff;
    classDef storage fill:#10b981,stroke:#047857,color:#fff;
    classDef client fill:#8b5cf6,stroke:#6d28d9,color:#fff;
    
    class ETL,Render main;
    class DB,Redis,Cloudinary storage;
    class Next client;
```

---

## 🛠️ Technology Stack

- **Frontend:** Next.js (TypeScript, TailwindCSS, Framer Motion)
- **Backend:** FastAPI (Python, Uvicorn, APScheduler)
- **Renderer Engine:** Node.js (TypeScript, Satori, Resvg)
- **Databases:** Neon PostgreSQL, Redis Cloud
- **Media Delivery:** Cloudinary CDN

---

## 🚀 Getting Started

Follow these steps to run a copy of the project locally or deploy it to production.

### Prerequisites
Make sure you have installed:
- **Python** $\ge 3.12$ (using `uv` package manager is highly recommended)
- **Node.js** $\ge 18$ & npm
- A PostgreSQL database (Neon Postgres free instance recommended)
- A Redis instance (Redis Cloud free instance recommended)
- A Cloudinary account (Free tier)

---

### Installation & Local Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/auster-vn/vietnews.git
   cd vietnews
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root folder of the project:
   ```env
   # Neon Postgres DB
   NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   
   # Redis Cache
   REDIS_HOST=your-redis-host.db.redis.io
   REDIS_PORT=16444
   REDIS_PASSWORD=your-redis-password

   # Cloudinary Media Storage
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # API Gateways & Credentials
   NEXT_PUBLIC_API_URL=http://localhost:8000
   INTERNAL_CRON_SECRET=your-secure-cron-secret
   ```

3. **Install Dependencies & Build Components:**
   * **Backend & Scraper:**
     ```bash
     cd backend
     uv pip install -r requirements.txt
     ```
   * **Renderer Engine:**
     ```bash
     cd ../renderer
     npm install
     npm run build
     ```
   * **Frontend Application:**
     ```bash
     cd ../frontend
     npm install
     ```

4. **Initialize Database Tables:**
   Run migrations to create the necessary tables in your Postgres database:
   ```bash
   cd ../backend
   PYTHONPATH=.. uv run python src/db/migrations.py
   ```

5. **Run Locally:**
   * **Start Backend Server:**
     ```bash
     cd ../backend
     PYTHONPATH=. uv run uvicorn src.api.main:app --port 8000 --reload
     ```
   * **Start Frontend Server:**
     ```bash
     cd ../frontend
     npm run dev
     ```

---

## ☁️ Deployment Guide

VietNews is designed to run completely on **Free Tiers** without exceeding limits:

### 1. Backend & Satori Renderer (Render.com)
Deploy both components in a single container using our unified root [Dockerfile](file:///home/cp/Documents/Feed/vietnews/Dockerfile):
- Create a new **Web Service** on Render and select **Docker** runtime.
- Connect your GitHub Repository.
- In **Environment Variables**, paste all credentials from the `.env` file.
- Spin up on the **Free Instance** (costs $0/month).

### 2. Frontend Next.js Dashboard (Vercel)
- Create a new project on Vercel and import your repository.
- Edit the **Root Directory** settings to point to **`frontend`**.
- Add the environment variable:
  - `NEXT_PUBLIC_API_URL` = URL of your Render backend.
- Deploy.

### 3. Setup Automation Trigger (cron-job.org)
To prevent the Render free tier from sleeping and trigger data crawls every 6 hours:
- Register on [cron-job.org](https://cron-job.org/) and create a new cronjob.
- Set the target URL to: `https://your-render-backend-url.onrender.com/internal/crawl`
- Set execution schedule to: **Every 6 hours** (`0 */6 * * *`).
- In **Advanced Settings**, set **Request Method** to `POST`.
- Add a Header:
  - **Key**: `X-Cron-Token`
  - **Value**: Value of your `INTERNAL_CRON_SECRET`.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for details.
