"""
Pipeline runner for wildlife-collision-mlops
Runs Gold pipeline and Model training, then tracks outputs with DVC.
"""
import sys
import os
from pathlib import Path
from utils import dvc_utils

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Run Gold pipeline
def run_gold():
    os.system(f"{sys.executable} run_gold.py")

# Run Model training
def run_train():
    os.system(f"{sys.executable} run_train.py")

def main():
    run_gold()
    run_train()
    # DVC tracking
    dvc_utils.run_dvc_add("data/gold/")
    dvc_utils.run_dvc_add("models/")

if __name__ == "__main__":
    main()
