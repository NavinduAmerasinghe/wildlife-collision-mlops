"""
Shared Spark session configuration for Delta Lake on SeaweedFS.
"""
from __future__ import annotations

import os

from delta import configure_spark_with_delta_pip
from pyspark.sql import SparkSession


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name, default).strip()
    return value or default


def get_bronze_table_path(source_name: str) -> str:
    bucket = _get_env("S3_BUCKET", "wildlife-lake")
    prefix = _get_env("BRONZE_PREFIX", "bronze").strip("/")
    return f"s3a://{bucket}/{prefix}/{source_name}"


def get_silver_table_path(source_name: str) -> str:
    bucket = _get_env("S3_BUCKET", "wildlife-lake")
    prefix = _get_env("SILVER_PREFIX", "silver").strip("/")
    return f"s3a://{bucket}/{prefix}/{source_name}"


def get_gold_table_path(source_name: str = "xgboost_training") -> str:
    bucket = _get_env("S3_BUCKET", "wildlife-lake")
    prefix = _get_env("GOLD_PREFIX", "gold").strip("/")
    return f"s3a://{bucket}/{prefix}/{source_name}"


def create_spark_session(app_name: str = "wildlife-collision-mlops") -> SparkSession:
    endpoint = _get_env("S3_ENDPOINT", "http://seaweedfs-s3:8333")
    access_key = _get_env("S3_ACCESS_KEY", "wildlife")
    secret_key = _get_env("S3_SECRET_KEY", "wildlife-secret")
    hadoop_aws_version = _get_env("HADOOP_AWS_VERSION", "3.3.4")
    aws_sdk_bundle_version = _get_env("AWS_JAVA_SDK_BUNDLE_VERSION", "1.12.262")
    extra_packages = [
        f"org.apache.hadoop:hadoop-aws:{hadoop_aws_version}",
        f"com.amazonaws:aws-java-sdk-bundle:{aws_sdk_bundle_version}",
    ]

    builder = (
        SparkSession.builder.appName(app_name)
        .master(_get_env("SPARK_MASTER", "local[1]"))
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
        .config("spark.sql.shuffle.partitions", _get_env("SPARK_SQL_SHUFFLE_PARTITIONS", "1"))
        .config("spark.default.parallelism", _get_env("SPARK_DEFAULT_PARALLELISM", "1"))
        .config("spark.sql.files.maxPartitionBytes", _get_env("SPARK_SQL_FILES_MAX_PARTITION_BYTES", "134217728"))
        .config("spark.hadoop.fs.s3a.endpoint", endpoint)
        .config("spark.hadoop.fs.s3a.access.key", access_key)
        .config("spark.hadoop.fs.s3a.secret.key", secret_key)
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
        .config("spark.hadoop.fs.s3a.aws.credentials.provider", "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider")
        .config("spark.hadoop.fs.s3a.fast.upload", "false")
        .config("spark.hadoop.mapreduce.fileoutputcommitter.algorithm.version", "2")
    )

    spark = configure_spark_with_delta_pip(builder, extra_packages=extra_packages).getOrCreate()
    spark.sparkContext.setLogLevel(_get_env("SPARK_LOG_LEVEL", "WARN"))
    return spark
