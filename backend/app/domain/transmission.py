from __future__ import annotations

from app.domain.reference_lookup import ReferenceRepository
from app.domain.rounding import round_half_up
from app.models.schemas import CalcTrace, ConstructionAssembly, DesignCondition, LoadVector, Room, Surface

_TIME_KEYS = ("9", "12", "14", "16")


def _surface_area(surface: Surface) -> float:
    if surface.area_m2 is not None:
        return surface.area_m2
    if surface.width_m is not None and surface.height_m is not None:
        return surface.width_m * surface.height_m
    return 0.0


def _u_value(surface: Surface, constructions: dict[str, ConstructionAssembly]) -> float:
    if surface.construction_id and surface.construction_id in constructions:
        return constructions[surface.construction_id].u_value_w_m2k
    return 1.0


def calc_surface_load(
    surface: Surface,
    room: Room,
    summer_condition: DesignCondition | None,
    winter_condition: DesignCondition | None,
    constructions: dict[str, ConstructionAssembly],
    references: ReferenceRepository,
    region: str,
    outdoor: dict,
) -> tuple[LoadVector, CalcTrace, str]:
    if surface.preset_load is not None:
        trace = CalcTrace(
            formula_id="transmission.preset_override",
            entity_type="surface",
            entity_id=surface.id,
            mode="both",
            inputs={"preset": surface.preset_load.model_dump()},
            references={},
            intermediates={},
            output=surface.preset_load.model_dump(),
        )
        group = "external" if surface.adjacent_type in {"outdoor", "external", "ground"} else "internal"
        return surface.preset_load, trace, group

    area = _surface_area(surface)
    u_val = _u_value(surface, constructions)
    orientation = surface.orientation or "N"

    values = {}
    ref_src = "reference.etd"
    for t in _TIME_KEYS:
        if surface.temperature_difference_override and t in surface.temperature_difference_override:
            delta = surface.temperature_difference_override[t]
            ref_src = "override"
        else:
            delta = references.lookup_etd(region, orientation, t)
        values[t] = round_half_up(area * u_val * delta * surface.intermittent_factor, 0)

    indoor_winter = winter_condition.indoor_temp_c if winter_condition else 20.0
    outdoor_winter = float(outdoor.get("heating_drybulb_c", 0.0))
    heating_delta = (
        surface.heating_delta_override
        if surface.heating_delta_override is not None
        else max(indoor_winter - outdoor_winter, 0.0)
    )
    heating_factor = references.lookup_orientation_factor_for_heating(orientation)
    heat_sensible = round_half_up(area * u_val * heating_delta * heating_factor, 0)

    load = LoadVector(
        cool_9=values["9"],
        cool_12=values["12"],
        cool_14=values["14"],
        cool_16=values["16"],
        cool_latent=0.0,
        heat_sensible=heat_sensible,
        heat_latent=0.0,
    )

    trace = CalcTrace(
        formula_id="transmission.surface_conduction",
        entity_type="surface",
        entity_id=surface.id,
        mode="both",
        inputs={
            "area_m2": area,
            "u_value_w_m2k": u_val,
            "orientation": orientation,
            "intermittent_factor": surface.intermittent_factor,
            "indoor_winter_c": indoor_winter,
            "outdoor_winter_c": outdoor_winter,
        },
        references={
            "etd_table": "execution_temperature_difference",
            "orientation_factor": "others_tables.heating_orientation_factors",
            "delta_source": ref_src,
        },
        intermediates={
            "delta_t_cooling": values,
            "heating_delta": heating_delta,
            "heating_factor": heating_factor,
        },
        output=load.model_dump(),
    )

    group = "external" if surface.adjacent_type in {"outdoor", "external", "ground"} else "internal"
    return load, trace, group
