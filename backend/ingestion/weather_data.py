"""
Bronze weather data ingestion: loads raw weather observations from CSV.
"""
import pandas as pd
from pathlib import Path

def load_weather_data(raw_path='data/raw/weather_observations.csv'):
	"""
	Loads weather observation data from a CSV file.
	Returns a pandas DataFrame. If file does not exist, returns empty DataFrame.
	This is Bronze raw ingestion only (no transformation).
	"""
	path = Path(raw_path)
	if not path.exists():
		print(f"[INFO] Weather CSV not found: {raw_path}. Returning empty DataFrame.")
		return pd.DataFrame()
	try:
		df = pd.read_csv(path)
		print(f"[INFO] Loaded weather observations: {len(df)} rows.")
		return df
	except Exception as e:
		print(f"[ERROR] Failed to load weather CSV: {e}")
		return pd.DataFrame()
