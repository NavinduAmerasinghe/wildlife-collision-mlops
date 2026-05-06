"""
Silver pipeline runner for wildlife collision MLOps project.
"""
from datetime import datetime
import json
from pathlib import Path
from silver.process_wildlife import process_wildlife
from silver.process_weather import process_weather
from silver.process_road_context import process_road_context

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def generate_batch_id():
    """
    Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
    """
    return datetime.utcnow().strftime('%Y%m%dT%H%M%S')


def save_silver_metadata(batch_id, source_metadata, log_dir=None):
    """
    Saves Silver batch metadata as a JSON file.
    """
    if log_dir is None:
        log_dir = PROJECT_ROOT / "logs" / "silver_batches"
    created_at = datetime.utcnow().replace(microsecond=0).isoformat()
    metadata = {
        "batch_id": batch_id,
        "created_at": created_at,
        "sources": source_metadata
    }
    from pathlib import Path
    log_folder = Path(log_dir)
    log_folder.mkdir(parents=True, exist_ok=True)
    file_path = log_folder / f"silver_batch_{batch_id}.json"
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Saved Silver batch metadata to {file_path}")
    return str(file_path)


def main():
    print("\n=== Wildlife Collision Silver Pipeline ===\n")
    batch_id = generate_batch_id()
    print(f"[STEP] Generated Silver batch_id: {batch_id}")

    source_metadata = {}

    # Process wildlife incidents
    print("[STEP] Processing wildlife incidents...")
    wildlife_result = process_wildlife(batch_id, PROJECT_ROOT)
    source_metadata["wildlife_incidents"] = wildlife_result
    if wildlife_result["status"] == "success":
        print(f"[DEBUG] Wildlife silver row count: {wildlife_result['row_count']}")
    else:
        raise RuntimeError(
            f"Wildlife Silver processing failed with status '{wildlife_result['status']}'. "
            "Stopping Silver pipeline to prevent Gold from using stale Silver data."
        )

    # Process weather
    print("[STEP] Processing weather data...")
    weather_result = process_weather(batch_id, PROJECT_ROOT)
    source_metadata["weather"] = weather_result
    if weather_result["status"] == "success":
        print(f"[DEBUG] Weather silver row count: {weather_result['row_count']}")

    # Process road context
    print("[STEP] Processing road context data...")
    road_result = process_road_context(batch_id, PROJECT_ROOT)
    source_metadata["road_context"] = road_result
    if road_result["status"] == "success":
        print(f"[DEBUG] Road context silver row count: {road_result['row_count']}")

    # Save Silver batch metadata
    save_silver_metadata(batch_id, source_metadata)

    print("\n[COMPLETE] Silver pipeline finished.\n")


if __name__ == "__main__":
    main()
