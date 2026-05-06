"""
Full pipeline runner for wildlife-collision-mlops.

Runs:
Bronze -> Silver -> Gold -> Train
"""

import subprocess
import sys
from pathlib import Path
from datetime import datetime, timezone
from db.mongo_client import get_pipeline_runs_collection

BACKEND_DIR = Path(__file__).resolve().parent


def run_stage(script_name: str):                                                   
    print(f"\n==============================")
    print(f"Running {script_name}")
    print(f"==============================\n")

    subprocess.run(
        [sys.executable, script_name],
        cwd=BACKEND_DIR,
        check=True
    )


def store_pipeline_run(status, stages=None, failed_stage=None, error=None):
    """
    Store pipeline run metadata in MongoDB.
    Non-blocking: logs warning if MongoDB is unavailable.
    """
    try:
        collection = get_pipeline_runs_collection()
        if collection is not None:
            if status == "success":
                doc = {
                    "created_at": datetime.now(timezone.utc),
                    "status": "success",
                    "stages": stages or ["bronze", "silver", "gold", "train"],
                    "message": "Full MLOps pipeline completed successfully"
                }
            else:  # failed
                doc = {
                    "created_at": datetime.now(timezone.utc),
                    "status": "failed",
                    "failed_stage": failed_stage,
                    "error": error
                }
            
            collection.insert_one(doc)
            print(f"[INFO] Stored pipeline run metadata in MongoDB")
        else:
            print("[WARNING] MongoDB unavailable, pipeline run metadata not stored")
    except Exception as e:
        print(f"[WARNING] Failed to store pipeline run metadata in MongoDB: {e}")


def main():
    stages = ["bronze", "silver", "gold", "train"]
    try:
        for stage in stages:
            run_stage(f"run_{stage}.py")
        
        print("\n[COMPLETE] Full MLOps pipeline finished successfully.\n")
        store_pipeline_run(status="success", stages=stages)
    except subprocess.CalledProcessError as e:
        failed_stage = stages[stages.index(e.args[0].split("_")[1].split(".")[0])] if len(e.args) > 0 else "unknown"
        error_msg = str(e)
        print(f"\n[ERROR] Pipeline failed at stage: {failed_stage}")
        print(f"[ERROR] {error_msg}\n")
        store_pipeline_run(status="failed", failed_stage=failed_stage, error=error_msg)
        sys.exit(1)
    except Exception as e:
        error_msg = str(e)
        print(f"\n[ERROR] Pipeline failed: {error_msg}\n")
        store_pipeline_run(status="failed", failed_stage="unknown", error=error_msg)
        sys.exit(1)


if __name__ == "__main__":
    main()