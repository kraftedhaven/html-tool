# FastAPI Gateway Microservice Dockerfile
# Optimized for Google Cloud Run deployment

# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies (if needed)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY gateway.py .

# Create non-root user for security best practices
# CLOUD SCALING NOTE: Cloud Run runs as non-root by default, but this ensures consistency
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Cloud Run will inject PORT environment variable)
# Default to 8080 for local testing
ENV PORT=8080
EXPOSE 8080

# Health check (optional, Cloud Run has its own health checks)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# Run the application
# CLOUD SCALING NOTE: 
# - Use multiple workers for better concurrency (Cloud Run recommendation: 1-2 workers per vCPU)
# - Adjust based on your workload (CPU vs I/O bound)
# - Cloud Run typically has 1-2 vCPUs per instance
CMD ["sh", "-c", "uvicorn gateway:app --host 0.0.0.0 --port ${PORT} --workers 2 --log-level info"]

# Alternative single-worker command for lower memory usage:
# CMD ["sh", "-c", "uvicorn gateway:app --host 0.0.0.0 --port ${PORT} --log-level info"]
