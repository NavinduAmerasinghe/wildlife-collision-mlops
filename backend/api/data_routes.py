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
ACTIVE_WILDLIFE_DATASET = PROJECT_ROOT / "data" / "raw" / "wildlife_incidents.csv"

REQUIRED_COLUMNS = [
    "incident_id",
    "timestamp",
    "location",
    "species",
    "severity",
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
        # Store rejected upload metadata in MongoDB (non-blocking)
        try:
            collection = get_dataset_uploads_collection()
            if collection is not None:
                rejected_doc = {
                    "created_at": datetime.now(timezone.utc),
                    "dataset_type": "wildlife_incidents",
                    "original_filename": file.filename,
                    "saved_filename": None,
                    "file_path": None,
                    "row_count": len(df),
                    "missing_columns": missing,
                    "status": "rejected",
                }
                collection.insert_one(rejected_doc)
                print("[INFO] Stored rejected upload metadata in MongoDB")
            else:
                print("[WARNING] MongoDB unavailable, rejected upload metadata not stored")
        except Exception as e:
            print(f"[WARNING] Failed to store rejected upload metadata in MongoDB: {e}")

        print(f"[ERROR] Invalid wildlife dataset schema. Missing columns: {missing}")
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Invalid wildlife dataset schema",
                "missing_columns": missing,
            },
        )

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
    print(f"[INFO] Uploaded file saved to: {save_path}")

    # Update the active dataset used by the bronze pipeline
    file.file.seek(0)
    ACTIVE_WILDLIFE_DATASET.parent.mkdir(parents=True, exist_ok=True)
    with open(ACTIVE_WILDLIFE_DATASET, "wb") as active_file:
        shutil.copyfileobj(file.file, active_file)
    
    print(f"[DEBUG] File copied from upload buffer to: {ACTIVE_WILDLIFE_DATASET}")
    print(f"[DEBUG] Active file size: {ACTIVE_WILDLIFE_DATASET.stat().st_size} bytes")
    
    # Count rows from the active file
    active_df = pd.read_csv(ACTIVE_WILDLIFE_DATASET)
    active_row_count = len(active_df)
    print(f"[DEBUG] Verification: Active file row count: {active_row_count}")
    print(f"[INFO] Active wildlife dataset updated: {ACTIVE_WILDLIFE_DATASET}")
    print(f"[INFO] Active wildlife row count: {active_row_count}")
    
    # Verify file exists and is readable
    if not ACTIVE_WILDLIFE_DATASET.exists():
        raise HTTPException(status_code=500, detail="Failed to write active dataset file")
    if active_row_count == 0:
        print(f"[WARNING] Active dataset has 0 rows. File may be corrupted.")

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
        "message": "Uploaded dataset saved and activated for pipeline",
        "uploaded_file_path": str(save_path),
        "active_file_path": str(ACTIVE_WILDLIFE_DATASET),
        "row_count": active_row_count,
        "columns": list(active_df.columns),
    })
