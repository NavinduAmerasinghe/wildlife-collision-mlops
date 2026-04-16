
# Bronze ingestion MVP runner for wildlife-collision-mlops
from ingestion.wildlife_incidents import load_wildlife_incidents
from ingestion.weather_data import load_weather_data
from ingestion.road_context import load_road_context
from ingestion.save_utils import save_to_bronze
from ingestion.batch_metadata import generate_batch_id, save_batch_metadata

def main():
    print("\n=== Wildlife Collision Bronze Ingestion Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated batch_id: {batch_id}")

    # Load wildlife incidents from CSV
    wildlife_df = load_wildlife_incidents()

    # Load weather data from CSV
    weather_df = load_weather_data()

    # Load road context data (still mock)
    road_df = load_road_context()

    # Prepare tracking dicts
    file_paths = {}
    row_counts = {}
    sources = ["wildlife_incidents", "weather_data", "road_context"]

    # Save wildlife incidents if not empty
    if not wildlife_df.empty:
        file_paths["wildlife_incidents"] = save_to_bronze(wildlife_df, "wildlife_incidents", batch_id)
        row_counts["wildlife_incidents"] = len(wildlife_df)
    else:
        print("[WARN] Wildlife incidents dataset is empty. Skipping save.")
        file_paths["wildlife_incidents"] = None
        row_counts["wildlife_incidents"] = 0

    # Save weather data if not empty
    if not weather_df.empty:
        file_paths["weather_data"] = save_to_bronze(weather_df, "weather_data", batch_id)
        row_counts["weather_data"] = len(weather_df)
    else:
        print("[WARN] Weather data is empty. Skipping save.")
        file_paths["weather_data"] = None
        row_counts["weather_data"] = 0

    # Save road context (always present for now)
    file_paths["road_context"] = save_to_bronze(road_df, "road_context", batch_id)
    row_counts["road_context"] = len(road_df)

    # Save batch metadata
    save_batch_metadata(batch_id, sources, file_paths, row_counts)

    print("\n[COMPLETE] Bronze ingestion pipeline finished.\n")

# Entry point
if __name__ == "__main__":
    main()
