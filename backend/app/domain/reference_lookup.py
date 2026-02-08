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
    def design_indoor(self) -> dict:
        return self._read_json("design_indoor_conditions.json")

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
    def region_coordinates(self) -> dict:
        try:
            return self._read_json("region_coordinates.json")
        except FileNotFoundError:
            return self._read_json("location_data.json")

    @lru_cache(maxsize=1)
    def others(self) -> dict:
        return self._read_json("others_tables.json")

    @lru_cache(maxsize=1)
    def glass_properties(self) -> dict:
        return self._read_json("glass_properties_sc_u_value.json")

    @lru_cache(maxsize=1)
    def glass_sunlit_area_ratio(self) -> dict:
        return self._read_json("glass_sunlit_area_ratio_numbers.json")

    @lru_cache(maxsize=1)
    def lighting_power_density(self) -> dict:
        return self._read_json("lighting_power_density.json")

    @lru_cache(maxsize=1)
    def occupancy_density(self) -> dict:
        return self._read_json("occupancy_density_and_heat_gain.json")

    @lru_cache(maxsize=1)
    def material_thermal_constants(self) -> dict:
        return self._read_json("material_thermal_constants.json")

    @lru_cache(maxsize=1)
    def heating_ground_temperature(self) -> dict:
        return self._read_json("heating_ground_temperature.json")

    @lru_cache(maxsize=1)
    def heating_orientation_factors(self) -> dict:
        return self._read_json("heating_orientation_factors.json")

    @lru_cache(maxsize=1)
    def location_data(self) -> dict:
        return self._read_json("location_data.json")

    @lru_cache(maxsize=1)
    def location_data_regions(self) -> dict:
        return self._read_json("location_data_regions.json")

    def lookup_outdoor(self, region: str) -> dict:
        records = self.design_outdoor().get("records", [])
        match = next((r for r in records if r.get("city") == region), None)
        return match or (records[0] if records else {})

    def lookup_etd(self, region: str, orientation: str, hour: str, wall_type: str = "Ⅰ", indoor_temp: str = "28") -> float:
        region_data = self.etd().get("regions", {}).get(region, {})
        temp_data = region_data.get(indoor_temp, {})
        wall_data = temp_data.get(wall_type, {})
        # Check directional data first
        dir_data = wall_data.get("方位別", {}).get(orientation, {})
        if dir_data:
            return float(dir_data.get(str(hour), 0.0))
        # Check shadow
        if orientation == "日陰":
            shadow_data = wall_data.get("日陰", {})
            return float(shadow_data.get(str(hour), 0.0))
        # Check horizontal
        if orientation == "水平":
            horiz_data = wall_data.get("水平", {})
            return float(horiz_data.get(str(hour), 0.0))
        return 0.0

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
        data = self.heating_orientation_factors()
        records = data.get("records", [])
        for rec in records:
            if rec.get("direction") == orientation:
                return float(rec.get("factor", 1.0))
        # Fallback to others_tables
        table = self.others().get("heating_orientation_factors", {})
        return float(table.get(orientation, 1.0))

    def lookup_nearest_region(self, lat: float, lon: float, tag: str | None = None) -> dict:
        records = self.region_coordinates().get("records", [])
        if tag:
            records = [r for r in records if tag in r.get("tags", [])]
        if not records:
            return {}

        def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
            from math import asin, cos, radians, sin, sqrt

            radius_km = 6371.0
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            lat1_rad = radians(lat1)
            lat2_rad = radians(lat2)
            a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
            c = 2 * asin(sqrt(a))
            return radius_km * c

        nearest = min(
            records,
            key=lambda r: haversine_km(lat, lon, float(r.get("lat", 0.0)), float(r.get("lon", 0.0))),
        )
        distance_km = haversine_km(lat, lon, float(nearest.get("lat", 0.0)), float(nearest.get("lon", 0.0)))
        return {**nearest, "distance_km": distance_km}


@lru_cache(maxsize=1)
def get_reference_repository() -> ReferenceRepository:
    base = Path(__file__).resolve().parents[2] / "reference_data"
    return ReferenceRepository(base)
