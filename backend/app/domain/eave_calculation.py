"""Eave (overhang) shading calculation for glass sunlit area ratio.

Calculates the glass sunlit area ratio (ガラス面日照面積率 SG) based on
eave/overhang geometry and solar position data from reference tables.

Formulas (Table 2-6 methodology):
    x = B - b' - v * |tan gamma|
    y = H - h' - w * tan phi

where:
    B  = window width [m]
    b' = side projection of eave from window edge [m]
    v  = vertical projection depth of eave [m]
    gamma = apparent solar azimuth angle relative to wall normal
    H  = window height [m]
    h' = top projection of eave above window [m]
    w  = horizontal projection depth of eave [m]
    phi = apparent solar altitude angle

SG (sunlit area ratio) lookup table:
    | x\\y      | x <= 0 | 0 < x < B | x >= B |
    |----------|--------|-----------|--------|
    | y <= 0   | 0      | 0         | 0      |
    | 0 < y < H| 0      | x*y/(B*H) | y/H    |
    | y >= H   | 0      | x/B       | 1      |
"""

from __future__ import annotations

from app.domain.reference_lookup import ReferenceRepository, get_reference_repository


def _lookup_tan_values(
    region: str,
    orientation: str,
    hour: str,
    repo: ReferenceRepository,
) -> tuple[float, float]:
    """Look up precomputed tan(solar_altitude) and tan(solar_azimuth) values.

    These values are read from the glass_sunlit_area_ratio_numbers.json
    reference file, which provides pre-calculated tangent values for each
    combination of region, hour, and wall orientation.

    Args:
        region: Climate region name (e.g. "札幌", "東京").
        orientation: Wall orientation (e.g. "S", "SE", "NW").
        hour: Time of day key ("9", "12", "14", "16").
        repo: Reference data repository.

    Returns:
        (tan_phi, tan_gamma) where:
            tan_phi   = tan(apparent solar altitude)
            tan_gamma = tan(apparent solar azimuth relative to wall normal)
    """
    data = repo.glass_sunlit_area_ratio()
    region_data = data.get("regions", {}).get(region, {})
    hour_data = region_data.get(str(hour), {})

    tan_altitude = float(
        hour_data.get("tan_solar_altitude", {}).get(orientation, 0.0)
    )
    tan_azimuth = float(
        hour_data.get("tan_solar_azimuth", {}).get(orientation, 0.0)
    )
    return tan_altitude, tan_azimuth


def _compute_sg(x: float, y: float, b: float, h: float) -> float:
    """Apply the SG lookup table (Table 2-6).

    Determines the sunlit area ratio from the horizontal and vertical
    sunlit spans after accounting for eave shadow geometry.

    Args:
        x: Horizontal sunlit span after eave side shading [m].
        y: Vertical sunlit span after eave top shading [m].
        b: Window width B [m].
        h: Window height H [m].

    Returns:
        Sunlit area ratio SG in [0.0, 1.0].
    """
    if b <= 0.0 or h <= 0.0:
        return 0.0

    # Row: y <= 0 => all cells are 0
    if y <= 0.0:
        return 0.0

    # Column: x <= 0 => all cells are 0
    if x <= 0.0:
        return 0.0

    # Row: y >= h
    if y >= h:
        if x >= b:
            return 1.0
        # 0 < x < b
        return x / b

    # Row: 0 < y < h
    if x >= b:
        return y / h
    # 0 < x < b, 0 < y < h
    return (x * y) / (b * h)


def calc_sunlit_area_ratio(
    region: str,
    orientation: str,
    hour: str,
    window_width_m: float,
    window_height_m: float,
    eave_depth_m: float,
    eave_side_offset_m: float = 0.0,
    eave_top_offset_m: float = 0.0,
    eave_vertical_depth_m: float = 0.0,
    repo: ReferenceRepository | None = None,
) -> float:
    """Calculate glass sunlit area ratio SG for a given eave/overhang configuration.

    Uses the precomputed tangent values from the reference data together with
    the eave geometry to determine what fraction of the glass surface receives
    direct sunlight.

    When both tan_solar_altitude and tan_solar_azimuth are zero for a given
    region/orientation/hour combination, no direct sunlight reaches that wall
    face and SG is returned as 0.0.

    Args:
        region: Climate region name (e.g. "札幌", "東京", "大阪").
        orientation: Wall orientation (e.g. "S", "SE", "NW", "E").
        hour: Time of day key ("9", "12", "14", "16").
        window_width_m: Window width B [m].
        window_height_m: Window height H [m].
        eave_depth_m: Horizontal projection depth of eave w [m].
        eave_side_offset_m: Side projection of eave from window edge b' [m].
            Defaults to 0.0 (eave flush with window side).
        eave_top_offset_m: Top projection of eave above window h' [m].
            Defaults to 0.0 (eave flush with window top).
        eave_vertical_depth_m: Vertical eave depth v [m] (for side shading).
            Defaults to 0.0 (no vertical fin component).
        repo: Reference data repository. Uses the default singleton if None.

    Returns:
        Sunlit area ratio SG in [0.0, 1.0].
    """
    if repo is None:
        repo = get_reference_repository()

    if window_width_m <= 0.0 or window_height_m <= 0.0:
        return 0.0

    tan_phi, tan_gamma = _lookup_tan_values(region, orientation, hour, repo)

    # Both zero is a sentinel indicating no direct sunlight on this
    # wall face at this hour -- the entire window is in shade regardless
    # of eave geometry.
    if tan_phi == 0.0 and tan_gamma == 0.0:
        return 0.0

    # Horizontal sunlit span: x = B - b' - v * |tan(gamma)|
    x = (
        window_width_m
        - eave_side_offset_m
        - eave_vertical_depth_m * abs(tan_gamma)
    )

    # Vertical sunlit span: y = H - h' - w * tan(phi)
    y = (
        window_height_m
        - eave_top_offset_m
        - eave_depth_m * tan_phi
    )

    return _compute_sg(x, y, window_width_m, window_height_m)


def calc_glass_solar_load(
    region: str,
    orientation: str,
    hour: str,
    glass_area_m2: float,
    sc: float,
    sg: float,
    repo: ReferenceRepository | None = None,
) -> dict:
    """Calculate glass surface solar heat gain qG2.

    Combines the standard solar gain (IG) with the shadow solar gain (IGS,
    日影 value) and the sunlit area ratio (SG) to compute the effective
    solar heat gain through the glass.

    Without external shading (SG = 1.0):
        qG2n = IG * SC

    With external shading:
        qG2n = ((IG - IGS) * SG + IGS) * SC

    When SG = 1.0 (no eave or fully sunlit), the general formula reduces
    to the unshaded case:  ((IG - IGS) * 1 + IGS) * SC = IG * SC.

    When SG = 0.0 (fully shaded by eave), the gain is only from diffuse
    radiation: IGS * SC.

    Args:
        region: Climate region name (e.g. "札幌", "東京", "大阪").
        orientation: Wall orientation (e.g. "S", "SE", "NW", "E").
        hour: Time of day key ("9", "12", "14", "16").
        glass_area_m2: Glass area [m2].
        sc: Shading coefficient SC (dimensionless).
        sg: Sunlit area ratio SG from calc_sunlit_area_ratio (0.0 to 1.0).
        repo: Reference data repository. Uses the default singleton if None.

    Returns:
        Dict with:
            "ig_w_m2":    standard solar gain IG [W/m2],
            "igs_w_m2":   shadow solar gain IGS (日影) [W/m2],
            "sg":         sunlit area ratio used,
            "sc":         shading coefficient used,
            "qG2n_w_m2":  unit-area solar heat gain [W/m2],
            "qG2_w":      total solar heat gain [W].
    """
    if repo is None:
        repo = get_reference_repository()

    solar_data = repo.solar()
    region_data = solar_data.get("regions", {}).get(region, {})

    # IG: standard solar gain for the wall orientation [W/m2]
    ig = float(region_data.get(orientation, {}).get(str(hour), 0.0))

    # IGS: shadow (diffuse) solar gain 日影 [W/m2]
    igs = float(region_data.get("日影", {}).get(str(hour), 0.0))

    # qG2n = ((IG - IGS) * SG + IGS) * SC
    qg2n = ((ig - igs) * sg + igs) * sc

    # Total heat gain = unit-area gain * glass area
    qg2 = qg2n * glass_area_m2

    return {
        "ig_w_m2": ig,
        "igs_w_m2": igs,
        "sg": sg,
        "sc": sc,
        "qG2n_w_m2": qg2n,
        "qG2_w": qg2,
    }
