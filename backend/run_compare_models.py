"""
Model comparison pipeline runner for wildlife collision MLOps project.
"""
from datetime import datetime
import json
from model.compare_models import compare_models

def generate_batch_id():
    """
    Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
    """
    return datetime.utcnow().strftime('%Y%m%dT%H%M%S')

def save_comparison_metadata(batch_id, comparison_info, log_dir='logs/model_comparisons'):
    """
    Saves model comparison metadata as a JSON file.
    """
    created_at = datetime.utcnow().replace(microsecond=0).isoformat()
    metadata = dict(comparison_info)
    metadata['batch_id'] = batch_id
    metadata['created_at'] = created_at
    from pathlib import Path
    log_folder = Path(log_dir)
    log_folder.mkdir(parents=True, exist_ok=True)
    file_path = log_folder / f"model_comparison_{batch_id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Saved model comparison metadata to {file_path}")
    return str(file_path)

def main():
    print("\n=== Wildlife Collision Model Comparison Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated comparison batch_id: {batch_id}")

    # Run comparison pipeline
    comparison_info = compare_models(batch_id)

    # Save comparison metadata
    save_comparison_metadata(batch_id, comparison_info)

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
    print(f"[COMPARISON LOG SAVED] logs/model_comparisons/model_comparison_{batch_id}.json")
    print("\n[COMPLETE] Model comparison pipeline finished.\n")

if __name__ == "__main__":
    main()
