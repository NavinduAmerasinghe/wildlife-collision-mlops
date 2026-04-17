"""
Loads the latest best trained model for serving.
"""
from pathlib import Path
import joblib

def find_latest_best_model(model_folder='models'):
    """
    Finds the latest best model file in the given folder.
    Returns the Path or None if not found.
    """
    folder = Path(model_folder)
    model_files = sorted(folder.glob('best_wildlife_risk_model_*.pkl'), reverse=True)
    if not model_files:
        return None
    return model_files[0]

def load_latest_model():
    """
    Loads the latest best model using joblib. Handles missing model gracefully.
    """
    model_path = find_latest_best_model()
    if not model_path or not model_path.exists():
        raise FileNotFoundError("No trained model found. Please train and compare models first.")
    try:
        model = joblib.load(model_path)
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {e}")
