"""
FastAPI app for wildlife collision risk prediction.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from bson import ObjectId

from api.model_loader import load_latest_model, get_loaded_model_version
from api.schemas import PredictionRequest, PredictionResponse
from api.dashboard_routes import router as dashboard_router
from api.data_routes import router as data_router
from api.pipeline_routes import router as pipeline_router
from api.analytics import router as analytics_router
from api.wildlife_risk import router as wildlife_risk_router
from db.mongo_client import get_prediction_collection, get_dataset_uploads_collection, get_pipeline_runs_collection, get_model_comparisons_collection
import pandas as pd
import numpy as np



app = FastAPI(title="Wildlife Collision Risk Prediction API")

# Enable CORS for local React frontend during development
# This allows the frontend running on Vite (localhost:5173 or 127.0.0.1:5173) to call the API without CORS errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include dashboard routes for project metadata endpoints
app.include_router(dashboard_router)

# Include data upload routes
app.include_router(data_router)
# Include pipeline orchestration routes
app.include_router(pipeline_router)

# Include analytics routes for weather stations and forecasts
app.include_router(analytics_router)

# Include wildlife collision risk routes
app.include_router(wildlife_risk_router)

# Load the model once at startup
try:
    model = load_latest_model()
except Exception as e:
    model = None
    model_load_error = str(e)
else:
    model_load_error = None

@app.get("/health")
def health():
    return {"status": "ok", "message": "API is running."}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail=f"Model not available: {model_load_error}")
    # Convert input to DataFrame
    input_df = pd.DataFrame([request.dict()])
    # Predict
    try:
        pred = model.predict(input_df)[0]
        # Probability if available
        if hasattr(model, "predict_proba"):
            proba = float(model.predict_proba(input_df)[0][1])
        else:
            proba = None
        risk_label = "high_risk" if pred == 1 else "low_risk"
        response = PredictionResponse(predicted_class=int(pred), risk_label=risk_label, probability=proba)
        model_version = get_loaded_model_version() or "unknown"
        print(f"[INFO] Prediction using model version: {model_version}")
        
        # Store prediction in MongoDB (non-blocking)
        try:
            collection = get_prediction_collection()
            if collection is not None:
                prediction_doc = {
                    "created_at": datetime.now(timezone.utc),
                    "request": request.dict(),
                    "response": {
                        "predicted_class": int(pred),
                        "risk_label": risk_label,
                        "probability": proba
                    },
                    "model_version": model_version
                }
                collection.insert_one(prediction_doc)
                print(f"[INFO] Stored prediction in MongoDB")
            else:
                print("[WARNING] MongoDB unavailable, prediction not stored")
        except Exception as e:
            print(f"[WARNING] Failed to store prediction in MongoDB: {e}")
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")


@app.get("/predictions/history")
def get_prediction_history(limit: int = 20):
    """
    Retrieve the latest prediction records from MongoDB.
    Returns up to `limit` predictions sorted by created_at descending.
    """
    try:
        collection = get_prediction_collection()
        if collection is None:
            raise HTTPException(status_code=503, detail="MongoDB unavailable")
        
        # Find latest predictions, sorted by created_at descending
        predictions = list(collection.find().sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for pred in predictions:
            pred["_id"] = str(pred["_id"])
        
        return {"predictions": predictions, "count": len(predictions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve prediction history: {e}")


@app.get("/data/uploads/history")
def get_dataset_uploads_history(limit: int = 20):
    """
    Retrieve the latest dataset upload records from MongoDB.
    Returns up to `limit` uploads sorted by created_at descending.
    """
    try:
        collection = get_dataset_uploads_collection()
        if collection is None:
            raise HTTPException(status_code=503, detail="MongoDB unavailable")
        
        # Find latest uploads, sorted by created_at descending
        uploads = list(collection.find().sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for upload in uploads:
            upload["_id"] = str(upload["_id"])
        
        return {"uploads": uploads, "count": len(uploads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve upload history: {e}")


@app.get("/pipeline/runs")
def get_pipeline_runs(limit: int = 20):
    """
    Retrieve the latest pipeline run records from MongoDB.
    Returns up to `limit` pipeline runs sorted by created_at descending.
    """
    try:
        collection = get_pipeline_runs_collection()
        if collection is None:
            raise HTTPException(status_code=503, detail="MongoDB unavailable")
        
        # Find latest pipeline runs, sorted by created_at descending
        runs = list(collection.find().sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for run in runs:
            run["_id"] = str(run["_id"])
        
        return {"pipeline_runs": runs, "count": len(runs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve pipeline runs: {e}")


@app.get("/models/comparisons/history")
def get_model_comparisons_history(limit: int = 20):
    """
    Retrieve the latest model comparison records from MongoDB.
    Returns up to `limit` model comparisons sorted by created_at descending.
    """
    try:
        collection = get_model_comparisons_collection()
        if collection is None:
            raise HTTPException(status_code=503, detail="MongoDB unavailable")
        
        # Find latest model comparisons, sorted by created_at descending
        comparisons = list(collection.find().sort("created_at", -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for comparison in comparisons:
            comparison["_id"] = str(comparison["_id"])
        
        return {"model_comparisons": comparisons, "count": len(comparisons)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve model comparisons: {e}")



