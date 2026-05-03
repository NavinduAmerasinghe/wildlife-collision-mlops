"""
Loads the latest best trained model for serving.
"""

from pathlib import Path
import joblib


# Anchor to project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "models"

def debug_print_path(label, path):
    print(f"[DEBUG] {label}: {path.resolve() if hasattr(path, 'resolve') else path}")

def find_latest_best_model():
    """
    Finds the latest best model file in the models folder.
    Returns the Path or None if not found.
    """
    print(f"Searching for models in: {MODELS_DIR}")
    model_files = sorted(MODELS_DIR.glob('best_wildlife_risk_model_*.pkl'), reverse=True)
    print(f"[DEBUG] Found model_files: {model_files}")
    if not model_files:
        return None
    return model_files[0]

def load_latest_model():
    """
    Loads the latest best model using joblib. Handles missing model gracefully.
    """
    model_path = find_latest_best_model()
    print(f"[DEBUG] Selected model_path: {model_path}")
    if not model_path or not model_path.exists():
        raise FileNotFoundError("No trained model found. Please train and compare models first.")
    try:
        model = joblib.load(model_path)
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")
