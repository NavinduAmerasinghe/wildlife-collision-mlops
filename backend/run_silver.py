"""
Silver pipeline runner for wildlife collision MLOps project.
"""
from datetime import datetime
import json
from silver.process_wildlife import process_wildlife
from silver.process_weather import process_weather
from silver.process_road_context import process_road_context


def generate_batch_id():
    """
    Generates a batch_id using current datetime in format YYYYMMDDTHHMMSS.
    """
    return datetime.utcnow().strftime('%Y%m%dT%H%M%S')


def save_silver_metadata(batch_id, source_metadata, log_dir='logs/silver_batches'):
    """
    Saves Silver batch metadata as a JSON file.
    """
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
    source_metadata["wildlife_incidents"] = process_wildlife(batch_id)

    # Process weather
    print("[STEP] Processing weather data...")
    source_metadata["weather"] = process_weather(batch_id)

    # Process road context
    print("[STEP] Processing road context data...")
    source_metadata["road_context"] = process_road_context(batch_id)

    # Save Silver batch metadata
    save_silver_metadata(batch_id, source_metadata)

    print("\n[COMPLETE] Silver pipeline finished.\n")


if __name__ == "__main__":
    main()
