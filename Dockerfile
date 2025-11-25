# Production Dockerfile for Builder Layer End
# Multi-stage build for optimized image size
#Author: nguyễn Nhật Quang
#Created: 2025-11-24
# Stage 1: Builder
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    git \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements/base.txt requirements/prod.txt ./requirements/

# Install Python dependencies including setuptools for building
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements/prod.txt

# Copy application source to build wheel
COPY src/ ./src/
COPY orchestrator.py setup.py pyproject.toml MANIFEST.in ./

# Build wheel package
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /wheels .

# Stage 2: Runtime
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PATH="/app/.local/bin:$PATH"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN useradd --create-home --shell /bin/bash appuser && \
    mkdir -p /app/data /app/logs /app/assets && \
    chown -R appuser:appuser /app

# Set working directory
WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy wheel from builder
COPY --from=builder /wheels /wheels

# Copy application code
COPY --chown=appuser:appuser src/ ./src/
COPY --chown=appuser:appuser config/ ./config/
COPY --chown=appuser:appuser templates/ ./templates/
COPY --chown=appuser:appuser orchestrator.py setup.py pyproject.toml start_cv_verification_service.py ./

# Copy assets (models)
COPY --chown=appuser:appuser assets/ ./assets/

# Install the pre-built wheel
RUN pip install --no-cache-dir /wheels/*.whl && rm -rf /wheels

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "orchestrator.py"]
