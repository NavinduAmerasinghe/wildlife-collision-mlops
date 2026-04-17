"""
Pydantic schemas for prediction API.
"""
from pydantic import BaseModel
from typing import Optional

class PredictionRequest(BaseModel):
    temperature: float
    precipitation: float
    wind_speed: float
    visibility: float
    speed_limit: float
    hour: int
    month: int
    is_night: int
    is_weekend: int
    high_precipitation: int

class PredictionResponse(BaseModel):
    predicted_class: int
    risk_label: str
    probability: Optional[float] = None
