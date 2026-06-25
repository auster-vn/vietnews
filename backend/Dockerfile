FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source files into /app/backend
COPY . /app/backend/

# Set Python Path to /app so backend can be imported as a module
ENV PYTHONPATH=/app

EXPOSE 8000

# Run DB migrations on container startup, then start the FastAPI application
CMD python -m backend.src.db.migrations && uvicorn backend.src.api.main:app --host 0.0.0.0 --port 8000
