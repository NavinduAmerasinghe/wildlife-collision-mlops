
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


    # Load road context data from CSV
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

    # Save road context if not empty
    def main():
        print("\n=== Wildlife Collision Bronze Ingestion Pipeline ===\n")
        batch_id = generate_batch_id()
        print(f"[STEP] Generated batch_id: {batch_id}")

        # Prepare per-source metadata
        source_metadata = {}

        # Wildlife Incidents
        print("[STEP] Loading wildlife incidents data...")
        try:
            wildlife_df = load_wildlife_incidents()
            if not wildlife_df.empty:
                file_path = save_to_bronze(wildlife_df, "wildlife_incidents", batch_id)
                row_count = len(wildlife_df)
                status = "success"
                print(f"[OK] Wildlife incidents: {row_count} rows saved to {file_path}")
            else:
                file_path = None
                row_count = 0
                status = "empty"
                print("[WARN] Wildlife incidents dataset is empty. Skipping save.")
        except Exception as e:
            file_path = None
            row_count = 0
            status = "error"
            print(f"[ERROR] Wildlife incidents ingestion failed: {e}")
        source_metadata["wildlife_incidents"] = {
            "status": status,
            "row_count": row_count,
            "file_path": file_path
        }

        # Weather Data
        print("[STEP] Loading weather data...")
        try:
            weather_df = load_weather_data()
            if not weather_df.empty:
                file_path = save_to_bronze(weather_df, "weather", batch_id)
                row_count = len(weather_df)
                status = "success"
                print(f"[OK] Weather: {row_count} rows saved to {file_path}")
            else:
                file_path = None
                row_count = 0
                status = "empty"
                print("[WARN] Weather data is empty. Skipping save.")
        except Exception as e:
            file_path = None
            row_count = 0
            status = "error"
            print(f"[ERROR] Weather ingestion failed: {e}")
        source_metadata["weather"] = {
            "status": status,
            "row_count": row_count,
            "file_path": file_path
        }

        # Road Context
        print("[STEP] Loading road context data...")
        try:
            road_df = load_road_context()
            if not road_df.empty:
                file_path = save_to_bronze(road_df, "road_context", batch_id)
                row_count = len(road_df)
                status = "success"
                print(f"[OK] Road context: {row_count} rows saved to {file_path}")
            else:
                file_path = None
                row_count = 0
                status = "empty"
                print("[WARN] Road context data is empty. Skipping save.")
        except Exception as e:
            file_path = None
            row_count = 0
            status = "error"
            print(f"[ERROR] Road context ingestion failed: {e}")
        source_metadata["road_context"] = {
            "status": status,
            "row_count": row_count,
            "file_path": file_path
        }

        # Save batch metadata
        save_batch_metadata(batch_id, source_metadata)

        print("\n[COMPLETE] Bronze ingestion pipeline finished.\n")

    # Entry point
    if __name__ == "__main__":
        main()
