"""
Utility functions for Silver layer processing.
"""
from __future__ import annotations

import os
from typing import Optional

import pandas as pd
from pyspark.sql import functions as F

from utils.spark_session import create_spark_session, get_bronze_table_path, get_silver_table_path


def load_latest_bronze_batch(source_name: str) -> Optional[pd.DataFrame]:
    """
    Loads the latest Bronze batch for a source from the Bronze Delta table.
    Returns a pandas DataFrame or None if the table is missing or empty.
    """
    spark = create_spark_session(app_name=f"silver-read-{source_name}")
    bronze_path = get_bronze_table_path(source_name)

    try:
        df = spark.read.format("delta").load(bronze_path)
    except Exception as exc:
        print(f"[WARN] Failed to read Bronze Delta table at {bronze_path}: {exc}")
        spark.stop()
        return None

    if df.rdd.isEmpty():
        spark.stop()
        return None

    batch_row = df.select(F.max("batch_id").alias("latest_batch_id")).collect()[0]
    latest_batch_id = batch_row["latest_batch_id"]
    if latest_batch_id is None:
        spark.stop()
        return None

    latest_batch_df = df.filter(F.col("batch_id") == latest_batch_id)
    pandas_df = latest_batch_df.toPandas()
    spark.stop()
    print(f"[INFO] Loaded Bronze Delta batch {latest_batch_id} from {bronze_path}")
    return pandas_df


def write_silver_delta(df: pd.DataFrame, source_name: str, batch_id: str) -> str:
    """
    Writes a Silver pandas DataFrame to the Silver Delta table in object storage.
    Returns the Delta table path.
    """
    spark = create_spark_session(app_name=f"silver-write-{source_name}")
    silver_path = get_silver_table_path(source_name)

    silver_df = df.copy()
    silver_df["batch_id"] = batch_id

    spark_df = spark.createDataFrame(silver_df).coalesce(1)
    (
        spark_df.write.format("delta")
        .mode("append")
        .option("mergeSchema", "true")
        .save(silver_path)
    )
    spark.stop()
    print(f"[INFO] Saved {source_name} Silver batch to Delta table at {silver_path}")
    return silver_path


def should_write_local_silver_mirror() -> bool:
    return os.getenv("SILVER_WRITE_LOCAL_MIRROR", "false").strip().lower() in {"1", "true", "yes", "on"}
