"""
Silver processing for wildlife incidents.
"""
import pandas as pd
from pathlib import Path
from datetime import datetime
from .silver_utils import find_latest_bronze_csv

def process_wildlife(batch_id):
    """
    Cleans and standardizes wildlife incidents data from Bronze to Silver.
    """
    bronze_folder = Path('data/bronze/wildlife_incidents')
    silver_folder = Path('data/silver/wildlife_incidents')
    silver_folder.mkdir(parents=True, exist_ok=True)
    latest_file = find_latest_bronze_csv(bronze_folder)
    if latest_file is None:
        print("[WARN] No Bronze wildlife incidents file found.")
        return {'status': 'empty', 'row_count': 0, 'file_path': None}
    try:
        df = pd.read_csv(latest_file)
        # Standardize column names
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        # Parse timestamp
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        # Drop duplicates
        df = df.drop_duplicates()
        # Drop rows missing critical fields
        df = df.dropna(subset=['timestamp', 'location'])
        # Save cleaned file
        silver_file = silver_folder / f"wildlife_incidents_silver_{batch_id}.csv"
        df.to_csv(silver_file, index=False)
        print(f"[OK] Wildlife incidents Silver: {len(df)} rows saved to {silver_file}")
        return {'status': 'success', 'row_count': len(df), 'file_path': str(silver_file)}
    except Exception as e:
        print(f"[ERROR] Wildlife incidents Silver processing failed: {e}")
        return {'status': 'error', 'row_count': 0, 'file_path': None}
