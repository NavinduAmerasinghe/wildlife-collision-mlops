"""
Batch metadata utilities for Bronze ingestion.
"""
from datetime import datetime
from pathlib import Path
import json

def generate_batch_id():
	"""
	Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
	"""
	return datetime.utcnow().strftime('%Y%m%dT%H%M%S')

def save_batch_metadata(batch_id, sources, file_paths, row_counts, log_dir='logs/batches'):
	"""
	Saves batch metadata as a JSON file.
	"""
	created_at = datetime.utcnow().isoformat() + 'Z'
	metadata = {
		"batch_id": batch_id,
		"created_at": created_at,
		"sources": sources,
		"file_paths": file_paths,
		"row_counts": row_counts
	}
	log_folder = Path(log_dir)
	log_folder.mkdir(parents=True, exist_ok=True)
	file_path = log_folder / f"batch_{batch_id}.json"
	with open(file_path, 'w', encoding='utf-8') as f:
		json.dump(metadata, f, indent=2)
	print(f"[INFO] Saved batch metadata to {file_path}")
	return str(file_path)
