from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
import math

from app.models.schemas import RoundingMode


def round_half_up(value: float | int, ndigits: int = 0) -> float:
    quant = Decimal("1") if ndigits == 0 else Decimal(f"1e-{ndigits}")
    rounded = Decimal(str(value)).quantize(quant, rounding=ROUND_HALF_UP)
    return float(rounded)


def round_by_mode(value: float, mode: RoundingMode, step: float = 1.0) -> float:
    if step <= 0:
        return value
    scaled = value / step
    if mode == RoundingMode.CEIL:
        return math.ceil(scaled) * step
    return round_half_up(scaled, 0) * step
