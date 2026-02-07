from __future__ import annotations

from app.domain.reference_lookup import ReferenceRepository
from app.domain.rounding import round_half_up
from app.models.schemas import CalcTrace, GlassSpec, LoadVector, Opening

_TIME_KEYS = ("9", "12", "14", "16")


def _opening_area(opening: Opening) -> float:
    if opening.area_m2 is not None:
        return opening.area_m2
    if opening.width_m is not None and opening.height_m is not None:
        return opening.width_m * opening.height_m
    return 0.0


def calc_opening_solar_gain(
    opening: Opening,
    glasses: dict[str, GlassSpec],
    references: ReferenceRepository,
    region: str,
) -> tuple[LoadVector, CalcTrace, str]:
    if opening.preset_load is not None:
        trace = CalcTrace(
            formula_id="solar.preset_override",
            entity_type="opening",
            entity_id=opening.id,
            mode="cooling",
            inputs={"preset": opening.preset_load.model_dump()},
            references={},
            intermediates={},
            output=opening.preset_load.model_dump(),
        )
        return opening.preset_load, trace, "external"

    area = _opening_area(opening)
    orientation = opening.orientation or "N"
    glass = glasses.get(opening.glass_id) if opening.glass_id else None
    glass_factor = 1.0
    if glass and glass.u_value_w_m2k is not None and glass.u_value_w_m2k > 0:
        glass_factor = min(1.0, 6.0 / glass.u_value_w_m2k)

    values: dict[str, float] = {}
    ref_src = "reference.solar"
    for t in _TIME_KEYS:
        if opening.solar_gain_override and t in opening.solar_gain_override:
            unit_gain = float(opening.solar_gain_override[t])
            ref_src = "override"
        else:
            unit_gain = references.lookup_solar_gain(region, orientation, t)
        gain = (
            area
            * unit_gain
            * opening.shading_sc
            * (opening.solar_area_ratio_pct / 100.0)
            * glass_factor
        )
        values[t] = round_half_up(gain, 0)

    load = LoadVector(
        cool_9=values["9"],
        cool_12=values["12"],
        cool_14=values["14"],
        cool_16=values["16"],
        cool_latent=0.0,
        heat_sensible=0.0,
        heat_latent=0.0,
    )

    trace = CalcTrace(
        formula_id="solar.opening_gain",
        entity_type="opening",
        entity_id=opening.id,
        mode="cooling",
        inputs={
            "area_m2": area,
            "orientation": orientation,
            "shading_sc": opening.shading_sc,
            "solar_area_ratio_pct": opening.solar_area_ratio_pct,
            "glass_factor": glass_factor,
        },
        references={"solar_table": "standard_solar_gain", "unit_gain_source": ref_src},
        intermediates={"unit_gains": values},
        output=load.model_dump(),
    )
    return load, trace, "external"
