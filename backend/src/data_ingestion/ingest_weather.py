"""
Weather Bronze-layer ingestion script.
Modular, production-friendly, with placeholder for real FMI API integration.
"""

import os
import sys
import pandas as pd
from datetime import datetime
import uuid

def build_weather_request(start_time=None, end_time=None, latitude=None, longitude=None, station_id=None):
    """
    Build parameters for a weather data request.
    Returns a dict of parameters.
    """
    return {
        "start_time": start_time,
        "end_time": end_time,
        "latitude": latitude,
        "longitude": longitude,
        "station_id": station_id
    }

def fetch_weather_data(params):
    """
    Fetch weather data from FMI API (placeholder for now).
    Replace this function with a real API call later.
    """
    # --- PLACEHOLDER: Replace with real FMI API call ---
    print("[INFO] Using mock weather data. Replace fetch_weather_data() with real FMI API call.")
    data = [
        {
            "timestamp": "2025-10-12T18:00:00+03:00",
            "latitude": 60.1699,
            "longitude": 24.9384,
            "station_id": "Helsinki-001",
            "temperature_C": 5.2,
            "precipitation_mm": 0.0,
            "wind_speed_mps": 3.1,
            "weather_symbol": "clear"
        },
        {
            "timestamp": "2025-10-12T19:00:00+03:00",
            "latitude": 60.1699,
            "longitude": 24.9384,
            "station_id": "Helsinki-001",
            "temperature_C": 4.8,
            "precipitation_mm": 0.2,
            "wind_speed_mps": 2.7,
            "weather_symbol": "rain"
        }
    ]
    return pd.DataFrame(data)

def normalize_weather_response(df):
    """
    Normalize and validate weather DataFrame.
    For now, just return as-is. Add normalization logic here if needed.
    """
    # TODO: Add normalization/validation if needed
    return df

def attach_bronze_metadata(df, source_name):
    """
    Attach Bronze metadata columns to DataFrame.
    """
    batch_id = str(uuid.uuid4())
    ingestion_timestamp = datetime.utcnow().isoformat()
    df["source_name"] = source_name
    df["ingestion_timestamp"] = ingestion_timestamp
    df["batch_id"] = batch_id
    df["record_id"] = [str(uuid.uuid4()) for _ in range(len(df))]
    return df

def save_to_bronze(df, output_path):
    """
    Save DataFrame to Bronze CSV (overwrite or create new).
    """
    df.to_csv(output_path, index=False)
    print(f"[INFO] Written {len(df)} rows to: {output_path}")

def ingest_weather(output_path, source_name="weather_fmi"):
    """
    Orchestrate weather ingestion: build request, fetch, normalize, add metadata, save.
    """
    params = build_weather_request()
    df = fetch_weather_data(params)
    if df.empty:
        print("[WARN] No weather data fetched.")
        return
    df = normalize_weather_response(df)
    df = attach_bronze_metadata(df, source_name)
    save_to_bronze(df, output_path)

if __name__ == "__main__":
    output_path = os.path.join("data", "bronze", "weather_bronze.csv")
    ingest_weather(output_path)
