"""
Wildlife incident Bronze-layer ingestion script.
Reads a raw CSV, validates columns, adds metadata, and writes to Bronze CSV.
Runnable from the command line.
"""

import os
import sys
import pandas as pd
from datetime import datetime
import uuid

REQUIRED_COLUMNS = [
    "incident_id",
    "timestamp",
    "latitude",
    "longitude",
    "species",
    "severity",
    "municipality",
    "source"
]

def ingest_wildlife_csv(input_path: str, output_path: str, source_name: str = "wildlife_incidents"):
    """
    Reads wildlife incident data from a CSV file, validates columns, adds Bronze metadata, and writes to Bronze CSV.
    """
    print(f"[INFO] Loading data from: {input_path}")
    if not os.path.exists(input_path):
        print(f"[ERROR] Input file not found: {input_path}")
        sys.exit(1)

    df = pd.read_csv(input_path)
    print(f"[INFO] Loaded {len(df)} rows.")

    # Validate required columns
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        print(f"[ERROR] Missing required columns: {missing}")
        sys.exit(1)

    # Add Bronze metadata columns
    batch_id = str(uuid.uuid4())
    ingestion_timestamp = datetime.utcnow().isoformat()
    df["source_name"] = source_name
    df["ingestion_timestamp"] = ingestion_timestamp
    df["batch_id"] = batch_id
    df["record_id"] = [str(uuid.uuid4()) for _ in range(len(df))]

    # Write to Bronze CSV (overwrite or create new)
    df.to_csv(output_path, index=False)
    print(f"[INFO] Written {len(df)} rows to: {output_path}")

if __name__ == "__main__":
    # Default paths
    input_path = os.path.join("data", "raw", "wildlife_incidents.csv")
    output_path = os.path.join("data", "bronze", "wildlife_incidents_bronze.csv")
    ingest_wildlife_csv(input_path, output_path)
