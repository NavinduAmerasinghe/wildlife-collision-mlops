"""
Utility functions for model training pipeline.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple

import pandas as pd
from pyspark.sql import functions as F

from gold.gold_utils import load_gold_batch


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


def load_latest_gold_batch(source_name: str = "xgboost_training") -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """
    Loads the latest Gold batch from the Gold Delta table.
    Returns the pandas DataFrame plus the Delta table path, or (None, path) on failure.
    """
    return load_gold_batch(batch_id=None, source_name=source_name)
