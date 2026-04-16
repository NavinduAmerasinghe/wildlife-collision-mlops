"""
Road context Bronze-layer ingestion script.
Supports both dynamic (traffic/road weather) and static (road network) data.
Modular and ready for future API/data integration.
"""

import os
import sys
import pandas as pd
from datetime import datetime
import uuid

# --- DYNAMIC ROAD CONTEXT ---
def fetch_dynamic_road_data(params=None):
    """
    Fetch dynamic road/traffic/weather data from external API (placeholder for now).
    Replace this with real API call later.
    """
    print("[INFO] Using mock dynamic road data. Replace fetch_dynamic_road_data() with real API call.")
    data = [
        {
            "observation_time": "2025-10-12T18:00:00+03:00",
            "road_segment_id": "RS-001",
            "traffic_volume": 120,
            "road_surface_condition": "dry",
            "air_temperature": 5.0,
            "visibility_indicator": "good"
        },
        {
            "observation_time": "2025-10-12T19:00:00+03:00",
            "road_segment_id": "RS-001",
            "traffic_volume": 95,
            "road_surface_condition": "wet",
            "air_temperature": 4.5,
            "visibility_indicator": "moderate"
        }
    ]
    return pd.DataFrame(data)

def normalize_dynamic_road_data(df):
    """
    Normalize/validate dynamic road data. For now, just return as-is.
    """
    # TODO: Add normalization/validation if needed
    return df

# --- STATIC ROAD CONTEXT ---
def load_static_road_context(filepath=None):
    """
    Load static road network attributes from a file (placeholder for now).
    Replace this with real file loading logic later.
    """
    print("[INFO] Using mock static road context data. Replace load_static_road_context() with real file loading.")
    data = [
        {
            "road_segment_id": "RS-001",
            "speed_limit": 80,
            "road_width": 7.5,
            "road_type": "main",
            "geometry_reference": "LINESTRING(24.9384 60.1699, 24.9400 60.1705)",
            "municipality": "Helsinki"
        },
        {
            "road_segment_id": "RS-002",
            "speed_limit": 60,
            "road_width": 6.0,
            "road_type": "secondary",
            "geometry_reference": "LINESTRING(23.7610 61.4978, 23.7620 61.4985)",
            "municipality": "Tampere"
        }
    ]
    return pd.DataFrame(data)

def normalize_static_road_context(df):
    """
    Normalize/validate static road context data. For now, just return as-is.
    """
    # TODO: Add normalization/validation if needed
    return df

# --- METADATA & SAVE ---
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

def ingest_road_context(dynamic_output, static_output, dynamic_source="road_dynamic_api", static_source="road_static_file"):
    """
    Orchestrate ingestion for both dynamic and static road context.
    """
    # Dynamic
    dyn_df = fetch_dynamic_road_data()
    if not dyn_df.empty:
        dyn_df = normalize_dynamic_road_data(dyn_df)
        dyn_df = attach_bronze_metadata(dyn_df, dynamic_source)
        save_to_bronze(dyn_df, dynamic_output)
    else:
        print("[WARN] No dynamic road data fetched.")

    # Static
    stat_df = load_static_road_context()
    if not stat_df.empty:
        stat_df = normalize_static_road_context(stat_df)
        stat_df = attach_bronze_metadata(stat_df, static_source)
        save_to_bronze(stat_df, static_output)
    else:
        print("[WARN] No static road context data loaded.")

if __name__ == "__main__":
    dynamic_output = os.path.join("data", "bronze", "road_dynamic_bronze.csv")
    static_output = os.path.join("data", "bronze", "road_static_bronze.csv")
    ingest_road_context(dynamic_output, static_output)
