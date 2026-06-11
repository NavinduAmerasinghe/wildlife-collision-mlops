"""
Bronze ingestion pipeline runner for wildlife-collision-mlops.
Run from backend folder with: python run_bronze.py

Loads raw CSVs, writes non-empty DataFrames to Bronze Delta tables in SeaweedFS,
and writes per-source metadata to logs/bronze_batches/.
Optionally keeps a local CSV mirror for downstream compatibility during migration.
"""
import os
import sys
from pathlib import Path

# Ensure imports resolve relative to backend when executed from backend/
PROJECT_ROOT = Path(__file__).resolve().parents[1]
# change working directory so helper functions using relative paths work
os.chdir(PROJECT_ROOT)

from ingestion.wildlife_incidents import load_wildlife_incidents
from ingestion.weather_data import load_weather_data
from ingestion.road_context import load_road_context
from ingestion.save_utils import save_to_bronze
from ingestion.batch_metadata import generate_batch_id, save_batch_metadata


def _should_run_dvc() -> bool:
    return os.getenv("BRONZE_RUN_DVC", "false").strip().lower() in {"1", "true", "yes", "on"}


def main():
    print("\n=== Wildlife Collision Bronze Ingestion Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated batch_id: {batch_id}")

    sources = [
        ("wildlife_incidents", load_wildlife_incidents),
        ("weather_data", load_weather_data),
        ("road_context", load_road_context),
    ]

    source_metadata = {}

    for name, loader in sources:
        print(f"[STEP] Loading {name}...")
        try:
            df = loader()
        except Exception as e:
            print(f"[ERROR] Failed to load {name}: {e}")
            source_metadata[name] = {"status": "failed", "row_count": 0, "file_path": None}
            continue

        if name == "wildlife_incidents":
            print(f"[DEBUG] Wildlife rows loaded from ingestion: {len(df)}")
        
        try:
            if df is None or df.empty:
                print(f"[INFO] {name} is empty. Skipping save.")
                source_metadata[name] = {"status": "empty", "row_count": 0, "file_path": None}
            else:
                saved_path = save_to_bronze(df, name, batch_id)
                source_metadata[name] = {"status": "success", "row_count": len(df), "file_path": saved_path}
                if name == "wildlife_incidents":
                    print(f"[DEBUG] Wildlife rows saved to bronze: {len(df)}")
        except Exception as e:
            print(f"[ERROR] Failed to save {name} to bronze: {e}")
            source_metadata[name] = {"status": "failed", "row_count": 0, "file_path": None}

    # Save batch metadata
    print("[STEP] Saving batch metadata...")
    metadata_path = save_batch_metadata(batch_id, source_metadata, log_dir=str(PROJECT_ROOT / "logs/bronze_batches"))

    if os.getenv("BRONZE_WRITE_LOCAL_MIRROR", "true").strip().lower() in {"1", "true", "yes", "on"} and _should_run_dvc():
        print("[STEP] Attempting DVC tracking for data/bronze/ local mirror (optional)...")
        try:
            from utils import dvc_utils
            dvc_utils.run_dvc_add("data/bronze/")
        except Exception as e:
            print(f"[DVC] Warning: failed to track with DVC: {e}")
    else:
        print("[INFO] Skipping DVC tracking in this run.")

    print("\n[COMPLETE] Bronze ingestion pipeline finished.\n")
    print(f"Metadata saved to: {metadata_path}")


if __name__ == "__main__":
    main()
