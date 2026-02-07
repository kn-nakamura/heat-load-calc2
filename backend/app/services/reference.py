from __future__ import annotations

from app.domain.reference_lookup import get_reference_repository


def get_reference_table(table_name: str) -> dict:
    repo = get_reference_repository()
    if table_name == "design_outdoor_conditions":
        return repo.design_outdoor()
    if table_name == "execution_temperature_difference":
        return repo.etd()
    if table_name == "standard_solar_gain":
        return repo.solar()
    if table_name == "aluminum_sash_infiltration":
        return repo.sash()
    if table_name == "others_tables":
        return repo.others()
    raise KeyError(f"Unsupported table_name: {table_name}")
