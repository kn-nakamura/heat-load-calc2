from __future__ import annotations

from app.domain.psychrometrics import moist_air_state
from app.domain.reference_lookup import ReferenceRepository
from app.domain.rounding import round_by_mode, round_half_up
from app.models.schemas import CalcTrace, DesignCondition, LoadVector, OutdoorAirRounding, Room, VentilationInfiltration

_TIME_KEYS = ("9", "12", "14", "16")


def _outdoor_temp_series(outdoor: dict) -> dict[str, float]:
    return {
        "9": float(outdoor.get("temp_9_c", outdoor.get("cooling_drybulb_c", 34.0))),
        "12": float(outdoor.get("temp_12_c", outdoor.get("cooling_drybulb_c", 34.0))),
        "14": float(outdoor.get("temp_14_c", outdoor.get("cooling_drybulb_c", 34.0))),
        "16": float(outdoor.get("temp_16_c", outdoor.get("cooling_drybulb_c", 34.0))),
    }


def calc_ventilation_load(
    vent: VentilationInfiltration,
    room: Room,
    summer_condition: DesignCondition | None,
    winter_condition: DesignCondition | None,
    outdoor: dict,
    references: ReferenceRepository,
    outdoor_air_rounding: OutdoorAirRounding | None = None,
) -> tuple[LoadVector, CalcTrace, str]:
    if vent.preset_load is not None:
        trace = CalcTrace(
            formula_id="ventilation.preset_override",
            entity_type="ventilation",
            entity_id=vent.id,
            mode="both",
            inputs={"preset": vent.preset_load.model_dump()},
            references={},
            intermediates={},
            output=vent.preset_load.model_dump(),
        )
        return vent.preset_load, trace, "external"

    if outdoor_air_rounding is not None:
        base_flow = round_by_mode(vent.outdoor_air_m3h, outdoor_air_rounding.mode, outdoor_air_rounding.step)
    else:
        base_flow = vent.outdoor_air_m3h
    infil = 0.0
    if vent.infiltration_mode == "door":
        volume_m3 = room.volume_m3
        if volume_m3 is None and room.area_m2 and room.ceiling_height_m:
            volume_m3 = room.area_m2 * room.ceiling_height_m
        if vent.air_changes_per_hour and volume_m3:
            infil = vent.air_changes_per_hour * volume_m3
    if vent.infiltration_mode == "sash" and vent.sash_type and vent.airtightness and vent.wind_speed_ms:
        sash_q = references.lookup_sash_infiltration(vent.sash_type, vent.airtightness, vent.wind_speed_ms)
        infil = sash_q * float(vent.infiltration_area_m2 or 0.0)
    total_flow = base_flow + infil

    indoor_cool = summer_condition.indoor_temp_c if summer_condition else 26.0
    indoor_rh = summer_condition.indoor_rh_pct if summer_condition else 50.0
    indoor_heat = winter_condition.indoor_temp_c if winter_condition else 20.0
    outdoor_rh = float(outdoor.get("cooling_rh_pct", 50.0))

    outdoor_temp = _outdoor_temp_series(outdoor)

    sensible = {}
    for t in _TIME_KEYS:
        delta = max(outdoor_temp[t] - indoor_cool, 0.0)
        sensible[t] = round_half_up(1.006 * total_flow / 3.6 * delta, 0)

    indoor_state = moist_air_state(indoor_cool, indoor_rh)
    outdoor_state = moist_air_state(float(outdoor.get("cooling_drybulb_c", outdoor_temp["14"])), outdoor_rh)
    latent = round_half_up(max(outdoor_state["enthalpy_kj_per_kgda"] - indoor_state["enthalpy_kj_per_kgda"], 0.0) * total_flow / 3.6, 0)

    heat_delta = max(indoor_heat - float(outdoor.get("heating_drybulb_c", 0.0)), 0.0)
    heat_sensible = round_half_up(1.006 * total_flow / 3.6 * heat_delta, 0)

    vec = LoadVector(
        cool_9=sensible["9"],
        cool_12=sensible["12"],
        cool_14=sensible["14"],
        cool_16=sensible["16"],
        cool_latent=latent,
        heat_sensible=heat_sensible,
        heat_latent=0.0,
    )

    trace = CalcTrace(
        formula_id="ventilation.outdoor_air",
        entity_type="ventilation",
        entity_id=vent.id,
        mode="both",
        inputs={
            "base_flow_m3h": base_flow,
            "infiltration_flow_m3h": infil,
            "total_flow_m3h": total_flow,
            "indoor_cooling_c": indoor_cool,
            "indoor_heating_c": indoor_heat,
            "door_exposure": vent.door_exposure,
            "air_changes_per_hour": vent.air_changes_per_hour,
            "room_volume_m3": room.volume_m3,
        },
        references={"sash_table": "aluminum_sash_infiltration"},
        intermediates={
            "outdoor_temp_series": outdoor_temp,
            "indoor_state": indoor_state,
            "outdoor_state": outdoor_state,
        },
        output=vec.model_dump(),
    )
    return vec, trace, "external"
