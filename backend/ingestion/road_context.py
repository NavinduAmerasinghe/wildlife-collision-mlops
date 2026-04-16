"""
Mock road context data ingestion for Bronze layer.
"""
import pandas as pd

def load_road_context():
	"""
	Returns a mock pandas DataFrame for road context data.
	"""
	data = [
		{"road_segment_id": 101, "location": "Helsinki", "speed_limit": 50, "road_type": "urban", "curvature": "straight"},
		{"road_segment_id": 202, "location": "Tampere", "speed_limit": 80, "road_type": "rural", "curvature": "curved"},
		{"road_segment_id": 303, "location": "Oulu", "speed_limit": 60, "road_type": "urban", "curvature": "slight"},
	]
	df = pd.DataFrame(data)
	print(f"[INFO] Created mock road context data: {len(df)} rows.")
	return df
