FROM python:3.11-slim

WORKDIR /app/backend

ENV PYTHONPATH=/app/backend

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "run_api.py"]