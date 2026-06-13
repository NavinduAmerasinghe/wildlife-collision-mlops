"""
Dashboard API routes for project metadata and status.
"""
from fastapi import APIRouter

from pathlib import Path
from .dashboard_utils import find_latest_json_file, load_json_file
from db.mongo_client import get_dataset_uploads_collection

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# Anchor all paths to project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
LOGS_DIR = PROJECT_ROOT / "logs"
MODELS_DIR = PROJECT_ROOT / "models"

# Data pipeline folders
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"
BRONZE_BATCHES = LOGS_DIR / "bronze_batches"
SILVER_BATCHES = LOGS_DIR / "silver_batches"

# Log and batch folders
GOLD_BATCHES = LOGS_DIR / "gold_batches"
MODEL_RUNS = LOGS_DIR / "model_runs"
MODEL_COMPARISONS = LOGS_DIR / "model_comparisons"

def debug_print_path(label, path):
    print(f"[DEBUG] {label}: {path.resolve() if hasattr(path, 'resolve') else path}")

@router.get("/summary")
def dashboard_summary():
    """
    Returns a summary of the latest project outputs for the dashboard.
    """
    debug_print_path("GOLD_BATCHES", GOLD_BATCHES)
    gold_file = find_latest_json_file(GOLD_BATCHES)
    debug_print_path("gold_file", gold_file)
    gold = load_json_file(gold_file)
    debug_print_path("MODEL_COMPARISONS", MODEL_COMPARISONS)
    print(f"Searching for model comparisons in: {MODEL_COMPARISONS}")
    comparison_file = find_latest_json_file(MODEL_COMPARISONS)
    debug_print_path("comparison_file", comparison_file)
    comparison = load_json_file(comparison_file)
    features = comparison.get("features_used", []) if comparison else []

    latest_upload_row_count = None
    latest_upload_filename = None
    try:
        collection = get_dataset_uploads_collection()
        if collection is not None:
            latest_upload = collection.find_one(sort=[("created_at", -1)])
            if latest_upload:
                latest_upload_row_count = latest_upload.get("row_count")
                latest_upload_filename = latest_upload.get("saved_filename") or latest_upload.get("original_filename")
    except Exception as e:
        print(f"[WARNING] Failed to read latest dataset upload metadata: {e}")

    return {
        "latest_gold_batch_id": gold.get("batch_id") if gold else None,
        "latest_gold_row_count": gold.get("row_count") if gold else None,
        "latest_gold_created_at": gold.get("created_at") if gold else None,
        "latest_uploaded_dataset_row_count": latest_upload_row_count,
        "latest_uploaded_dataset_filename": latest_upload_filename,
        "feature_count": len(features),
        "selected_best_model": (comparison.get("selected_best_model") if comparison else None),
    }

@router.get("/model-comparison")
def dashboard_model_comparison():
    """
    Returns the latest model comparison details.
    """
    debug_print_path("MODEL_COMPARISONS", MODEL_COMPARISONS)
    print(f"Searching for model comparisons in: {MODEL_COMPARISONS}")
    comparison_file = find_latest_json_file(MODEL_COMPARISONS)
    debug_print_path("comparison_file", comparison_file)
    comparison = load_json_file(comparison_file)
    if not comparison:
        return {
            "batch_id": None,
            "selected_best_model": None,
            "logistic_regression": None,
            "random_forest": None,
        }
    return {
        "batch_id": comparison.get("batch_id"),
        "selected_best_model": comparison.get("selected_best_model"),
        "logistic_regression": comparison.get("logistic_regression_metrics"),
        "random_forest": comparison.get("random_forest_metrics"),
    }

@router.get("/pipeline-status")
def dashboard_pipeline_status():
    """
    Returns booleans for existence of key pipeline artifacts.
    """
    debug_print_path("BRONZE_BATCHES", BRONZE_BATCHES)
    debug_print_path("SILVER_BATCHES", SILVER_BATCHES)
    debug_print_path("GOLD_BATCHES", GOLD_BATCHES)
    debug_print_path("MODELS_DIR", MODELS_DIR)
    debug_print_path("MODEL_COMPARISONS", MODEL_COMPARISONS)
    print(f"Searching for models in: {MODELS_DIR}")
    print(f"Searching for model comparisons in: {MODEL_COMPARISONS}")

    bronze_available = find_latest_json_file(BRONZE_BATCHES) is not None
    silver_available = find_latest_json_file(SILVER_BATCHES) is not None
    gold_available = find_latest_json_file(GOLD_BATCHES) is not None

    # Check for any .pkl model files in models dir
    model_available = any(MODELS_DIR.glob("*.pkl")) if MODELS_DIR.exists() else False

    # Check for any model comparison json in logs/model_comparisons
    comparison = find_latest_json_file(MODEL_COMPARISONS)
    comparison_available = comparison is not None

    return {
        "bronze_available": bronze_available,
        "silver_available": silver_available,
        "gold_available": gold_available,
        "model_available": model_available,
        "comparison_available": comparison_available,
        "api_status": True,
    }
