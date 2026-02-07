from __future__ import annotations

from app.domain.rounding import round_half_up
from app.models.schemas import CalcTrace, LoadVector, MechanicalLoad

_TIME_KEYS = ("9", "12", "14", "16")


def calc_mechanical_load(load: MechanicalLoad, heat_mode: bool = False) -> tuple[LoadVector, CalcTrace, str]:
    if load.preset_load is not None:
        trace = CalcTrace(
            formula_id="mechanical.preset_override",
            entity_type="mechanical_load",
            entity_id=load.id,
            mode="both",
            inputs={"preset": load.preset_load.model_dump()},
            references={},
            intermediates={},
            output=load.preset_load.model_dump(),
        )
        return load.preset_load, trace, "internal"

    ratio = load.schedule_ratio or {"9": 1.0, "12": 1.0, "14": 1.0, "16": 1.0}
    values = {t: round_half_up(load.sensible_w * float(ratio.get(t, 1.0)), 0) for t in _TIME_KEYS}
    latent = round_half_up(load.latent_w, 0)
    # 暖房モード: 機械負荷を除外（表2-9）
    if heat_mode:
        heat_sensible = 0.0
        heat_latent = 0.0
    else:
        heat_sensible = round_half_up(load.sensible_w * 0.25, 0)
        heat_latent = round_half_up(load.latent_w * 0.25, 0)

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
        formula_id="mechanical.load_simple",
        entity_type="mechanical_load",
        entity_id=load.id,
        mode="both",
        inputs={"sensible_w": load.sensible_w, "latent_w": load.latent_w, "schedule_ratio": ratio},
        references={},
        intermediates={"cooling_sensible_times": values},
        output=vec.model_dump(),
    )
    return vec, trace, "internal"
