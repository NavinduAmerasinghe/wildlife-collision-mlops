"""
Full pipeline runner for wildlife-collision-mlops.

Runs:
Bronze -> Silver -> Gold -> Train
"""

import subprocess
import sys
from pathlib import Path

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


def main():
    run_stage("run_bronze.py")
    run_stage("run_silver.py")
    run_stage("run_gold.py")
    run_stage("run_train.py")

    print("\n[COMPLETE] Full MLOps pipeline finished successfully.\n")


if __name__ == "__main__":
    main()