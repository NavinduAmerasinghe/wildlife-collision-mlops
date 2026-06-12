"""
Silver processing for wildlife incidents.
"""
import pandas as pd
from pathlib import Path
from .silver_utils import load_latest_bronze_batch, should_write_local_silver_mirror, write_silver_delta

def process_wildlife(batch_id, project_root):
    """
    Cleans and standardizes wildlife incidents data from Bronze to Silver.
    """
    project_root = Path(project_root)
    silver_folder = project_root / "data" / "silver" / "wildlife_incidents"
    silver_folder.mkdir(parents=True, exist_ok=True)
    df = load_latest_bronze_batch("wildlife_incidents")
    if df is None or df.empty:
        print("[WARN] No Bronze wildlife incidents Delta batch found.")
        return {'status': 'empty', 'row_count': 0, 'file_path': None}
    try:
        # Standardize column names
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        # Parse timestamp
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        # Drop duplicates
        df = df.drop_duplicates()
        # Drop rows missing critical fields
        df = df.dropna(subset=['timestamp', 'location'])
        delta_path = write_silver_delta(df, "wildlife_incidents", batch_id)

        silver_file = None
        if should_write_local_silver_mirror():
            silver_file = silver_folder / f"wildlife_incidents_silver_{batch_id}.csv"
            df.to_csv(silver_file, index=False)
            print(f"[OK] Wildlife incidents Silver: {len(df)} rows saved to {silver_file}")
            print(f"[INFO] Silver file location: {silver_file.resolve()}")

        return {'status': 'success', 'row_count': len(df), 'file_path': str(silver_file) if silver_file else delta_path}
    except Exception as e:
        print(f"[ERROR] Wildlife incidents Silver processing failed: {e}")
        return {'status': 'error', 'row_count': 0, 'file_path': None}
