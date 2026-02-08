from __future__ import annotations

from app.domain.reference_lookup import get_reference_repository


def _with_solar_position(data: dict) -> dict:
    regions = data.get("regions", {})
    solar_position = {}
    for region, entries in regions.items():
        if not isinstance(entries, dict):
            continue
        altitude = entries.get("_solar_altitude_deg")
        azimuth = entries.get("_solar_azimuth_deg")
        if altitude is None and azimuth is None:
            continue
        solar_position[region] = {
            "solar_altitude_deg": altitude or {},
            "solar_azimuth_deg": azimuth or {},
        }
    if not solar_position:
        return data
    return {**data, "solar_position": solar_position}


def get_reference_table(table_name: str) -> dict:
    repo = get_reference_repository()
    table_map = {
        "design_outdoor_conditions": repo.design_outdoor,
        "design_indoor_conditions": repo.design_indoor,
        "execution_temperature_difference": repo.etd,
        "standard_solar_gain": repo.solar,
        "region_coordinates": repo.region_coordinates,
        "aluminum_sash_infiltration": repo.sash,
        "others_tables": repo.others,
        "glass_properties": repo.glass_properties,
        "glass_sunlit_area_ratio": repo.glass_sunlit_area_ratio,
        "lighting_power_density": repo.lighting_power_density,
        "occupancy_density": repo.occupancy_density,
        "material_thermal_constants": repo.material_thermal_constants,
        "heating_ground_temperature": repo.heating_ground_temperature,
        "heating_orientation_factors": repo.heating_orientation_factors,
        "location_data": repo.location_data,
        "location_data_regions": repo.location_data_regions,
    }
    loader = table_map.get(table_name)
    if loader is None:
        raise KeyError(f"Unsupported table_name: {table_name}")
    data = loader()
    if table_name == "standard_solar_gain":
        return _with_solar_position(data)
    return data


def get_nearest_region(lat: float, lon: float, tag: str | None = None) -> dict:
    repo = get_reference_repository()
    return repo.lookup_nearest_region(lat, lon, tag)
