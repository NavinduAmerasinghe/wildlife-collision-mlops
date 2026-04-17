"""
Utility functions for Gold layer processing.
"""
from pathlib import Path

def find_latest_silver_csv(source_folder):
    """
    Finds the latest CSV file in the given Silver source folder.
    Returns the Path or None if not found.
    """
    folder = Path(source_folder)
    csv_files = sorted(folder.glob('*.csv'), reverse=True)
    if not csv_files:
        return None
    return csv_files[0]
