from __future__ import annotations

from app.domain.rounding import round_by_mode, round_half_up
from app.models.schemas import CalcTrace, InternalLoad, LoadVector, OccupancyRounding

_TIME_KEYS = ("9", "12", "14", "16")
# 暖房寄与率は手引きに基づき内部発熱の25%（例: 0.25）を負荷減算として扱う。
_HEATING_CONTRIBUTION_RATIO = 0.25


def calc_internal_load(
    load: InternalLoad,
    occupancy_rounding: OccupancyRounding | None = None,
    heat_mode: bool = False,  # True: 暖房モード、内部負荷を除外
) -> tuple[LoadVector, CalcTrace, str]:
    if load.preset_load is not None:
        trace = CalcTrace(
            formula_id="internal.preset_override",
            entity_type="internal_load",
            entity_id=load.id,
            mode="both",
            inputs={"preset": load.preset_load.model_dump()},
            references={},
            intermediates={},
            output=load.preset_load.model_dump(),
        )
        return load.preset_load, trace, "internal"

    ratio = load.schedule_ratio or {"9": 1.0, "12": 1.0, "14": 1.0, "16": 1.0}
    if load.kind.value == "occupancy" and occupancy_rounding is not None:
        values = {
            t: round_by_mode(load.sensible_w * float(ratio.get(t, 1.0)), occupancy_rounding.mode)
            for t in _TIME_KEYS
        }
        latent = round_by_mode(load.latent_w, occupancy_rounding.mode)
        # 暖房モード: 内部負荷を除外（表2-9）
        if heat_mode:
            heat_sensible = 0.0
            heat_latent = 0.0
        else:
            heat_sensible = -round_by_mode(
                load.sensible_w * _HEATING_CONTRIBUTION_RATIO,
                occupancy_rounding.mode,
            )
            heat_latent = -round_by_mode(load.latent_w * _HEATING_CONTRIBUTION_RATIO, occupancy_rounding.mode)
    else:
        values = {t: round_half_up(load.sensible_w * float(ratio.get(t, 1.0)), 0) for t in _TIME_KEYS}
        latent = round_half_up(load.latent_w, 0)
        # 暖房モード: 内部負荷を除外（表2-9）
        if heat_mode:
            heat_sensible = 0.0
            heat_latent = 0.0
        else:
            heat_sensible = -round_half_up(load.sensible_w * _HEATING_CONTRIBUTION_RATIO, 0)
            heat_latent = -round_half_up(load.latent_w * _HEATING_CONTRIBUTION_RATIO, 0)

    vec = LoadVector(
        cool_9=values["9"],
        cool_12=values["12"],
        cool_14=values["14"],
        cool_16=values["16"],
        cool_latent=latent,
        heat_sensible=heat_sensible,
        heat_latent=heat_latent,
    )

    trace = CalcTrace(
        formula_id="internal.load_simple",
        entity_type="internal_load",
        entity_id=load.id,
        mode="both",
        inputs={"sensible_w": load.sensible_w, "latent_w": load.latent_w, "schedule_ratio": ratio},
        references={},
        intermediates={"cooling_sensible_times": values},
        output=vec.model_dump(),
    )
    return vec, trace, "internal"
