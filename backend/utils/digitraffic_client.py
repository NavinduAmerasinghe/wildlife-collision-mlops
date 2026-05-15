"""
Client for Digitraffic weather stations API.
"""
import httpx
from typing import List, Dict, Any, Optional


class DigitrafficClient:
    """Client for fetching weather stations from Digitraffic API."""
    
    BASE_URL = "https://tie.digitraffic.fi/api/weather/v1"
    STATIONS_ENDPOINT = "/stations"
    
    def __init__(self, timeout: int = 10):
        """Initialize client with optional timeout."""
        self.timeout = timeout
    
    async def fetch_stations(self) -> Optional[List[Dict[str, Any]]]:
        """
        Fetch all weather stations from Digitraffic API.
        
        Returns:
            List of station data or None if request fails.
            Each station contains: properties (id, name) and geometry (coordinates).
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.BASE_URL}{self.STATIONS_ENDPOINT}")
                response.raise_for_status()
                data = response.json()
                return data.get("features", [])
        except Exception as e:
            print(f"[ERROR] Failed to fetch weather stations from Digitraffic: {e}")
            return None
    
    def find_station_by_id(self, stations: List[Dict[str, Any]], station_id: int) -> Optional[Dict[str, Any]]:
        """
        Find a station by its ID.
        
        Args:
            stations: List of station features.
            station_id: Station ID to find.
        
        Returns:
            Station data or None if not found.
        """
        for station in stations:
            props = station.get("properties", {})
            if props.get("id") == station_id:
                return station
        return None
    
    def extract_coordinates(self, station: Dict[str, Any]) -> Optional[tuple]:
        """
        Extract latitude and longitude from station geometry.
        
        Digitraffic returns coordinates as [longitude, latitude, elevation].
        
        Args:
            station: Station feature data.
        
        Returns:
            Tuple of (latitude, longitude) or None if not found.
        """
        try:
            coords = station.get("geometry", {}).get("coordinates", [])
            if len(coords) >= 2:
                longitude, latitude = coords[0], coords[1]
                return (latitude, longitude)
        except Exception as e:
            print(f"[ERROR] Failed to extract coordinates: {e}")
        return None
    
    def get_station_info(self, station: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract useful station information.
        
        Args:
            station: Station feature data.
        
        Returns:
            Dictionary with id, name, latitude, longitude, elevation.
        """
        try:
            props = station.get("properties", {})
            coords = station.get("geometry", {}).get("coordinates", [])
            
            return {
                "id": props.get("id"),
                "name": props.get("name"),
                "latitude": coords[1] if len(coords) >= 2 else None,
                "longitude": coords[0] if len(coords) >= 1 else None,
                "elevation": coords[2] if len(coords) >= 3 else None,
            }
        except Exception as e:
            print(f"[ERROR] Failed to extract station info: {e}")
        return None
