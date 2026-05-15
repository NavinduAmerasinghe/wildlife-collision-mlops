"""
Client for Open-Meteo weather forecast API.
"""
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime


class OpenMeteoClient:
    """Client for fetching weather forecasts from Open-Meteo API."""
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    def __init__(self, timeout: int = 10):
        """Initialize client with optional timeout."""
        self.timeout = timeout
    
    async def fetch_forecast(
        self, 
        latitude: float, 
        longitude: float, 
        timezone: str = "auto",
        forecast_days: int = 1
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch weather forecast from Open-Meteo API.
        
        Args:
            latitude: Latitude coordinate.
            longitude: Longitude coordinate.
            timezone: Timezone (default: auto).
            forecast_days: Number of forecast days (default: 1).
        
        Returns:
            Forecast data or None if request fails.
        """
        try:
            params = {
                "latitude": latitude,
                "longitude": longitude,
                "hourly": "temperature_2m,precipitation",
                "timezone": timezone,
                "forecast_days": forecast_days,
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"[ERROR] Failed to fetch forecast from Open-Meteo: {e}")
            return None
    
    def extract_hourly_forecast(
        self, 
        forecast_data: Dict[str, Any], 
        max_records: int = 7
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Extract hourly forecast data from API response.
        
        Returns only the next max_records hourly records.
        
        Args:
            forecast_data: Raw forecast data from API.
            max_records: Maximum number of hourly records to return (default: 7).
        
        Returns:
            List of forecast items with time, temperature, precipitation.
        """
        try:
            hourly = forecast_data.get("hourly", {})
            times = hourly.get("time", [])
            temperatures = hourly.get("temperature_2m", [])
            precipitations = hourly.get("precipitation", [])
            
            forecast = []
            for i in range(min(max_records, len(times))):
                forecast.append({
                    "time": times[i],
                    "temperature": temperatures[i],
                    "precipitation": precipitations[i],
                })
            
            return forecast
        except Exception as e:
            print(f"[ERROR] Failed to extract hourly forecast: {e}")
            return None
    
    def format_forecast_response(
        self, 
        forecast_data: Dict[str, Any], 
        max_records: int = 7
    ) -> Optional[Dict[str, Any]]:
        """
        Format forecast data for API response.
        
        Args:
            forecast_data: Raw forecast data from API.
            max_records: Maximum number of hourly records to return.
        
        Returns:
            Formatted forecast response.
        """
        try:
            hourly_forecast = self.extract_hourly_forecast(forecast_data, max_records)
            
            return {
                "latitude": forecast_data.get("latitude"),
                "longitude": forecast_data.get("longitude"),
                "timezone": forecast_data.get("timezone"),
                "forecast": hourly_forecast,
            }
        except Exception as e:
            print(f"[ERROR] Failed to format forecast response: {e}")
            return None
