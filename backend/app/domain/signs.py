from __future__ import annotations


def clamp_positive(value: float) -> float:
    return value if value > 0 else 0.0


def split_cooling_heating(raw: float) -> tuple[float, float]:
    cooling = raw if raw > 0 else 0.0
    heating = -raw if raw < 0 else 0.0
    return cooling, heating
