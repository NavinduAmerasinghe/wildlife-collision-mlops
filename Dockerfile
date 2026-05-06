FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Keep Python outputs unbuffered
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# Ensure project root is importable
ENV PYTHONPATH=/app

# Install system deps if needed (kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r /app/backend/requirements.txt

# Copy project
COPY . /app

# Expose FastAPI port
EXPOSE 8000

# Default command: run the FastAPI app
CMD ["python", "backend/run_api.py"]
