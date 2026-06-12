"""
Silver processing for road context data.
"""
import pandas as pd
from pathlib import Path
from .silver_utils import load_latest_bronze_batch, should_write_local_silver_mirror, write_silver_delta

def process_road_context(batch_id, project_root):
    """
    Cleans and standardizes road context data from Bronze to Silver.
    """
    project_root = Path(project_root)
    silver_folder = project_root / "data" / "silver" / "road_context"
    silver_folder.mkdir(parents=True, exist_ok=True)
    df = load_latest_bronze_batch("road_context")
    if df is None or df.empty:
        print("[WARN] No Bronze road context Delta batch found.")
        return {'status': 'empty', 'row_count': 0, 'file_path': None}
    try:
        # Standardize column names
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        # Drop duplicates
        df = df.drop_duplicates()
        # Drop rows missing road_segment_id if present
        if 'road_segment_id' in df.columns:
            df = df.dropna(subset=['road_segment_id'])
        delta_path = write_silver_delta(df, "road_context", batch_id)

        silver_file = None
        if should_write_local_silver_mirror():
            silver_file = silver_folder / f"road_context_silver_{batch_id}.csv"
            df.to_csv(silver_file, index=False)
            print(f"[OK] Road context Silver: {len(df)} rows saved to {silver_file}")
            print(f"[INFO] Silver file location: {silver_file.resolve()}")

        return {'status': 'success', 'row_count': len(df), 'file_path': str(silver_file) if silver_file else delta_path}
    except Exception as e:
        print(f"[ERROR] Road context Silver processing failed: {e}")
        return {'status': 'error', 'row_count': 0, 'file_path': None}
