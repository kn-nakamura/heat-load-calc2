from __future__ import annotations

from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class Season(StrEnum):
    SUMMER = "summer"
    WINTER = "winter"


class SurfaceKind(StrEnum):
    WALL = "wall"
    ROOF = "roof"
    FLOOR = "floor"
    INTERNAL = "internal"


class InternalLoadKind(StrEnum):
    LIGHTING = "lighting"
    OCCUPANCY = "occupancy"
    EQUIPMENT = "equipment"
    OTHER = "other"
    INTERNAL_ENVELOPE = "internal_envelope"
    INTERNAL_SOLAR = "internal_solar"


class ValidationLevel(StrEnum):
    ERROR = "error"
    WARN = "warn"


class LoadVector(BaseModel):
    cool_9: float = 0.0
    cool_12: float = 0.0
    cool_14: float = 0.0
    cool_16: float = 0.0
    cool_latent: float = 0.0
    heat_sensible: float = 0.0
    heat_latent: float = 0.0

    def add(self, other: "LoadVector") -> "LoadVector":
        return LoadVector(
            cool_9=self.cool_9 + other.cool_9,
            cool_12=self.cool_12 + other.cool_12,
            cool_14=self.cool_14 + other.cool_14,
            cool_16=self.cool_16 + other.cool_16,
            cool_latent=self.cool_latent + other.cool_latent,
            heat_sensible=self.heat_sensible + other.heat_sensible,
            heat_latent=self.heat_latent + other.heat_latent,
        )

    def __add__(self, other: "LoadVector") -> "LoadVector":
        """Support + operator for LoadVector addition."""
        return self.add(other)

    def __radd__(self, other):
        """Support sum() built-in function."""
        if other == 0:
            return self
        return self.add(other)


class CorrectionFactors(BaseModel):
    cool_9: float = 1.0
    cool_12: float = 1.0
    cool_14: float = 1.0
    cool_16: float = 1.0
    cool_latent: float = 1.0
    heat_sensible: float = 1.0
    heat_latent: float = 1.0


class RoundingMode(StrEnum):
    ROUND = "round"
    CEIL = "ceil"


class OccupancyRounding(BaseModel):
    mode: RoundingMode = RoundingMode.ROUND


class OutdoorAirRounding(BaseModel):
    mode: RoundingMode = RoundingMode.ROUND
    step: float = 10.0


class RoundingSettings(BaseModel):
    occupancy: OccupancyRounding = Field(default_factory=OccupancyRounding)
    outdoor_air: OutdoorAirRounding = Field(default_factory=OutdoorAirRounding)


class DesignCondition(BaseModel):
    id: str  # condition_name
    summer_drybulb_c: float = 0.0
    summer_rh_pct: float = 0.0
    summer_wetbulb_c: float = 0.0
    summer_dewpoint_c: float = 0.0
    summer_enthalpy_kj_per_kgda: float = 0.0
    summer_abs_humidity_kg_per_kgda: float = 0.0
    winter_drybulb_c: float = 0.0
    winter_rh_pct: float = 0.0
    winter_wetbulb_c: float = 0.0
    winter_dewpoint_c: float = 0.0
    winter_enthalpy_kj_per_kgda: float = 0.0
    winter_abs_humidity_kg_per_kgda: float = 0.0


class Room(BaseModel):
    id: str
    name: str
    usage: str | None = None
    floor: str | None = None
    area_m2: float
    ceiling_height_m: float | None = None
    volume_m3: float | None = None
    design_condition_id: str | None = None
    system_id: str | None = None


class Surface(BaseModel):
    id: str
    room_id: str
    kind: SurfaceKind
    orientation: str | None = None
    width_m: float | None = None
    height_m: float | None = None
    area_m2: float | None = None
    adjacent_type: str = "outdoor"
    adjacent_temp_c: float | None = None
    adjacent_r_factor: float = 1.0
    construction_id: str | None = None
    etd_profile_key: str | None = None
    intermittent_factor: float = 1.0
    temperature_difference_override: dict[str, float] | None = None
    heating_delta_override: float | None = None
    preset_load: LoadVector | None = None


class Opening(BaseModel):
    id: str
    room_id: str
    surface_id: str | None = None
    orientation: str | None = None
    width_m: float | None = None
    height_m: float | None = None
    area_m2: float | None = None
    glass_id: str | None = None
    shading_sc: float = 1.0
    solar_area_ratio_pct: float = 100.0
    solar_gain_override: dict[str, float] | None = None
    preset_load: LoadVector | None = None


class ConstructionLayer(BaseModel):
    layer_no: int
    material_name: str
    thickness_mm: float | None = None
    thermal_conductivity: float | None = None  # W/(m·K)
    thermal_resistance: float | None = None  # m²·K/W


class ConstructionAssembly(BaseModel):
    id: str
    name: str
    wall_type: str | None = None
    layers: list[ConstructionLayer] = Field(default_factory=list)
    ao_summer: float | None = None
    ao_winter: float | None = None
    ai: float | None = None
    total_resistance: float | None = None
    u_value_w_m2k: float | None = None
    u_value_override: float | None = None
    notes: str | None = None


class GlassSpec(BaseModel):
    id: str
    glass_code: str | None = None
    glass_type: str | None = None
    glass_description: str | None = None
    blind_type: str | None = None
    sc: float | None = None
    u_value_w_m2k: float | None = None


class InternalLoad(BaseModel):
    id: str
    room_id: str
    kind: InternalLoadKind
    sensible_w: float = 0.0
    latent_w: float = 0.0
    schedule_id: str | None = None
    schedule_ratio: dict[str, float] | None = None
    preset_load: LoadVector | None = None


class MechanicalLoad(BaseModel):
    id: str
    room_id: str
    sensible_w: float = 0.0
    latent_w: float = 0.0
    schedule_id: str | None = None
    schedule_ratio: dict[str, float] | None = None
    preset_load: LoadVector | None = None


class VentilationInfiltration(BaseModel):
    id: str
    room_id: str
    outdoor_air_m3h: float = 0.0
    infiltration_mode: str = "none"
    door_exposure: Literal["windward", "other"] | None = None
    air_changes_per_hour: float | None = None
    infiltration_area_m2: float | None = None
    sash_type: str | None = None
    airtightness: str | None = None
    wind_speed_ms: float | None = None
    sensible_effectiveness_pct: float | None = None
    total_effectiveness_pct: float | None = None
    preset_load: LoadVector | None = None


class System(BaseModel):
    id: str
    name: str
    room_ids: list[str] = Field(default_factory=list)


class ProjectMetadata(BaseModel):
    source: str | None = None
    version: str | None = None
    notes: str | None = None
    correction_factors: CorrectionFactors = Field(default_factory=CorrectionFactors)
    rounding: RoundingSettings = Field(default_factory=RoundingSettings)


class Project(BaseModel):
    id: str
    name: str
    building_name: str | None = None
    building_location: str | None = None
    building_usage: str | None = None
    building_structure: str | None = None
    total_floor_area_m2: float | None = None
    floors_above: int | None = None
    floors_below: int | None = None
    report_author: str | None = None
    remarks: str | None = None
    unit_system: str = "SI"
    region: str
    solar_region: str | None = None
    orientation_basis: str = "north"
    orientation_deg: float = Field(0.0, ge=0.0, le=360.0)
    location_lat: float | None = None
    location_lon: float | None = None
    location_label: str | None = None
    design_conditions: list[DesignCondition] = Field(default_factory=list)
    rooms: list[Room] = Field(default_factory=list)
    surfaces: list[Surface] = Field(default_factory=list)
    openings: list[Opening] = Field(default_factory=list)
    constructions: list[ConstructionAssembly] = Field(default_factory=list)
    glasses: list[GlassSpec] = Field(default_factory=list)
    internal_loads: list[InternalLoad] = Field(default_factory=list)
    mechanical_loads: list[MechanicalLoad] = Field(default_factory=list)
    ventilation_infiltration: list[VentilationInfiltration] = Field(default_factory=list)
    systems: list[System] = Field(default_factory=list)
    metadata: ProjectMetadata = Field(default_factory=ProjectMetadata)

    @model_validator(mode="after")
    def fill_room_volume(self) -> "Project":
        for room in self.rooms:
            if room.volume_m3 is None and room.ceiling_height_m is not None:
                room.volume_m3 = room.area_m2 * room.ceiling_height_m
        return self


class ValidationIssue(BaseModel):
    level: ValidationLevel
    code: str
    message: str
    entity: str | None = None
    field: str | None = None
    row: int | None = None
    col: int | None = None


class CalcTrace(BaseModel):
    formula_id: str
    entity_type: str
    entity_id: str
    mode: str
    inputs: dict[str, Any] = Field(default_factory=dict)
    references: dict[str, Any] = Field(default_factory=dict)
    intermediates: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)


class RoomLoadSummary(BaseModel):
    room_id: str
    room_name: str
    # 新しい分離構造
    envelope_loads: LoadVector  # qK + qG (外皮負荷)
    envelope_loads_by_orientation: dict[str, LoadVector]  # 方位別外皮負荷
    internal_loads: LoadVector  # qE + qH + qM (内部負荷、冷房のみ)
    ventilation_loads: LoadVector  # qL + qO (外気負荷、潜熱含む)
    # 集計結果
    pre_correction: LoadVector
    post_correction: LoadVector
    final_totals: dict[str, float]


class SystemLoadSummary(BaseModel):
    system_id: str
    system_name: str
    room_ids: list[str]
    totals: dict[str, float]


class CalcResult(BaseModel):
    major_cells: dict[str, float | None]
    room_results: list[RoomLoadSummary]
    system_results: list[SystemLoadSummary]
    totals: dict[str, float]
    traces: list[CalcTrace]


class CalcRunRequest(BaseModel):
    project: Project


class ValidateResponse(BaseModel):
    valid: bool
    issues: list[ValidationIssue]


class CsvDataset(BaseModel):
    filename: str
    content: str


class CsvImportRequest(BaseModel):
    project: Project | None = None
    datasets: list[CsvDataset]
    has_header: bool = True
    allow_headerless: bool = False
    delete_missing: bool = False


class PasteImportRequest(BaseModel):
    project: Project | None = None
    entity: Literal[
        "rooms",
        "surfaces",
        "openings",
        "constructions",
        "glasses",
        "internal_loads",
        "mechanical_loads",
        "ventilation",
    ]
    text: str
    has_header: bool = True
    delete_missing: bool = False


class ImportDiff(BaseModel):
    entity: str
    add: int = 0
    update: int = 0
    delete: int = 0


class ImportPreviewResponse(BaseModel):
    diffs: list[ImportDiff]
    issues: list[ValidationIssue]


class ImportApplyResponse(BaseModel):
    project: Project
    diffs: list[ImportDiff]
    issues: list[ValidationIssue]


class JsonImportRequest(BaseModel):
    payload: dict[str, Any]


class JsonExportRequest(BaseModel):
    project: Project
    calc_result: CalcResult | None = None


class JsonExportResponse(BaseModel):
    payload: dict[str, Any]


class ExcelExportRequest(BaseModel):
    project: Project
    calc_result: CalcResult | None = None
    output_filename: str = "heat_load_result.xlsx"


class ReferenceTableResponse(BaseModel):
    table_name: str
    data: dict[str, Any]


class NearestRegionResponse(BaseModel):
    region: str
    lat: float
    lon: float
    distance_km: float
    tags: list[str] = Field(default_factory=list)
