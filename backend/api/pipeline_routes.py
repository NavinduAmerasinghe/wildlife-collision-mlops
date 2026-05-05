"""
Pipeline orchestration routes for wildlife-collision-mlops project.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from pathlib import Path
import subprocess
import sys

router = APIRouter()

# Project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]



BACKEND_DIR = PROJECT_ROOT / "backend"
# Bronze runner is backend/ingestion/batch_metadata.py (or another ingestion script if found)
BRONZE_RUNNER = BACKEND_DIR / "ingestion" / "batch_metadata.py"
PIPELINE_STEPS = [
    {"name": "Bronze ingestion", "script": BRONZE_RUNNER},
    {"name": "Silver processing", "script": BACKEND_DIR / "run_silver.py"},
    {"name": "Gold dataset creation", "script": BACKEND_DIR / "run_gold.py"},
    {"name": "Model comparison/training", "script": BACKEND_DIR / "run_compare_models.py"},
]

@router.post("/pipeline/run")
def run_pipeline():
    """
    Run the MLOps pipeline scripts in order. Stops on first failure.
    """
    steps_run = []
    for step in PIPELINE_STEPS:
        script_path = step["script"]
        if not script_path.exists():
            raise HTTPException(
                status_code=500,
                detail={
                    "status": "error",
                    "failed_step": step["name"],
                    "script": str(script_path),
                    "stdout": "",
                    "stderr": f"Pipeline script not found: {script_path}",
                    "returncode": None
                }
            )
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
                check=True
            )
            steps_run.append({
                "step": step["name"],
                "script": str(script_path),
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            })
        except subprocess.CalledProcessError as e:
            # On failure, return error info
            raise HTTPException(
                status_code=500,
                detail={
                    "status": "error",
                    "failed_step": step["name"],
                    "script": str(script_path),
                    "stdout": e.stdout,
                    "stderr": e.stderr,
                    "returncode": e.returncode
                }
            )
    return JSONResponse({
        "status": "success",
        "message": "Pipeline completed successfully",
        "steps": steps_run
    })
