"""
Builds the Gold ML-ready dataset by joining Silver datasets and adding features.
"""
import pandas as pd
from pathlib import Path
from gold.gold_utils import find_latest_silver_csv
from datetime import datetime

def build_gold(batch_id):
    """
    Loads Silver datasets, joins them, adds features, and saves the Gold dataset.
    Returns a dict with status, row_count, file_path, and source_files_used.
    """
    # Find latest Silver files
    wildlife_file = find_latest_silver_csv('data/silver/wildlife_incidents')
    weather_file = find_latest_silver_csv('data/silver/weather')
    road_file = find_latest_silver_csv('data/silver/road_context')
    source_files = {
        'wildlife_incidents': str(wildlife_file) if wildlife_file else None,
        'weather': str(weather_file) if weather_file else None,
        'road_context': str(road_file) if road_file else None
    }
    if not wildlife_file:
        print('[ERROR] No Silver wildlife incidents file found. Gold dataset cannot be built.')
        return {'status': 'empty', 'row_count': 0, 'file_path': None, 'source_files_used': source_files}
    try:
        # Load Silver datasets
        wildlife_df = pd.read_csv(wildlife_file)
        weather_df = pd.read_csv(weather_file) if weather_file else pd.DataFrame()
        road_df = pd.read_csv(road_file) if road_file else pd.DataFrame()
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
        # Save Gold dataset
        gold_folder = Path('data/gold')
        gold_folder.mkdir(parents=True, exist_ok=True)
        gold_file = gold_folder / f'gold_dataset_{batch_id}.csv'
        gold_df.to_csv(gold_file, index=False)
        print(f'[OK] Gold dataset: {len(gold_df)} rows saved to {gold_file}')
        return {
            'status': 'success',
            'row_count': len(gold_df),
            'file_path': str(gold_file),
            'source_files_used': source_files
        }
    except Exception as e:
        print(f'[ERROR] Gold dataset build failed: {e}')
        return {'status': 'error', 'row_count': 0, 'file_path': None, 'source_files_used': source_files}
