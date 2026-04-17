"""
Dashboard API routes for project metadata and status.
"""
from fastapi import APIRouter
from pathlib import Path
from .dashboard_utils import find_latest_json_file, load_json_file

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Paths to logs and artifacts
LOGS_DIR = Path(__file__).parent.parent / "logs"
GOLD_BATCHES = LOGS_DIR / "gold_batches"
MODEL_RUNS = LOGS_DIR / "model_runs"
MODEL_COMPARISONS = LOGS_DIR / "model_comparisons"
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

@router.get("/summary")
def dashboard_summary():
    """
    Returns a summary of the latest project outputs for the dashboard.
    """
    gold_file = find_latest_json_file(GOLD_BATCHES)
    gold = load_json_file(gold_file)
    comparison_file = find_latest_json_file(MODEL_COMPARISONS)
    comparison = load_json_file(comparison_file)
    return {
        "latest_gold_batch_id": gold.get("batch_id") if gold else None,
        "latest_gold_row_count": gold.get("row_count") if gold else None,
        "latest_gold_created_at": gold.get("created_at") if gold else None,
        "feature_count": gold.get("feature_count") if gold else None,
        "selected_best_model": (comparison.get("selected_best_model") if comparison else None),
    }

@router.get("/model-comparison")
def dashboard_model_comparison():
    """
    Returns the latest model comparison details.
    """
    comparison_file = find_latest_json_file(MODEL_COMPARISONS)
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
        "logistic_regression": comparison.get("logistic_regression"),
        "random_forest": comparison.get("random_forest"),
    }

@router.get("/pipeline-status")
def dashboard_pipeline_status():
    """
    Returns booleans for existence of key pipeline artifacts.
    """
    bronze = LOGS_DIR / "bronze_batches"
    silver = LOGS_DIR / "silver_batches"
    gold = GOLD_BATCHES
    model = ARTIFACTS_DIR / "best_model.joblib"
    comparison = find_latest_json_file(MODEL_COMPARISONS)
    # API status is always True if this endpoint is reachable
    return {
        "bronze_available": any(bronze.glob("*.json")) if bronze.exists() else False,
        "silver_available": any(silver.glob("*.json")) if silver.exists() else False,
        "gold_available": any(gold.glob("*.json")) if gold.exists() else False,
        "model_available": model.exists(),
        "comparison_available": comparison is not None,
        "api_status": True,
    }
