from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP


def round_half_up(value: float | int, ndigits: int = 0) -> float:
    quant = Decimal("1") if ndigits == 0 else Decimal(f"1e-{ndigits}")
    rounded = Decimal(str(value)).quantize(quant, rounding=ROUND_HALF_UP)
    return float(rounded)
