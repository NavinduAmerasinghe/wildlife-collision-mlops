"""
Utility functions for model training pipeline.
"""
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GOLD_DIR = PROJECT_ROOT / "data" / "gold"

def find_latest_gold_csv(gold_folder=None):
    """
    Finds the latest Gold CSV file in the given folder.
    Returns the Path or None if not found.
    """
    if gold_folder is None:
        gold_folder = GOLD_DIR
    folder = Path(gold_folder)
    csv_files = sorted(folder.glob('gold_dataset_*.csv'), reverse=True)
    if not csv_files:
        return None
    return csv_files[0]
