"""
Ingest wildlife incident data (e.g., from CSV) into the Bronze layer.
"""
import pandas as pd
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ACTIVE_WILDLIFE_DATASET = PROJECT_ROOT / "data" / "raw" / "wildlife_incidents.csv"


def load_wildlife_incidents(raw_path=None):
	"""
	Loads wildlife incident data from a CSV file.
	Returns a pandas DataFrame. If file does not exist, returns empty DataFrame.
	"""
	path = Path(raw_path) if raw_path is not None else ACTIVE_WILDLIFE_DATASET
	print(f"[DEBUG] Wildlife incidents file path: {path}")
	print(f"[DEBUG] Wildlife incidents file exists: {path.exists()}")
	print(f"[DEBUG] Wildlife incidents file absolute path: {path.resolve()}")
	if not path.exists():
		print(f"[ERROR] File not found: {path}. Returning empty DataFrame.")
		return pd.DataFrame()
	try:
		df = pd.read_csv(path)
		print(f"[DEBUG] Wildlife dataset loaded from: {path.name}")
		print(f"[DEBUG] Wildlife dataset row count: {len(df)}")
		print(f"[INFO] Loaded wildlife incidents: {len(df)} rows.")
		return df
	except Exception as e:
		print(f"[ERROR] Failed to load CSV: {e}")
		return pd.DataFrame()
