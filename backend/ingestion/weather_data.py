"""
Mock weather data ingestion for Bronze layer.
"""
import pandas as pd
from datetime import datetime

def load_weather_data():
	"""
	Returns a mock pandas DataFrame for weather data.
	"""
	data = [
		{"timestamp": datetime(2026, 4, 16, 8, 0), "location": "Helsinki", "temperature": 5.2, "precipitation": 0.0, "wind_speed": 3.1},
		{"timestamp": datetime(2026, 4, 16, 9, 0), "location": "Tampere", "temperature": 4.8, "precipitation": 0.2, "wind_speed": 2.7},
		{"timestamp": datetime(2026, 4, 16, 10, 0), "location": "Oulu", "temperature": 2.1, "precipitation": 0.0, "wind_speed": 4.0},
	]
	df = pd.DataFrame(data)
	print(f"[INFO] Created mock weather data: {len(df)} rows.")
	return df
