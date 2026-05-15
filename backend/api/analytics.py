"""
Analytics routes for weather stations and forecasts.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any

from utils.digitraffic_client import DigitrafficClient
from utils.open_meteo_client import OpenMeteoClient


router = APIRouter(prefix="/api/analytics", tags=["analytics"])
digitraffic = DigitrafficClient()
open_meteo = OpenMeteoClient()


@router.get("/stations")
async def get_stations():
    """
    Fetch all weather stations from Digitraffic API.
    
    Returns GeoJSON FeatureCollection with station data.
    """
    stations_data = await digitraffic.fetch_stations()
    
    if stations_data is None:
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch weather stations from Digitraffic API"
        )
    
    # Return as GeoJSON FeatureCollection for frontend compatibility
    return {"features": stations_data}


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
) -> List[Dict[str, Any]]:
    """
    Fetch weather forecast for given coordinates from Open-Meteo API.
    
    Returns the next 7 hourly forecast records.
    Frontend expects array of objects with: time, tempC, precipMm
    
    Args:
        lat: Latitude coordinate.
        lon: Longitude coordinate.
    """
    if lat < -90 or lat > 90:
        raise HTTPException(status_code=400, detail="Invalid latitude: must be between -90 and 90")
    if lon < -180 or lon > 180:
        raise HTTPException(status_code=400, detail="Invalid longitude: must be between -180 and 180")
    
    forecast_data = await open_meteo.fetch_forecast(
        latitude=lat,
        longitude=lon,
        timezone="auto",
        forecast_days=1,
    )
    
    if forecast_data is None:
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch forecast from Open-Meteo API"
        )
    
    # Extract and transform forecast to match frontend expectations
    try:
        hourly = forecast_data.get("hourly", {})
        times = hourly.get("time", [])
        temperatures = hourly.get("temperature_2m", [])
        precipitations = hourly.get("precipitation", [])
        
        forecast = []
        for i in range(min(7, len(times))):
            forecast.append({
                "time": times[i],
                "tempC": temperatures[i],
                "precipMm": precipitations[i],
            })
        
        return forecast
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to format forecast: {e}"
        )


@router.get("/stations/{station_id}/forecast")
async def get_station_forecast(station_id: int) -> List[Dict[str, Any]]:
    """
    Fetch weather forecast for a specific weather station.
    
    Fetches all stations from Digitraffic, finds the station by ID,
    and returns the forecast for that station's coordinates.
    
    Args:
        station_id: The ID of the weather station.
    """
    # Fetch all stations
    stations_data = await digitraffic.fetch_stations()
    
    if stations_data is None:
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch weather stations from Digitraffic API"
        )
    
    # Find the requested station
    station = digitraffic.find_station_by_id(stations_data, station_id)
    
    if station is None:
        raise HTTPException(
            status_code=404,
            detail=f"Weather station with ID {station_id} not found"
        )
    
    # Extract coordinates
    coords = digitraffic.extract_coordinates(station)
    
    if coords is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to extract coordinates from station data"
        )
    
    latitude, longitude = coords
    
    # Fetch forecast for those coordinates
    forecast_data = await open_meteo.fetch_forecast(
        latitude=latitude,
        longitude=longitude,
        timezone="auto",
        forecast_days=1,
    )
    
    if forecast_data is None:
        raise HTTPException(
            status_code=503,
            detail="Failed to fetch forecast from Open-Meteo API"
        )
    
    # Extract and transform forecast
    try:
        hourly = forecast_data.get("hourly", {})
        times = hourly.get("time", [])
        temperatures = hourly.get("temperature_2m", [])
        precipitations = hourly.get("precipitation", [])
        
        forecast = []
        for i in range(min(7, len(times))):
            forecast.append({
                "time": times[i],
                "tempC": temperatures[i],
                "precipMm": precipitations[i],
            })
        
        return forecast
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to format forecast: {e}"
        )
