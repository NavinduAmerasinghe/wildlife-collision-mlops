"""
MongoDB client for wildlife collision MLOps predictions.
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Load environment variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "wildlife_mlops")

_client = None
_db = None


def get_client():
    """Get or create MongoDB client."""
    global _client

    if _client is None:
        try:
            _client = MongoClient(
                MONGO_URL,
                serverSelectionTimeoutMS=5000
            )

            # Test connection
            _client.admin.command("ping")

            print("[INFO] Connected to MongoDB Atlas")

        except ConnectionFailure as e:
            print(f"[WARNING] Failed to connect to MongoDB: {e}")
            _client = None

    return _client


def get_database():
    """Get MongoDB database."""
    global _db

    client = get_client()

    if client is None:
        print("[WARNING] MongoDB client is not available")
        return None

    if _db is None:
        _db = client[MONGO_DB_NAME]

    return _db


def get_prediction_collection():
    """Get predictions collection from MongoDB."""
    db = get_database()

    if db is None:
        return None

    return db["predictions"]


def get_pipeline_runs_collection():
    """Get pipeline_runs collection from MongoDB."""
    db = get_database()

    if db is None:
        return None

    return db["pipeline_runs"]


def get_model_comparisons_collection():
    """Get model_comparisons collection from MongoDB."""
    db = get_database()

    if db is None:
        return None

    return db["model_comparisons"]


def get_dataset_uploads_collection():
    """Get dataset_uploads collection from MongoDB."""
    db = get_database()

    if db is None:
        return None

    return db["dataset_uploads"]


def close_connection():
    """Close MongoDB connection."""
    global _client, _db

    if _client is not None:
        _client.close()
        _client = None
        _db = None

        print("[INFO] Closed MongoDB connection")