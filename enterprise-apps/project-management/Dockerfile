# Multi-stage Dockerfile for Project Management System
FROM python:3.11-slim as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY */requirements.txt ./modules/
COPY ai-assistant/requirements.txt ./ai-assistant/
COPY sprint-manager/requirements.txt ./sprint-manager/
COPY kanban-board/requirements.txt ./kanban-board/
COPY gantt-chart/requirements.txt ./gantt-chart/
COPY resource-allocator/requirements.txt ./resource-allocator/
COPY project-dashboard/requirements.txt ./project-dashboard/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    streamlit==1.28.0 \
    plotly==5.17.0 \
    pandas==2.1.1 \
    python-dateutil==2.8.2 \
    rich==13.6.0

# Install module-specific dependencies
RUN for req in ./modules/*.txt ./*/requirements.txt; do \
    if [ -f "$req" ]; then pip install --no-cache-dir -r "$req"; fi; \
    done

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs

# Expose ports
EXPOSE 8501 8502 8503 8504 8505

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8501/ || exit 1

# Default command (can be overridden)
CMD ["streamlit", "run", "project-dashboard/src/dashboard.py", "--server.port=8501", "--server.address=0.0.0.0"]
