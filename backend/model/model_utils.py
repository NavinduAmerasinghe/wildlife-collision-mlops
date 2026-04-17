"""
Utility functions for model training pipeline.
"""
from pathlib import Path

def find_latest_gold_csv(gold_folder='data/gold'):
    """
    Finds the latest Gold CSV file in the given folder.
    Returns the Path or None if not found.
    """
    folder = Path(gold_folder)
    csv_files = sorted(folder.glob('*.csv'), reverse=True)
    if not csv_files:
        return None
    return csv_files[0]
