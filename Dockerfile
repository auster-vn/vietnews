FROM python:3.12-slim

# Install system dependencies (build-essential, postgres client, curl, nodejs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy renderer package configs and install node modules
COPY renderer/package*.json ./renderer/
RUN cd renderer && npm ci

# 2. Copy renderer source files and compile TypeScript
COPY renderer/ ./renderer/
RUN cd renderer && npm run build

# 3. Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# 4. Copy backend source files
COPY backend/ ./backend/

# Set Python Path so backend modules can be imported
ENV PYTHONPATH=/app

EXPOSE 8000

# Run Neon database migrations on container startup, then start FastAPI app via Uvicorn
CMD python -m backend.src.db.migrations && uvicorn backend.src.api.main:app --host 0.0.0.0 --port 8000
