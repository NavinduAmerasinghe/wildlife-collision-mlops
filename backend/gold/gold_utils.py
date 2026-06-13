"""
Utility functions for Gold layer processing.
"""
from __future__ import annotations

import os
from typing import List, Optional, Tuple

import pandas as pd
from pyspark.sql import functions as F

from utils.spark_session import create_spark_session, get_gold_table_path, get_silver_table_path


def load_latest_silver_batch(source_name: str) -> Optional[pd.DataFrame]:
    """
    Loads the latest Silver batch for a source from the Silver Delta table.
    Returns a pandas DataFrame or None if the table is missing or empty.
    """
    spark = create_spark_session(app_name=f"gold-read-{source_name}")
    silver_path = get_silver_table_path(source_name)

    try:
        df = spark.read.format("delta").load(silver_path)
    except Exception as exc:
        print(f"[WARN] Failed to read Silver Delta table at {silver_path}: {exc}")
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
    print(f"[INFO] Loaded Silver Delta batch {latest_batch_id} from {silver_path}")
    return pandas_df


def write_gold_delta(df: pd.DataFrame, batch_id: str, source_name: str = "xgboost_training") -> str:
    """
    Writes a Gold pandas DataFrame to the Gold Delta table in object storage.
    Returns the Delta table path.
    """
    spark = create_spark_session(app_name=f"gold-write-{source_name}")
    gold_path = get_gold_table_path(source_name)

    gold_df = df.copy()
    gold_df["batch_id"] = batch_id

    spark_df = spark.createDataFrame(gold_df).coalesce(1)
    (
        spark_df.write.format("delta")
        .mode("append")
        .option("mergeSchema", "true")
        .save(gold_path)
    )
    spark.stop()
    print(f"[INFO] Saved Gold batch to Delta table at {gold_path}")
    return gold_path


def should_write_local_gold_mirror() -> bool:
    return os.getenv("GOLD_WRITE_LOCAL_MIRROR", "false").strip().lower() in {"1", "true", "yes", "on"}


def list_gold_batch_ids(source_name: str = "xgboost_training") -> List[str]:
    """
    Returns Gold Delta batch ids sorted from newest to oldest.
    """
    spark = create_spark_session(app_name=f"gold-list-{source_name}")
    gold_path = get_gold_table_path(source_name)
    try:
        df = spark.read.format("delta").load(gold_path)
    except Exception as exc:
        print(f"[WARN] Failed to read Gold Delta table at {gold_path}: {exc}")
        spark.stop()
        return []

    if df.rdd.isEmpty():
        spark.stop()
        return []

    batch_ids = [
        row["batch_id"]
        for row in df.select("batch_id").dropna().dropDuplicates().collect()
        if row["batch_id"] is not None
    ]
    spark.stop()
    return sorted(batch_ids, reverse=True)


def load_gold_batch(batch_id: Optional[str] = None, source_name: str = "xgboost_training") -> Tuple[Optional[pd.DataFrame], str]:
    """
    Loads a Gold batch from Delta. If batch_id is omitted, loads the latest batch.
    Returns the pandas DataFrame plus the Gold Delta path.
    """
    spark = create_spark_session(app_name=f"gold-read-{source_name}")
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

    target_batch_id = batch_id
    if target_batch_id is None:
        batch_row = df.select(F.max("batch_id").alias("latest_batch_id")).collect()[0]
        target_batch_id = batch_row["latest_batch_id"]

    if target_batch_id is None:
        spark.stop()
        return None, gold_path

    batch_df = df.filter(F.col("batch_id") == target_batch_id)
    pandas_df = batch_df.toPandas()
    spark.stop()
    print(f"[INFO] Loaded Gold Delta batch {target_batch_id} from {gold_path}")
    return pandas_df, gold_path
