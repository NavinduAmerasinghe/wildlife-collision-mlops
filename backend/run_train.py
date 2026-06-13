"""
Model training pipeline runner for wildlife collision MLOps project.
Logs training results to MLflow and saves local JSON metadata.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import os

import mlflow
from model.train_model import train_model


PROJECT_ROOT = Path(__file__).resolve().parents[1]

MLFLOW_DB = f"sqlite:///{PROJECT_ROOT / 'mlflow.db'}"
EXPERIMENT_NAME = "wildlife_collision_model_training"


def _should_run_dvc() -> bool:
    return os.getenv("MODEL_RUN_DVC", "false").strip().lower() in {"1", "true", "yes", "on"}


def generate_batch_id():
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")


def save_model_run_metadata(batch_id, run_info, log_dir=None):
    if log_dir is None:
        log_dir = PROJECT_ROOT / "logs" / "model_runs"

    created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    metadata = {
        "batch_id": batch_id,
        "created_at": created_at,
        "gold_file_used": run_info.get("gold_file_used"),
        "features_used": run_info.get("features_used"),
        "row_count": run_info.get("row_count"),
        "train_row_count": run_info.get("train_row_count"),
        "test_row_count": run_info.get("test_row_count"),
        "metrics": run_info.get("metrics"),
        "model_path": run_info.get("model_path"),
        "status": run_info.get("status"),
    }

    log_folder = Path(log_dir)
    log_folder.mkdir(parents=True, exist_ok=True)

    file_path = log_folder / f"model_run_{batch_id}.json"

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[INFO] Saved model run metadata to {file_path}")
    return str(file_path)


def log_to_mlflow(batch_id, run_info, metadata_path):
    mlflow.set_tracking_uri(MLFLOW_DB)
    mlflow.set_experiment(EXPERIMENT_NAME)

    with mlflow.start_run(run_name=f"train_{batch_id}"):
        mlflow.log_param("batch_id", batch_id)
        mlflow.log_param("status", run_info.get("status"))
        mlflow.log_param("gold_file_used", run_info.get("gold_file_used"))
        mlflow.log_param("model_path", run_info.get("model_path"))

        features = run_info.get("features_used")
        if features:
            mlflow.log_param("features_used", ",".join(map(str, features)))

        for key in ["row_count", "train_row_count", "test_row_count"]:
            value = run_info.get(key)
            if value is not None:
                mlflow.log_metric(key, float(value))

        metrics = run_info.get("metrics") or {}
        for metric_name, metric_value in metrics.items():
            if isinstance(metric_value, (int, float)):
                mlflow.log_metric(metric_name, float(metric_value))

        metadata_file = Path(metadata_path)
        if metadata_file.exists():
            mlflow.log_artifact(str(metadata_file), artifact_path="metadata")

        model_path = run_info.get("model_path")
        if model_path:
            model_file = Path(model_path)

            if not model_file.is_absolute():
                model_file = PROJECT_ROOT / model_file

            if model_file.exists():
                mlflow.log_artifact(str(model_file), artifact_path="model_file")
            else:
                print(f"[WARNING] Model file not found: {model_file}")

        print("[INFO] Logged run to MLflow")


def main():

    print("\n=== Wildlife Collision Model Training Pipeline ===\n")

    batch_id = generate_batch_id()
    print(f"[STEP] Generated model batch_id: {batch_id}")

    run_info = train_model(batch_id)

    metadata_path = save_model_run_metadata(batch_id, run_info)

    log_to_mlflow(batch_id, run_info, metadata_path)

    if _should_run_dvc():
        try:
            from utils import dvc_utils
            dvc_utils.run_dvc_add("data/gold/")
            dvc_utils.run_dvc_add("models/")
        except Exception as e:
            print(f"[DVC] Warning: {e}")
    else:
        print("[INFO] Skipping DVC tracking in this run.")

    print("\n[COMPLETE] Model training pipeline finished.\n")


if __name__ == "__main__":
    main()
