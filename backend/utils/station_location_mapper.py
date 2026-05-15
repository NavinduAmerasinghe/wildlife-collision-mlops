"""
Station to wildlife location mapping helpers.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Dict, Optional


STATION_TO_WILDLIFE_LOCATION: Dict[str, str] = {
    "Åland_Eckerö": "Åland_Eckerö",
    "Åland_Åva_K": "Åland_Åva_K",
    "vt1_Espoo_Nupuri": "Espoo",
    "kt51_Hki_Lapinlahti": "Helsinki",
    "vt3_Tampere_Lakalaiva": "Tampere",
    "vt3_Nokia_Kutala": "Nokia",
    "vt9_Kangasala": "Kangasala",
    "vt9_Orivesi": "Orivesi",
}


def normalize_text(value: object) -> str:
    """Normalize text for flexible matching while keeping Finnish characters."""
    if value is None:
        return ""

    text = unicodedata.normalize("NFC", str(value))
    text = text.casefold().strip()
    text = text.replace("_", " ")
    text = re.sub(r"\s+", " ", text)
    return text


def resolve_wildlife_location_from_station_name(station_name: object) -> Optional[str]:
    """
    Resolve a Digitraffic station name to a wildlife analytics location.

    Matching strategy:
    1. Exact key match, with normalization.
    2. City/location name appears inside the station name.
    3. Return None if nothing matches.
    """
    normalized_station = normalize_text(station_name)
    if not normalized_station:
        return None

    # Exact station key match first.
    for key, location in STATION_TO_WILDLIFE_LOCATION.items():
        if normalize_text(key) == normalized_station:
            return location

    # Then try whether the mapped wildlife location appears in the station name.
    for key, location in STATION_TO_WILDLIFE_LOCATION.items():
        normalized_location = normalize_text(location)
        normalized_key = normalize_text(key)
        if normalized_location and normalized_location in normalized_station:
            return location
        if normalized_key and normalized_key in normalized_station:
            return location

    return None
