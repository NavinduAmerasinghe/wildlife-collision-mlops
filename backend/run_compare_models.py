"""
Model comparison pipeline runner for wildlife collision MLOps project.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from model.compare_models import compare_models
from db.mongo_client import get_model_comparisons_collection

PROJECT_ROOT = Path(__file__).resolve().parents[1]

def generate_batch_id():
    """
    Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
    """
    return datetime.utcnow().strftime('%Y%m%dT%H%M%S')

def save_comparison_metadata(batch_id, comparison_info, log_dir=None):
    """
    Saves model comparison metadata as a JSON file.
    """
    created_at = datetime.utcnow().replace(microsecond=0).isoformat()
    metadata = dict(comparison_info)
    metadata['batch_id'] = batch_id
    metadata['created_at'] = created_at

    if log_dir is None:
        log_dir = PROJECT_ROOT / "logs" / "model_comparisons"

    log_folder = Path(log_dir)
    log_folder.mkdir(parents=True, exist_ok=True)
    file_path = log_folder / f"model_comparison_{batch_id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Saved model comparison metadata to {file_path}")
    print(f"[INFO] Comparison metadata absolute path: {file_path.resolve()}")
    return metadata


def store_comparison_metadata_in_mongodb(metadata):
    """
    Store model comparison metadata in MongoDB.
    Non-blocking: logs warning if MongoDB is unavailable.
    """
    try:
        collection = get_model_comparisons_collection()
        if collection is not None:
            print("[DEBUG] Metadata to insert:", metadata)
            doc = {
                "created_at": datetime.now(timezone.utc),
                "batch_id": metadata.get("batch_id"),
                "selected_best_model": metadata.get("selected_best_model"),
                "logistic_regression": metadata.get("logistic_regression_metrics"),
                "random_forest": metadata.get("random_forest_metrics"),
                "saved_model_path": metadata.get("saved_model_path"),
                "status": metadata.get("status")
            }
            collection.insert_one(doc)
            print(f"[INFO] Stored model comparison metadata in MongoDB")
        else:
            print("[WARNING] MongoDB collection is None")
    except Exception as e:
        print(f"[WARNING] Failed to store metadata in MongoDB: {e}")

def main():
    print("\n=== Wildlife Collision Model Comparison Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated comparison batch_id: {batch_id}")

    # Run comparison pipeline
    comparison_info = compare_models(batch_id)

    # Save comparison metadata to JSON file and get metadata dict
    metadata = save_comparison_metadata(batch_id, comparison_info)
    
    # Store comparison metadata in MongoDB (non-blocking)
    store_comparison_metadata_in_mongodb(metadata)

    # Print summary
    if comparison_info.get('status') == 'success':
        print("\n[RESULTS] Logistic Regression metrics:")
        print(comparison_info.get('logistic_regression_metrics'))
        print("\n[RESULTS] Random Forest metrics:")
        print(comparison_info.get('random_forest_metrics'))
        print(f"\n[SELECTED] Best model: {comparison_info.get('selected_best_model')}")
        print(f"[MODEL SAVED] {comparison_info.get('saved_model_path')}")
    else:
        print("\n[ERROR] Model comparison did not complete successfully.")
    print(f"[COMPARISON LOG SAVED] {PROJECT_ROOT / 'logs' / 'model_comparisons' / f'model_comparison_{batch_id}.json'}")
    print("\n[COMPLETE] Model comparison pipeline finished.\n")

if __name__ == "__main__":
    main()
