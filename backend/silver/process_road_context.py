"""
Silver processing for road context data.
"""
import pandas as pd
from pathlib import Path
from .silver_utils import find_latest_bronze_csv

def process_road_context(batch_id):
    """
    Cleans and standardizes road context data from Bronze to Silver.
    """
    bronze_folder = Path('data/bronze/road_context')
    silver_folder = Path('data/silver/road_context')
    silver_folder.mkdir(parents=True, exist_ok=True)
    latest_file = find_latest_bronze_csv(bronze_folder)
    if latest_file is None:
        print("[WARN] No Bronze road context file found.")
        return {'status': 'empty', 'row_count': 0, 'file_path': None}
    try:
        df = pd.read_csv(latest_file)
        # Standardize column names
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        # Drop duplicates
        df = df.drop_duplicates()
        # Drop rows missing road_segment_id if present
        if 'road_segment_id' in df.columns:
            df = df.dropna(subset=['road_segment_id'])
        # Save cleaned file
        silver_file = silver_folder / f"road_context_silver_{batch_id}.csv"
        df.to_csv(silver_file, index=False)
        print(f"[OK] Road context Silver: {len(df)} rows saved to {silver_file}")
        return {'status': 'success', 'row_count': len(df), 'file_path': str(silver_file)}
    except Exception as e:
        print(f"[ERROR] Road context Silver processing failed: {e}")
        return {'status': 'error', 'row_count': 0, 'file_path': None}
