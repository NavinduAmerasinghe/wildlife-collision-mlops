"""
Utility functions for model training pipeline.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple

import pandas as pd
from pyspark.sql import functions as F

from utils.spark_session import create_spark_session, get_gold_table_path


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
    spark = create_spark_session(app_name=f"model-read-{source_name}")
    gold_path = get_gold_table_path(source_name)

    try:
        df = spark.read.format("delta").load(gold_path)
    except Exception as exc:
        print(f"[WARN] Failed to read Gold Delta table at {gold_path}: {exc}")
        spark.stop()
        return None, gold_path

    if df.rdd.isEmpty():
        spark.stop()
        return None, gold_path

    batch_row = df.select(F.max("batch_id").alias("latest_batch_id")).collect()[0]
    latest_batch_id = batch_row["latest_batch_id"]
    if latest_batch_id is None:
        spark.stop()
        return None, gold_path

    latest_batch_df = df.filter(F.col("batch_id") == latest_batch_id)
    pandas_df = latest_batch_df.toPandas()
    spark.stop()
    print(f"[INFO] Loaded Gold Delta batch {latest_batch_id} from {gold_path}")
    return pandas_df, gold_path
