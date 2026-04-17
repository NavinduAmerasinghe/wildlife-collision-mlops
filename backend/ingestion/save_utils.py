"""
Utility for saving DataFrames to Bronze layer.
"""
from pathlib import Path
import pandas as pd

def save_to_bronze(df, source_name, batch_id, base_dir='data/bronze'):
	"""
	Saves a DataFrame to the Bronze folder with a timestamped filename.
	Ensures the directory exists. Returns the saved file path as a string.
	"""
	folder = Path(base_dir) / source_name
	folder.mkdir(parents=True, exist_ok=True)
	filename = f"{source_name}_{batch_id}.csv"
	file_path = folder / filename
	df.to_csv(file_path, index=False)
	print(f"[INFO] Saved {source_name} batch to {file_path}")
	return str(file_path)
