"""
Builds the Gold ML-ready dataset by joining Silver datasets and adding features.
"""
import pandas as pd
from pathlib import Path
from gold.gold_utils import load_latest_silver_batch, should_write_local_gold_mirror, write_gold_delta

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SILVER_DIR = PROJECT_ROOT / "data" / "silver"
GOLD_DIR = PROJECT_ROOT / "data" / "gold"

def build_gold(batch_id):
    """
    Loads Silver datasets, joins them, adds features, and saves the Gold dataset.
    Returns a dict with status, row_count, file_path, and source_files_used.
    """
    source_files = {
        'wildlife_incidents': 's3a://wildlife-lake/silver/wildlife_incidents',
        'weather': 's3a://wildlife-lake/silver/weather_data',
        'road_context': 's3a://wildlife-lake/silver/road_context'
    }
    wildlife_df = load_latest_silver_batch("wildlife_incidents")
    weather_df = load_latest_silver_batch("weather_data")
    road_df = load_latest_silver_batch("road_context")

    if wildlife_df is None or wildlife_df.empty:
        print('[ERROR] No Silver wildlife incidents Delta batch found. Gold dataset cannot be built.')
        return {'status': 'empty', 'row_count': 0, 'file_path': None, 'source_files_used': source_files}
    try:
        weather_df = weather_df if weather_df is not None else pd.DataFrame()
        road_df = road_df if road_df is not None else pd.DataFrame()
        # Standardize column names
        wildlife_df.columns = [c.strip().lower().replace(' ', '_') for c in wildlife_df.columns]
        if not weather_df.empty:
            weather_df.columns = [c.strip().lower().replace(' ', '_') for c in weather_df.columns]
        if not road_df.empty:
            road_df.columns = [c.strip().lower().replace(' ', '_') for c in road_df.columns]
        # Join datasets (simple left joins on location)
        gold_df = wildlife_df.copy()
        if not weather_df.empty and 'location' in weather_df.columns:
            gold_df = gold_df.merge(weather_df, on='location', how='left', suffixes=('', '_weather'))
        if not road_df.empty and 'location' in road_df.columns:
            gold_df = gold_df.merge(road_df, on='location', how='left', suffixes=('', '_road'))
        # Drop duplicate rows if any
        gold_df = gold_df.drop_duplicates()
        # Feature engineering
        if 'timestamp' in gold_df.columns:
            gold_df['timestamp'] = pd.to_datetime(gold_df['timestamp'], errors='coerce')
            gold_df['hour'] = gold_df['timestamp'].dt.hour
            gold_df['month'] = gold_df['timestamp'].dt.month
            gold_df['is_night'] = gold_df['hour'].apply(lambda h: 1 if pd.notnull(h) and (h < 6 or h >= 20) else 0)
            gold_df['is_weekend'] = gold_df['timestamp'].dt.dayofweek.apply(lambda d: 1 if d >= 5 else 0)
        else:
            gold_df['hour'] = None
            gold_df['month'] = None
            gold_df['is_night'] = None
            gold_df['is_weekend'] = None
        if 'precipitation' in gold_df.columns:
            gold_df['high_precipitation'] = gold_df['precipitation'].apply(lambda x: 1 if pd.notnull(x) and x > 1.0 else 0)
        else:
            gold_df['high_precipitation'] = None
        if 'severity' in gold_df.columns:
            gold_df['high_risk_target'] = gold_df['severity'].apply(lambda x: 1 if str(x).strip().lower() == 'high' else 0)
        else:
            gold_df['high_risk_target'] = None
        delta_path = write_gold_delta(gold_df, batch_id)

        gold_file = None
        if should_write_local_gold_mirror():
            GOLD_DIR.mkdir(parents=True, exist_ok=True)
            gold_file = GOLD_DIR / f'gold_dataset_{batch_id}.csv'
            gold_df.to_csv(gold_file, index=False)
            print(f'[OK] Gold dataset: {len(gold_df)} rows saved to {gold_file}')
            print(f'[INFO] Gold file absolute path: {gold_file.resolve()}')

        return {
            'status': 'success',
            'row_count': len(gold_df),
            'file_path': str(gold_file) if gold_file else delta_path,
            'source_files_used': source_files
        }
    except Exception as e:
        print(f'[ERROR] Gold dataset build failed: {e}')
        return {'status': 'error', 'row_count': 0, 'file_path': None, 'source_files_used': source_files}
