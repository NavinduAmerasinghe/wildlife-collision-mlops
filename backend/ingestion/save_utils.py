"""
Utilities for saving Bronze data to Delta Lake, with an optional local CSV mirror.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from utils.spark_session import create_spark_session, get_bronze_table_path


def _should_write_local_mirror() -> bool:
    return os.getenv("BRONZE_WRITE_LOCAL_MIRROR", "true").strip().lower() in {"1", "true", "yes", "on"}


def _write_local_csv(df: pd.DataFrame, source_name: str, batch_id: str, base_dir: str) -> str:
    folder = Path(base_dir) / source_name
    folder.mkdir(parents=True, exist_ok=True)
    filename = f"{source_name}_{batch_id}.csv"
    file_path = folder / filename
    df.to_csv(file_path, index=False)
    print(f"[INFO] Saved local Bronze mirror for {source_name} to {file_path}")
    return str(file_path)


def save_to_bronze(df: pd.DataFrame, source_name: str, batch_id: str, base_dir: str = "data/bronze") -> str:
    """
    Writes a pandas DataFrame to the Bronze Delta table in object storage.
    Optionally mirrors the batch to a local CSV so existing Silver jobs keep working.
    Returns the Delta table path as a string.
    """
    spark = create_spark_session(app_name=f"bronze-{source_name}")
    delta_path = get_bronze_table_path(source_name)

    bronze_df = df.copy()
    bronze_df["batch_id"] = batch_id
    bronze_df["bronze_ingested_at"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    spark_df = spark.createDataFrame(bronze_df).coalesce(1)
    (
        spark_df.write.format("delta")
        .mode("append")
        .option("mergeSchema", "true")
        .save(delta_path)
    )
    print(f"[INFO] Saved {source_name} batch to Delta Bronze table at {delta_path}")

    if _should_write_local_mirror():
        _write_local_csv(bronze_df, source_name, batch_id, base_dir)

    spark.stop()
    return delta_path
