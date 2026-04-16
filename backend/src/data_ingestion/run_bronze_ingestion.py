"""
Orchestrates Bronze-layer ingestion for wildlife, weather, and road context data.
"""
import os
from ingest_wildlife import ingest_wildlife_csv
from ingest_weather import ingest_weather
from ingest_road_context import ingest_road_context

def run_all_bronze_ingestions():
    # Wildlife incidents from local CSV
    wildlife_input = os.path.join('data', 'raw', 'wildlife_incidents.csv')
    wildlife_output = os.path.join('data', 'bronze', 'wildlife_bronze.csv')
    ingest_wildlife_csv(wildlife_input, wildlife_output)

    # Weather data (API placeholder)
    weather_output = os.path.join('data', 'bronze', 'weather_bronze.csv')
    ingest_weather(weather_output)

    # Road context data (API placeholder)
    road_context_output = os.path.join('data', 'bronze', 'road_context_bronze.csv')
    ingest_road_context(road_context_output)

if __name__ == "__main__":
    run_all_bronze_ingestions()
