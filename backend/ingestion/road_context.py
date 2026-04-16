"""
Bronze road context data ingestion: loads raw road context from CSV.
"""
import pandas as pd
from pathlib import Path

def load_road_context(raw_path='data/raw/road_context.csv'):
	"""
	Loads road context data from a CSV file.
	Returns a pandas DataFrame. If file does not exist, returns empty DataFrame.
	This is Bronze raw ingestion only (no transformation).
	"""
	path = Path(raw_path)
	if not path.exists():
		print(f"[INFO] Road context CSV not found: {raw_path}. Returning empty DataFrame.")
		return pd.DataFrame()
	try:
		df = pd.read_csv(path)
		print(f"[INFO] Loaded road context: {len(df)} rows.")
		return df
	except Exception as e:
		print(f"[ERROR] Failed to load road context CSV: {e}")
		return pd.DataFrame()
