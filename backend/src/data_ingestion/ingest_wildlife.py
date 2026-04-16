"""
Ingest wildlife incident data from local CSV into the Bronze layer.
Preserves original columns and adds metadata.
"""
import os
import pandas as pd
from datetime import datetime
import uuid

def ingest_wildlife_csv(input_path: str, output_path: str, source_name: str = "wildlife_incidents"):
    """
    Reads wildlife incident data from a CSV file, adds Bronze metadata, and appends to Bronze CSV.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    df = pd.read_csv(input_path)
    batch_id = str(uuid.uuid4())
    ingestion_timestamp = datetime.utcnow().isoformat()
    df['source_name'] = source_name
    df['ingestion_timestamp'] = ingestion_timestamp
    df['batch_id'] = batch_id
    df['record_id'] = [str(uuid.uuid4()) for _ in range(len(df))]

    # Append to Bronze CSV (create if not exists)
    if os.path.exists(output_path):
        df.to_csv(output_path, mode='a', header=False, index=False)
    else:
        df.to_csv(output_path, index=False)

# Example usage (to be called from run_bronze_ingestion.py)
# ingest_wildlife_csv('data/raw/wildlife_incidents.csv', 'data/bronze/wildlife_bronze.csv')
