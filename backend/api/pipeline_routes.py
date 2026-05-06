"""
Pipeline orchestration routes for wildlife-collision-mlops project.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from pathlib import Path
import subprocess
import sys

router = APIRouter()

# Project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]



BACKEND_DIR = PROJECT_ROOT / "backend"
PIPELINE_STEPS = [
    {"name": "run_bronze.py", "script": BACKEND_DIR / "run_bronze.py"},
    {"name": "run_silver.py", "script": BACKEND_DIR / "run_silver.py"},
    {"name": "run_gold.py", "script": BACKEND_DIR / "run_gold.py"},
    {"name": "run_train.py", "script": BACKEND_DIR / "run_train.py"},
    {"name": "run_compare_models.py", "script": BACKEND_DIR / "run_compare_models.py"},
]

@router.post("/pipeline/run")
def run_pipeline():
    """
    Run the MLOps pipeline scripts in order. Stops on first failure.
    """
    steps_run = []
    for step in PIPELINE_STEPS:
        script_path = step["script"]
        print(f"[PIPELINE API] Running script: {script_path.name}")
        if not script_path.exists():
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "failed_step": step["name"],
                    "script": str(script_path),
                    "stdout": "",
                    "stderr": f"Pipeline script not found: {script_path}",
                    "returncode": None,
                },
            )
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=BACKEND_DIR,
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
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "failed_step": step["name"],
                    "script": str(script_path),
                    "stdout": e.stdout,
                    "stderr": e.stderr,
                    "returncode": e.returncode,
                },
            )
    return JSONResponse({
        "status": "success",
        "message": "Pipeline completed successfully",
        "steps": steps_run
    })
