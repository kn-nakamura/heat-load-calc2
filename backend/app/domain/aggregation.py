from __future__ import annotations

from app.domain.rounding import round_half_up
from app.models.schemas import CorrectionFactors, LoadVector


def combine(vectors: list[LoadVector]) -> LoadVector:
    total = LoadVector()
    for vec in vectors:
        total = total.add(vec)
    return total


def major_cells_from_subtotals(
    external: LoadVector,
    internal: LoadVector,
    mechanical: LoadVector,
    area_m2: float,
    correction: CorrectionFactors,
) -> dict[str, float | None]:
    internal = internal.add(mechanical)
    cells: dict[str, float | None] = {}

    cells["N48"] = external.cool_latent if external.cool_latent != 0 else None
    cells["R48"] = external.cool_9
    cells["X48"] = external.cool_12
    cells["AB48"] = external.cool_14
    cells["AF48"] = external.cool_16
    cells["AJ48"] = external.heat_latent if external.heat_latent != 0 else None
    cells["AL48"] = external.heat_sensible if external.heat_sensible != 0 else None

    cells["N50"] = internal.cool_latent if internal.cool_latent != 0 else None
    cells["R50"] = internal.cool_9
    cells["X50"] = internal.cool_12
    cells["AB50"] = internal.cool_14
    cells["AF50"] = internal.cool_16
    # 内部発熱の暖房寄与は減算扱いのため、internal側は符号付き値を合算する。
    cells["AJ50"] = internal.heat_latent if internal.heat_latent != 0 else None
    cells["AL50"] = internal.heat_sensible if internal.heat_sensible != 0 else None

    n52 = (cells["N48"] or 0.0) + (cells["N50"] or 0.0)
    r52 = (cells["R48"] or 0.0) + (cells["R50"] or 0.0)
    x52 = (cells["X48"] or 0.0) + (cells["X50"] or 0.0)
    ab52 = (cells["AB48"] or 0.0) + (cells["AB50"] or 0.0)
    af52 = (cells["AF48"] or 0.0) + (cells["AF50"] or 0.0)
    aj52 = (cells["AJ48"] or 0.0) + (cells["AJ50"] or 0.0)
    al52 = (cells["AL48"] or 0.0) + (cells["AL50"] or 0.0)

    cells["N52"] = n52 if n52 != 0 else None
    cells["R52"] = r52
    cells["X52"] = x52
    cells["AB52"] = ab52
    cells["AF52"] = af52
    cells["AJ52"] = aj52 if aj52 != 0 else None
    cells["AL52"] = al52 if al52 != 0 else None

    n53 = round_half_up(n52 * correction.cool_latent, 0)
    r53 = round_half_up(r52 * correction.cool_9, 0)
    x53 = round_half_up(x52 * correction.cool_12, 0)
    ab53 = round_half_up(ab52 * correction.cool_14, 0)
    af53 = round_half_up(af52 * correction.cool_16, 0)
    aj53 = round_half_up(aj52 * correction.heat_latent, 0)
    al53 = round_half_up(al52 * correction.heat_sensible, 0)

    cells["N53"] = n53 if n53 != 0 else None
    cells["R53"] = r53
    cells["X53"] = x53
    cells["AB53"] = ab53
    cells["AF53"] = af53
    cells["AJ53"] = aj53 if aj53 != 0 else None
    cells["AL53"] = al53 if al53 != 0 else None

    r54 = r53 + n53
    x54 = x53 + n53
    ab54 = ab53 + n53
    af54 = af53 + n53
    aj54 = aj53 + al53

    cells["R54"] = r54
    cells["X54"] = x54
    cells["AB54"] = ab54
    cells["AF54"] = af54
    cells["AJ54"] = aj54 if aj54 != 0 else None

    if area_m2 > 0:
        cells["R55"] = round_half_up(r54 / area_m2, 0)
        cells["X55"] = round_half_up(x54 / area_m2, 0)
        cells["AB55"] = round_half_up(ab54 / area_m2, 0)
        cells["AF55"] = round_half_up(af54 / area_m2, 0)
        cells["AJ55"] = round_half_up(aj54 / area_m2, 0) if aj54 else None
    else:
        cells["R55"] = None
        cells["X55"] = None
        cells["AB55"] = None
        cells["AF55"] = None
        cells["AJ55"] = None

    return cells
