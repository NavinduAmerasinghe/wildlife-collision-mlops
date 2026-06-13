"""
Wildlife analytics endpoints for route prediction.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from gold.gold_utils import list_gold_batch_ids, load_gold_batch

from utils.station_location_mapper import (
    STATION_TO_WILDLIFE_LOCATION,
    normalize_text,
    resolve_wildlife_location_from_station_name,
)


router = APIRouter(prefix="/api/wildlife", tags=["wildlife"])

def read_latest_gold_dataset() -> Tuple[str, pd.DataFrame]:
    """Load the latest Gold Delta batch and return the batch id plus dataframe."""
    df, gold_path = load_gold_batch()
    if df is None:
        raise HTTPException(status_code=404, detail=f"No Gold Delta data found at {gold_path}.")
    batch_ids = list_gold_batch_ids()
    if not batch_ids:
        raise HTTPException(status_code=404, detail="No Gold Delta batches found.")
    return batch_ids[0], df


def load_matching_gold_dataset(from_location: str, to_location: str) -> Tuple[str, pd.DataFrame, pd.DataFrame]:
    """Load the newest Gold Delta batch that contains matching rows for the requested locations."""
    batch_ids = list_gold_batch_ids()
    if not batch_ids:
        raise HTTPException(status_code=404, detail="No Gold Delta batches found.")

    latest_batch_id: Optional[str] = None
    latest_df: Optional[pd.DataFrame] = None

    for index, batch_id in enumerate(batch_ids):
        df, _ = load_gold_batch(batch_id=batch_id)
        if df is None:
            continue

        if index == 0:
            latest_batch_id = batch_id
            latest_df = df

        matched = find_matching_rows(df, from_location, to_location)
        if not matched.empty:
            if index > 0 and latest_batch_id is not None:
                print(f"[INFO] Latest gold dataset {latest_batch_id} had no matches; using {batch_id} instead.")
            else:
                print(f"[INFO] Loaded gold dataset batch: {batch_id}")
            return batch_id, df, matched

    if latest_batch_id is None or latest_df is None:
        raise HTTPException(status_code=404, detail="No Gold Delta batches found.")

    print(f"[INFO] Loaded gold dataset batch: {latest_batch_id}")
    return latest_batch_id, latest_df, latest_df.iloc[0:0]


def pick_first_existing_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    for column_name in candidates:
        if column_name in df.columns:
            return column_name
    return None


def find_matching_rows(df: pd.DataFrame, from_location: str, to_location: str) -> pd.DataFrame:
    """Match rows by exact or partial case-insensitive location matching."""
    if "location" not in df.columns:
        return df.iloc[0:0]

    location_series = df["location"].fillna("").astype(str)
    normalized_location = location_series.str.casefold()
    from_query = normalize_text(from_location)
    to_query = normalize_text(to_location)

    exact_mask = normalized_location.eq(from_query) | normalized_location.eq(to_query)
    if exact_mask.any():
        return df[exact_mask].copy()

    partial_mask = normalized_location.str.contains(re.escape(from_query), na=False) | normalized_location.str.contains(re.escape(to_query), na=False)
    if partial_mask.any():
        return df[partial_mask].copy()

    return df.iloc[0:0]


def parse_timestamp_column(df: pd.DataFrame) -> pd.DataFrame:
    """Add parsed timestamp and hour columns when possible."""
    timestamp_column = pick_first_existing_column(df, ["timestamp", "timestamp_weather"])

    result = df.copy()
    if timestamp_column is None:
        if "hour" in result.columns:
            result["_hour"] = result["hour"].fillna("Unknown").astype(str)
        else:
            result["_hour"] = "Unknown"
        result["_parsed_timestamp"] = pd.NaT
        return result

    parsed = pd.to_datetime(result[timestamp_column], errors="coerce")
    result["_parsed_timestamp"] = parsed
    result["_hour"] = parsed.dt.strftime("%H:00").fillna("Unknown")
    return result


def is_rain_or_snow_condition(value: object) -> bool:
    text = normalize_text(value)
    return any(keyword in text for keyword in ["snow", "rain", "sleet", "storm", "fog", "mist", "ice", "frost"])


def calculate_risk_score(group: pd.DataFrame, incident_count: int, high_severity_count: int) -> int:
    score = incident_count * 20
    score += high_severity_count * 20

    if "visibility" in group.columns:
        visibility_series = pd.to_numeric(group["visibility"], errors="coerce")
        visibility_mean = visibility_series.mean() if not visibility_series.empty else None
        if visibility_mean is not None and pd.notna(visibility_mean) and float(visibility_mean) < 5:
            score += 15

    if "condition" in group.columns:
        if group["condition"].fillna("").map(is_rain_or_snow_condition).any():
            score += 10

    if "high_precipitation" in group.columns:
        high_precip_series = pd.to_numeric(group["high_precipitation"], errors="coerce").fillna(0)
        if (high_precip_series > 0).any():
            score += 10

    if "is_night" in group.columns:
        is_night_series = pd.to_numeric(group["is_night"], errors="coerce").fillna(0)
        if (is_night_series > 0).any():
            score += 10

    return min(100, int(score))


def build_timeline(df: pd.DataFrame) -> List[Dict[str, Any]]:
    timeline: List[Dict[str, Any]] = []
    for hour, group in df.groupby("_hour", dropna=False):
        incident_count = int(len(group))

        if "severity" in group.columns:
            severity_series = group["severity"].fillna("").astype(str).str.lower()
        else:
            severity_series = pd.Series([""] * len(group))
        high_severity_count = int(severity_series.str.contains("high", na=False).sum())

        visibility_value: Optional[float] = None
        if "visibility" in group.columns:
            visibility_series = pd.to_numeric(group["visibility"], errors="coerce")
            visibility_mean = visibility_series.mean() if not visibility_series.empty else None
            if visibility_mean is not None and pd.notna(visibility_mean):
                visibility_value = round(float(visibility_mean), 2)

        temperature_value: Optional[float] = None
        temperature_column = pick_first_existing_column(group, ["temperature", "temperature_weather"])
        if temperature_column is not None:
            temperature_series = pd.to_numeric(group[temperature_column], errors="coerce")
            temperature_mean = temperature_series.mean() if not temperature_series.empty else None
            if temperature_mean is not None and pd.notna(temperature_mean):
                temperature_value = round(float(temperature_mean), 2)

        risk_score = calculate_risk_score(group, incident_count, high_severity_count)

        timeline.append(
            {
                "hour": hour,
                "incident_count": incident_count,
                "high_severity_count": high_severity_count,
                "avg_visibility": visibility_value,
                "avg_temperature": temperature_value,
                "risk_score": risk_score,
            }
        )

    timeline.sort(key=lambda item: item["hour"])
    return timeline


def summarize_wildlife_details(
    df: pd.DataFrame,
    gold_dataset: str,
    from_location: Optional[str],
    to_location: Optional[str],
    from_station_name: Optional[str] = None,
    to_station_name: Optional[str] = None,
) -> Dict[str, Any]:
    if df.empty:
        return {
            "from_station_name": from_station_name,
            "to_station_name": to_station_name,
            "from_location": from_location,
            "to_location": to_location,
            "gold_dataset": gold_dataset,
            "total_incidents": 0,
            "animal_breakdown": {},
            "severity_breakdown": {},
            "timeline": [],
            "top_risk_hours": [],
            "message": "No matching wildlife incident records found for selected locations.",
        }

    parsed = parse_timestamp_column(df)
    total_incidents = int(len(parsed))

    animal_column = pick_first_existing_column(parsed, ["animal_type", "species"])
    animal_breakdown = (
        parsed[animal_column].fillna("unknown").astype(str).str.lower().value_counts().to_dict()
        if animal_column is not None
        else {}
    )

    severity_breakdown = (
        parsed["severity"].fillna("unknown").astype(str).str.lower().value_counts().to_dict()
        if "severity" in parsed.columns
        else {}
    )

    timeline = build_timeline(parsed)
    top_risk_hours = [item["hour"] for item in sorted(timeline, key=lambda item: item["risk_score"], reverse=True)[:3]]

    return {
        "from_station_name": from_station_name,
        "to_station_name": to_station_name,
        "from_location": from_location,
        "to_location": to_location,
        "gold_dataset": gold_dataset,
        "total_incidents": total_incidents,
        "animal_breakdown": animal_breakdown,
        "severity_breakdown": severity_breakdown,
        "timeline": timeline,
        "top_risk_hours": top_risk_hours,
        "message": "Wildlife collision details loaded successfully.",
    }


@router.get("/location-mapping")
async def location_mapping() -> Dict[str, Any]:
    """Inspect the station to wildlife location mapping."""
    return {
        "mapped_count": len(STATION_TO_WILDLIFE_LOCATION),
        "mappings": STATION_TO_WILDLIFE_LOCATION,
    }


@router.get("/locations")
async def list_wildlife_locations() -> Dict[str, Any]:
    """List the unique wildlife locations from the latest gold dataset."""
    gold_batch_id, df = read_latest_gold_dataset()
    if "location" in df.columns:
        locations = (
            df["location"]
            .dropna()
            .astype(str)
            .map(str.strip)
            .loc[lambda series: series != ""]
            .drop_duplicates()
            .tolist()
        )
    else:
        locations = []

    return {
        "gold_dataset": gold_batch_id,
        "total_rows": int(len(df)),
        "locations": sorted(locations),
    }


@router.get("/route-details-by-location")
async def route_details_by_location(
    from_location: str = Query(..., min_length=1),
    to_location: str = Query(..., min_length=1),
) -> Dict[str, Any]:
    """Return wildlife collision details using direct wildlife locations."""
    gold_batch_id, df, matched = load_matching_gold_dataset(from_location, to_location)
    if matched.empty:
        return {
            "from_location": from_location,
            "to_location": to_location,
            "gold_dataset": gold_batch_id,
            "total_incidents": 0,
            "animal_breakdown": {},
            "severity_breakdown": {},
            "timeline": [],
            "top_risk_hours": [],
            "message": "No matching wildlife incident records found for selected locations.",
        }

    return summarize_wildlife_details(
        matched,
        gold_dataset=gold_batch_id,
        from_location=from_location,
        to_location=to_location,
    )


@router.get("/route-details")
async def route_details(
    from_station_name: str = Query(..., min_length=1),
    to_station_name: str = Query(..., min_length=1),
) -> Dict[str, Any]:
    """Return wildlife collision details using Digitraffic station names."""
    from_location = resolve_wildlife_location_from_station_name(from_station_name)
    to_location = resolve_wildlife_location_from_station_name(to_station_name)

    if from_location is None or to_location is None:
        gold_batch_id, _ = read_latest_gold_dataset()
        return {
            "from_station_name": from_station_name,
            "to_station_name": to_station_name,
            "from_location": from_location,
            "to_location": to_location,
            "gold_dataset": gold_batch_id,
            "total_incidents": 0,
            "animal_breakdown": {},
            "severity_breakdown": {},
            "timeline": [],
            "top_risk_hours": [],
            "message": "Could not map one or both stations to wildlife locations.",
        }

    gold_batch_id, df, matched = load_matching_gold_dataset(from_location, to_location)
    if matched.empty:
        return {
            "from_station_name": from_station_name,
            "to_station_name": to_station_name,
            "from_location": from_location,
            "to_location": to_location,
            "gold_dataset": gold_batch_id,
            "total_incidents": 0,
            "animal_breakdown": {},
            "severity_breakdown": {},
            "timeline": [],
            "top_risk_hours": [],
            "message": "No matching wildlife incident records found for selected stations.",
        }

    return summarize_wildlife_details(
        matched,
        gold_dataset=gold_batch_id,
        from_location=from_location,
        to_location=to_location,
        from_station_name=from_station_name,
        to_station_name=to_station_name,
    )


@router.get("/route-wildlife-details")
async def route_wildlife_details(
    from_location: str = Query(..., min_length=1),
    to_location: str = Query(..., min_length=1),
) -> Dict[str, Any]:
    """Backward-compatible route details endpoint by direct wildlife locations."""
    return await route_details_by_location(from_location=from_location, to_location=to_location)
