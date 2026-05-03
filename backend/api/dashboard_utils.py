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
    print(f"[DEBUG] Searching for latest JSON in: {folder.resolve() if hasattr(folder, 'resolve') else folder}")
    if not folder.exists() or not folder.is_dir():
        print(f"[DEBUG] Folder does not exist or is not a directory: {folder}")
        return None
    json_files = list(folder.glob("*.json"))
    print(f"[DEBUG] Found JSON files: {json_files}")
    if not json_files:
        print(f"[DEBUG] No JSON files found in: {folder}")
        return None
    latest = max(json_files, key=lambda f: f.stat().st_mtime)
    print(f"[DEBUG] Latest JSON file: {latest}")
    return latest

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
