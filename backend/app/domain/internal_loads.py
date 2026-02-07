from __future__ import annotations

from app.domain.rounding import round_half_up
from app.models.schemas import CalcTrace, InternalLoad, LoadVector

_TIME_KEYS = ("9", "12", "14", "16")


def calc_internal_load(load: InternalLoad) -> tuple[LoadVector, CalcTrace, str]:
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
    values = {t: round_half_up(load.sensible_w * float(ratio.get(t, 1.0)), 0) for t in _TIME_KEYS}

    vec = LoadVector(
        cool_9=values["9"],
        cool_12=values["12"],
        cool_14=values["14"],
        cool_16=values["16"],
        cool_latent=round_half_up(load.latent_w, 0),
        heat_sensible=round_half_up(load.sensible_w * 0.25, 0),
        heat_latent=round_half_up(load.latent_w * 0.25, 0),
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
