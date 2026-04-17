"""
Model training pipeline runner for wildlife collision MLOps project.
"""
from datetime import datetime
import json
from model.train_model import train_model

def generate_batch_id():
    """
    Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
    """
    return datetime.utcnow().strftime('%Y%m%dT%H%M%S')

def save_model_run_metadata(batch_id, run_info, log_dir='logs/model_runs'):
    """
    Saves model run metadata as a JSON file.
    """
    created_at = datetime.utcnow().replace(microsecond=0).isoformat()
    metadata = {
        "batch_id": batch_id,
        "created_at": created_at,
        "gold_file_used": run_info.get('gold_file_used'),
        "features_used": run_info.get('features_used'),
        "row_count": run_info.get('row_count'),
        "train_row_count": run_info.get('train_row_count'),
        "test_row_count": run_info.get('test_row_count'),
        "metrics": run_info.get('metrics'),
        "model_path": run_info.get('model_path'),
        "status": run_info.get('status')
    }
    from pathlib import Path
    log_folder = Path(log_dir)
    log_folder.mkdir(parents=True, exist_ok=True)
    file_path = log_folder / f"model_run_{batch_id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Saved model run metadata to {file_path}")
    return str(file_path)

def main():
    print("\n=== Wildlife Collision Model Training Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated model batch_id: {batch_id}")

    # Run training pipeline
    run_info = train_model(batch_id)

    # Save run metadata
    save_model_run_metadata(batch_id, run_info)

    print("\n[COMPLETE] Model training pipeline finished.\n")

if __name__ == "__main__":
    main()
