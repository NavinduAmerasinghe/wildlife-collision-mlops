"""
Utility functions for dashboard endpoints.
"""
from pathlib import Path
import json
from typing import Optional, Any

def find_latest_json_file(folder: Path) -> Optional[Path]:
    """
    Find the latest JSON file in the given folder by modified time.
    Returns None if no file found.
    """
    if not folder.exists() or not folder.is_dir():
        return None
    json_files = list(folder.glob("*.json"))
    if not json_files:
        return None
    return max(json_files, key=lambda f: f.stat().st_mtime)

def load_json_file(path: Optional[Path]) -> Optional[Any]:
    """
    Load JSON from a file. Returns None if path is None or file is missing/invalid.
    """
    if path is None or not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None
