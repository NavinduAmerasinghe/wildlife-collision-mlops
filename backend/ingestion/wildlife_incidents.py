"""
Ingest wildlife incident data (e.g., from CSV) into the Bronze layer.
"""
import pandas as pd
from pathlib import Path

def load_wildlife_incidents(raw_path='data/raw/wildlife_incidents.csv'):
	"""
	Loads wildlife incident data from a CSV file.
	Returns a pandas DataFrame. If file does not exist, returns empty DataFrame.
	"""
	path = Path(raw_path)
	if not path.exists():
		print(f"[INFO] File not found: {raw_path}. Returning empty DataFrame.")
		return pd.DataFrame()
	try:
		df = pd.read_csv(path)
		print(f"[INFO] Loaded wildlife incidents: {len(df)} rows.")
		return df
	except Exception as e:
		print(f"[ERROR] Failed to load CSV: {e}")
		return pd.DataFrame()
