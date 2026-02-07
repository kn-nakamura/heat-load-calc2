from __future__ import annotations

from app.domain.rounding import round_half_up
from app.models.schemas import CorrectionFactors, LoadVector


def combine(vectors: list[LoadVector]) -> LoadVector:
    total = LoadVector()
    for vec in vectors:
        total = total.add(vec)
    return total


def major_cells_from_subtotals(
    envelope: LoadVector,
    internal: LoadVector,
    ventilation: LoadVector,
    area_m2: float,
    correction: CorrectionFactors,
) -> dict[str, float | None]:
    # 新しい構造: 外皮、内部、外気を分離して計上
    # 注記: 暖房では内部負荷は0になっている
    cells: dict[str, float | None] = {}

    # 外皮負荷（N48-AL48）
    cells["N48"] = envelope.cool_latent if envelope.cool_latent != 0 else None
    cells["R48"] = envelope.cool_9
    cells["X48"] = envelope.cool_12
    cells["AB48"] = envelope.cool_14
    cells["AF48"] = envelope.cool_16
    cells["AJ48"] = envelope.heat_latent if envelope.heat_latent != 0 else None
    cells["AL48"] = envelope.heat_sensible if envelope.heat_sensible != 0 else None

    # 内部負荷（N50-AL50）- 暖房では0
    cells["N50"] = internal.cool_latent if internal.cool_latent != 0 else None
    cells["R50"] = internal.cool_9
    cells["X50"] = internal.cool_12
    cells["AB50"] = internal.cool_14
    cells["AF50"] = internal.cool_16
    # 暖房では内部負荷は含まない
    cells["AJ50"] = internal.heat_latent if internal.heat_latent != 0 else None
    cells["AL50"] = internal.heat_sensible if internal.heat_sensible != 0 else None

    # 外気負荷（N52-AL52）
    cells["N52"] = ventilation.cool_latent if ventilation.cool_latent != 0 else None
    cells["R52"] = ventilation.cool_9
    cells["X52"] = ventilation.cool_12
    cells["AB52"] = ventilation.cool_14
    cells["AF52"] = ventilation.cool_16
    # 暖房では潜熱も含める
    cells["AJ52"] = ventilation.heat_latent if ventilation.heat_latent != 0 else None
    cells["AL52"] = ventilation.heat_sensible if ventilation.heat_sensible != 0 else None

    # 行54: 合計（外皮 + 内部 + 外気）
    n54 = (cells["N48"] or 0.0) + (cells["N50"] or 0.0) + (cells["N52"] or 0.0)
    r54 = (cells["R48"] or 0.0) + (cells["R50"] or 0.0) + (cells["R52"] or 0.0)
    x54 = (cells["X48"] or 0.0) + (cells["X50"] or 0.0) + (cells["X52"] or 0.0)
    ab54 = (cells["AB48"] or 0.0) + (cells["AB50"] or 0.0) + (cells["AB52"] or 0.0)
    af54 = (cells["AF48"] or 0.0) + (cells["AF50"] or 0.0) + (cells["AF52"] or 0.0)
    aj54 = (cells["AJ48"] or 0.0) + (cells["AJ50"] or 0.0) + (cells["AJ52"] or 0.0)
    al54 = (cells["AL48"] or 0.0) + (cells["AL50"] or 0.0) + (cells["AL52"] or 0.0)

    cells["N54"] = n54 if n54 != 0 else None
    cells["R54"] = r54
    cells["X54"] = x54
    cells["AB54"] = ab54
    cells["AF54"] = af54
    cells["AJ54"] = aj54 if aj54 != 0 else None
    cells["AL54"] = al54 if al54 != 0 else None

    # 行55: 補正後（補正係数を適用）
    n55 = round_half_up(n54 * correction.cool_latent, 0)
    r55 = round_half_up(r54 * correction.cool_9, 0)
    x55 = round_half_up(x54 * correction.cool_12, 0)
    ab55 = round_half_up(ab54 * correction.cool_14, 0)
    af55 = round_half_up(af54 * correction.cool_16, 0)
    aj55 = round_half_up(aj54 * correction.heat_latent, 0)
    al55 = round_half_up(al54 * correction.heat_sensible, 0)

    # 行55: 補正後
    cells["N55"] = n55 if n55 != 0 else None
    cells["R55"] = r55
    cells["X55"] = x55
    cells["AB55"] = ab55
    cells["AF55"] = af55
    cells["AJ55"] = aj55 if aj55 != 0 else None
    cells["AL55"] = al55 if al55 != 0 else None

    # 行56: 潜熱合算（顕熱 + 潜熱）
    r56 = r55 + n55
    x56 = x55 + n55
    ab56 = ab55 + n55
    af56 = af55 + n55
    aj56 = aj55 + al55

    cells["R56"] = r56
    cells["X56"] = x56
    cells["AB56"] = ab56
    cells["AF56"] = af56
    cells["AJ56"] = aj56 if aj56 != 0 else None

    # 行57: 単位面積当たり負荷
    if area_m2 > 0:
        cells["R57"] = round_half_up(r56 / area_m2, 0)
        cells["X57"] = round_half_up(x56 / area_m2, 0)
        cells["AB57"] = round_half_up(ab56 / area_m2, 0)
        cells["AF57"] = round_half_up(af56 / area_m2, 0)
        cells["AJ57"] = round_half_up(aj56 / area_m2, 0) if aj56 else None
    else:
        cells["R57"] = None
        cells["X57"] = None
        cells["AB57"] = None
        cells["AF57"] = None
        cells["AJ57"] = None

    return cells
