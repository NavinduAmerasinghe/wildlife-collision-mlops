"""
Loads the latest best trained model for serving.
"""

from pathlib import Path
import joblib


# Anchor to project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "models"

_loaded_model_path = None

def debug_print_path(label, path):
    print(f"[DEBUG] {label}: {path.resolve() if hasattr(path, 'resolve') else path}")

def find_latest_model_file():
    """
    Finds the latest model file in the models folder.
    Returns the Path or None if not found.
    """
    print(f"Searching for models in: {MODELS_DIR}")
    best_model_files = list(MODELS_DIR.glob('best_wildlife_risk_model_*.pkl'))
    wildlife_model_files = list(MODELS_DIR.glob('wildlife_risk_model_*.pkl'))
    model_files = sorted(best_model_files + wildlife_model_files, reverse=True)
    print(f"[DEBUG] Found model_files: {model_files}")
    if not model_files:
        return None
    return model_files[0]

def load_latest_model():
    """
    Loads the latest best model using joblib. Handles missing model gracefully.
    """
    global _loaded_model_path

    model_path = find_latest_model_file()
    print(f"[DEBUG] Selected model_path: {model_path}")
    if not model_path or not model_path.exists():
        raise FileNotFoundError("No trained model found. Please train and compare models first.")
    try:
        _loaded_model_path = str(model_path)
        model = joblib.load(model_path)
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")


def get_loaded_model_path():
    """Return the last loaded model path, if available."""
    return _loaded_model_path


def get_loaded_model_version():
    """Return the last loaded model filename, if available."""
    if _loaded_model_path:
        return Path(_loaded_model_path).name
    return None
