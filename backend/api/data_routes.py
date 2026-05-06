"""
Data upload routes for wildlife-collision-mlops project.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
import shutil
from db.mongo_client import get_dataset_uploads_collection

router = APIRouter()

# Project root and upload directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_UPLOAD_DIR = PROJECT_ROOT / "data" / "raw" / "uploads"
RAW_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

REQUIRED_COLUMNS = [
    "incident_id",
    "timestamp",
    "latitude",
    "longitude",
    "species",
    "severity",
    "municipality",
    "source",
]

@router.post("/data/upload/wildlife")
async def upload_wildlife_incidents(file: UploadFile = File(...)):
    """
    Upload a wildlife incident CSV file to the raw data layer.
    Validates required columns and saves with a timestamped filename.
    """
    # 1. Only allow .csv files
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed.")

    # 2. Read uploaded CSV using pandas
    try:
        df = pd.read_csv(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    # 3. Validate required columns
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

    # 4. Save file with timestamped filename, do not overwrite
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    save_name = f"wildlife_incidents_{timestamp}.csv"
    save_path = RAW_UPLOAD_DIR / save_name
    if save_path.exists():
        raise HTTPException(status_code=409, detail="File already exists. Try again.")
    # Save uploaded file to disk
    file.file.seek(0)
    with open(save_path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)

    # 5. Store upload metadata in MongoDB (non-blocking)
    try:
        collection = get_dataset_uploads_collection()
        if collection is not None:
            upload_doc = {
                "created_at": datetime.now(timezone.utc),
                "dataset_type": "wildlife_incidents",
                "original_filename": file.filename,
                "saved_filename": save_name,
                "file_path": str(save_path),
                "row_count": len(df),
                "status": "uploaded"
            }
            collection.insert_one(upload_doc)
            print(f"[INFO] Stored upload metadata in MongoDB")
        else:
            print("[WARNING] MongoDB unavailable, upload metadata not stored")
    except Exception as e:
        print(f"[WARNING] Failed to store upload metadata in MongoDB: {e}")

    # 6. Return JSON response
    return JSONResponse({
        "status": "success",
        "message": "Wildlife dataset uploaded successfully",
        "file_path": str(save_path),
        "row_count": len(df),
        "columns": list(df.columns),
    })
