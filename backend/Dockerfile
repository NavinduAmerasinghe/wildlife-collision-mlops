FROM python:3.11-slim

WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-21-jre \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH=/app/backend
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "run_api.py"]
