# Wildlife Collision MLOps System

An end-to-end system for predicting wildlife collision risk using wildlife incidents, weather data, and road context, following a structured MLOps pipeline.

---

## Project Overview

This project is designed using a layered data architecture and modular system design:

* Bronze layer for raw data ingestion
* Silver layer for cleaned and structured data
* Gold layer for model-ready datasets (planned)
* Backend for data processing and API services
* Frontend dashboard for visualization and interaction

---

## Project Structure

```text
wildlife-collision-mlops/
│
├── backend/
│   ├── api/
│   │   ├── app.py
│   │   └── model_loader.py
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── data_ingestion/
│   │   ├── data_validation/
│   │   ├── data_processing/
│   │   ├── features/
│   │   ├── training/
│   │   ├── inference/
│   │   └── utils/
│   │
│   ├── run_bronze_ingestion.py
│   ├── run_silver.py
│   └── __init__.py
│
├── dashboard/                  # Frontend (React + Vite + TypeScript)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── containers/
│   │   ├── hooks/
│   │   ├── redux/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── views/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── data/
│   ├── raw/
│   │   └── wildlife_incidents.csv
│   │
│   ├── bronze/
│   │   ├── wildlife_incidents/
│   │   ├── weather/
│   │   └── road_context/
│   │
│   ├── silver/
│   │   ├── wildlife_incidents/
│   │   ├── weather/
│   │   └── road_context/
│   │
│   └── gold/
│
├── logs/
│   ├── bronze_batches/
│   └── silver_batches/
│
├── models/
├── tests/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Data Pipeline

### Bronze Layer

* Raw data ingestion
* Append-only storage
* Adds metadata fields (batch_id, timestamp, etc.)

### Silver Layer

* Data cleaning and validation
* Standardization of formats

### Gold Layer (Planned)

* Feature engineering
* Model-ready datasets

---

## Backend

Responsible for:

* Data ingestion pipelines
* Data processing
* Model inference (future)
* API services using FastAPI

---

## Frontend (Dashboard)

Built using:

* React
* TypeScript
* Vite

Provides:

* Visualization of processed data
* User interaction layer
* Future integration with prediction APIs

---

## How to Run

### Backend

```bash
pip install -r requirements.txt
python backend/run_bronze_ingestion.py
python backend/run_silver.py
uvicorn backend.api.app:app --reload
```

---

### Frontend

```bash
cd dashboard
npm install
npm run dev
```

---

## Future Enhancements

* Real-time data ingestion from APIs
* Machine learning model training
* Risk prediction endpoints
* Dashboard improvements
* Containerization and cloud deployment

---

## Author

Navindu Amerasinghe
Tampere University
