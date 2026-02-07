from __future__ import annotations

import math

from app.domain.rounding import round_half_up


def saturation_pressure_kpa(temp_c: float) -> float:
    t = temp_c + 273.15
    if t <= 273.15:
        p = math.exp(
            -0.56745359e4 / t
            + 0.63925247e1
            - 0.9677843e-2 * t
            + 0.62215701e-6 * t**2
            + 0.20747825e-8 * t**3
            - 0.9484024e-12 * t**4
            + 0.41635019e1 * math.log(t)
        )
    else:
        p = math.exp(
            -0.58002206e4 / t
            + 0.13914993e1
            - 0.48640239e-1 * t
            + 0.41764768e-4 * t**2
            - 0.14452093e-7 * t**3
            + 0.65459673e1 * math.log(t)
        )
    return p / 1000.0


def absolute_humidity_kg_per_kgda(temp_c: float, rh_pct: float) -> float:
    sat = saturation_pressure_kpa(temp_c)
    partial = sat * rh_pct / 100.0
    value = (18.0153 / 28.9645) * (partial / (101.325 - partial))
    return round_half_up(value, 4)


def specific_enthalpy_kj_per_kgda(temp_c: float, humidity_ratio: float) -> float:
    value = 1.006 * temp_c + (1.86 * temp_c + 2501.0) * humidity_ratio
    return round_half_up(value, 1)


def moist_air_state(temp_c: float, rh_pct: float) -> dict[str, float]:
    sat = saturation_pressure_kpa(temp_c)
    w = absolute_humidity_kg_per_kgda(temp_c, rh_pct)
    h = specific_enthalpy_kj_per_kgda(temp_c, w)
    return {
        "temp_c": temp_c,
        "rh_pct": rh_pct,
        "saturation_pressure_kpa": sat,
        "humidity_ratio": w,
        "enthalpy_kj_per_kgda": h,
    }
