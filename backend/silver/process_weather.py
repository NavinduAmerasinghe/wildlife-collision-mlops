"""
Silver processing for weather data.
"""
import pandas as pd
from pathlib import Path
from datetime import datetime
from .silver_utils import find_latest_bronze_csv

def process_weather(batch_id, project_root):
    """
    Cleans and standardizes weather data from Bronze to Silver.
    """
    project_root = Path(project_root)
    bronze_folder = project_root / "data" / "bronze" / "weather_data"
    silver_folder = project_root / "data" / "silver" / "weather_data"
    silver_folder.mkdir(parents=True, exist_ok=True)
    latest_file = find_latest_bronze_csv(bronze_folder)
    if latest_file is None:
        print(f"[WARN] No Bronze weather file found in {bronze_folder}")
        return {'status': 'empty', 'row_count': 0, 'file_path': None}
    print(f"[INFO] Reading Bronze file: {latest_file}")
    try:
        df = pd.read_csv(latest_file)
        # Standardize column names
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        # Parse timestamp
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        # Drop duplicates
        df = df.drop_duplicates()
        # Handle basic missing values (drop rows missing timestamp or location)
        subset_cols = [col for col in ['timestamp', 'location'] if col in df.columns]
        if subset_cols:
            df = df.dropna(subset=subset_cols)
        # Save cleaned file
        silver_file = silver_folder / f"weather_silver_{batch_id}.csv"
        df.to_csv(silver_file, index=False)
        print(f"[OK] Weather Silver: {len(df)} rows saved to {silver_file}")
        print(f"[INFO] Silver file location: {silver_file.resolve()}")
        return {'status': 'success', 'row_count': len(df), 'file_path': str(silver_file)}
    except Exception as e:
        print(f"[ERROR] Weather Silver processing failed: {e}")
        return {'status': 'error', 'row_count': 0, 'file_path': None}
