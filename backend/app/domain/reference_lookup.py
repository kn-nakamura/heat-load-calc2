from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


class ReferenceRepository:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir

    def _read_json(self, filename: str) -> dict:
        path = self.base_dir / filename
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)

    @lru_cache(maxsize=1)
    def design_outdoor(self) -> dict:
        return self._read_json("design_outdoor_conditions.json")

    @lru_cache(maxsize=1)
    def etd(self) -> dict:
        return self._read_json("execution_temperature_difference.json")

    @lru_cache(maxsize=1)
    def solar(self) -> dict:
        return self._read_json("standard_solar_gain.json")

    @lru_cache(maxsize=1)
    def sash(self) -> dict:
        return self._read_json("aluminum_sash_infiltration.json")

    @lru_cache(maxsize=1)
    def others(self) -> dict:
        return self._read_json("others_tables.json")

    def lookup_outdoor(self, region: str) -> dict:
        records = self.design_outdoor().get("records", [])
        match = next((r for r in records if r.get("city") == region), None)
        return match or (records[0] if records else {})

    def lookup_etd(self, region: str, orientation: str, hour: str) -> float:
        region_map = self.etd().get("regions", {}).get(region, {})
        data = region_map.get(orientation) or region_map.get("N") or region_map.get("水平") or {}
        return float(data.get(str(hour), 0.0))

    def lookup_solar_gain(self, region: str, orientation: str, hour: str) -> float:
        region_map = self.solar().get("regions", {}).get(region, {})
        data = region_map.get(orientation) or region_map.get("N") or {}
        return float(data.get(str(hour), 0.0))

    def lookup_sash_infiltration(self, sash_type: str, airtightness: str, wind_speed_ms: float) -> float:
        records = self.sash().get("records", [])
        rec = next(
            (
                r
                for r in records
                if r.get("sash_type") == sash_type and str(r.get("airtightness", "")).upper() == str(airtightness).upper()
            ),
            None,
        )
        if not rec:
            return 0.0
        speeds = [2, 4, 6, 8, 10]
        nearest = min(speeds, key=lambda s: abs(s - float(wind_speed_ms)))
        return float(rec.get(str(nearest), 0.0))

    def lookup_orientation_factor_for_heating(self, orientation: str) -> float:
        table = self.others().get("heating_orientation_factors", {})
        return float(table.get(orientation, 1.0))


@lru_cache(maxsize=1)
def get_reference_repository() -> ReferenceRepository:
    base = Path(__file__).resolve().parents[2] / "reference_data"
    return ReferenceRepository(base)
