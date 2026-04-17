"""
FastAPI app for wildlife collision risk prediction.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.model_loader import load_latest_model
from api.schemas import PredictionRequest, PredictionResponse
from api.dashboard_routes import router as dashboard_router
import pandas as pd
import numpy as np



app = FastAPI(title="Wildlife Collision Risk Prediction API")

# Enable CORS for local React frontend during development
# This allows the frontend running on Vite (localhost:5173 or 127.0.0.1:5173) to call the API without CORS errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include dashboard routes for project metadata endpoints
app.include_router(dashboard_router)

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
        return PredictionResponse(predicted_class=int(pred), risk_label=risk_label, probability=proba)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
