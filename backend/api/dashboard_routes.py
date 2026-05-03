"""
Dashboard API routes for project metadata and status.
"""
from fastapi import APIRouter

from pathlib import Path
from .dashboard_utils import find_latest_json_file, load_json_file

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
    debug_print_path("GOLD_DIR", GOLD_DIR)
    print(f"Searching for gold data in: {GOLD_DIR}")
    gold_csvs = list(GOLD_DIR.glob("gold_dataset_*.csv")) if GOLD_DIR.exists() else []
    debug_print_path("gold_csvs", gold_csvs)
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
    return {
        "latest_gold_batch_id": gold.get("batch_id") if gold else None,
        "latest_gold_row_count": gold.get("row_count") if gold else None,
        "latest_gold_created_at": gold.get("created_at") if gold else None,
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
    debug_print_path("BRONZE_DIR", BRONZE_DIR)
    debug_print_path("SILVER_DIR", SILVER_DIR)
    debug_print_path("GOLD_DIR", GOLD_DIR)
    debug_print_path("MODELS_DIR", MODELS_DIR)
    debug_print_path("MODEL_COMPARISONS", MODEL_COMPARISONS)
    print(f"Searching for gold data in: {GOLD_DIR}")
    print(f"Searching for models in: {MODELS_DIR}")
    print(f"Searching for model comparisons in: {MODEL_COMPARISONS}")

    # Check for any files in bronze, silver, gold
    bronze_available = any(BRONZE_DIR.rglob("*")) if BRONZE_DIR.exists() else False
    silver_available = any(SILVER_DIR.rglob("*")) if SILVER_DIR.exists() else False
    gold_available = any(GOLD_DIR.glob("gold_dataset_*.csv")) if GOLD_DIR.exists() else False

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
