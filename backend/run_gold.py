"""
Gold pipeline runner for wildlife collision MLOps project.
"""
from datetime import datetime
import json
from pathlib import Path
import os
from gold.build_gold import build_gold

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _should_run_dvc() -> bool:
    return os.getenv("GOLD_RUN_DVC", "false").strip().lower() in {"1", "true", "yes", "on"}

def generate_batch_id():
    """
    Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
    """
    return datetime.utcnow().strftime('%Y%m%dT%H%M%S')

def save_gold_metadata(batch_id, gold_info, log_dir=None):
    """
    Saves Gold batch metadata as a JSON file.
    """
    if log_dir is None:
        log_dir = PROJECT_ROOT / "logs" / "gold_batches"
    created_at = datetime.utcnow().replace(microsecond=0).isoformat()
    metadata = {
        "batch_id": batch_id,
        "created_at": created_at,
        "row_count": gold_info.get('row_count', 0),
        "file_path": gold_info.get('file_path'),
        "source_files_used": gold_info.get('source_files_used'),
        "status": gold_info.get('status')
    }
    from pathlib import Path
    log_folder = Path(log_dir)
    log_folder.mkdir(parents=True, exist_ok=True)
    file_path = log_folder / f"gold_batch_{batch_id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Saved Gold batch metadata to {file_path}")
    return str(file_path)

def main():

    print("\n=== Wildlife Collision Gold Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated Gold batch_id: {batch_id}")

    # Build Gold dataset
    gold_info = build_gold(batch_id)
    
    # Log row count after build
    if gold_info["status"] == "success":
        print(f"[DEBUG] Gold dataset row count: {gold_info['row_count']}")

    # Save Gold batch metadata
    save_gold_metadata(batch_id, gold_info)

    if _should_run_dvc():
        try:
            from utils import dvc_utils
            dvc_utils.run_dvc_add("data/gold/")
        except Exception as e:
            print(f"[DVC] Warning: {e}")
    else:
        print("[INFO] Skipping DVC tracking in this run.")

    print("\n[COMPLETE] Gold pipeline finished.\n")

if __name__ == "__main__":
    main()
