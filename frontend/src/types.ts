export type Season = "summer" | "winter";

export interface CorrectionFactors {
  cool_9: number;
  cool_12: number;
  cool_14: number;
  cool_16: number;
  cool_latent: number;
  heat_sensible: number;
  heat_latent: number;
}

export type RoundingMode = "round" | "ceil";

export interface OccupancyRounding {
  mode: RoundingMode;
}

export interface OutdoorAirRounding {
  mode: RoundingMode;
  step: number;
}

export interface RoundingSettings {
  occupancy: OccupancyRounding;
  outdoor_air: OutdoorAirRounding;
}

export interface DesignCondition {
  id: string;  // condition_name from JSON
  summer_drybulb_c: number;
  summer_rh_pct: number;
  summer_wetbulb_c: number;
  summer_dewpoint_c: number;
  summer_enthalpy_kj_per_kgda: number;
  summer_abs_humidity_kg_per_kgda: number;
  winter_drybulb_c: number;
  winter_rh_pct: number;
  winter_wetbulb_c: number;
  winter_dewpoint_c: number;
  winter_enthalpy_kj_per_kgda: number;
  winter_abs_humidity_kg_per_kgda: number;
}

export interface Room {
  id: string;
  name: string;
  usage?: string;
  floor?: string;
  area_m2: number;
  ceiling_height_m?: number;
  volume_m3?: number;
  design_condition_id?: string;
  system_id?: string;
}

export interface Surface {
  id: string;
  room_id: string;
  kind: "wall" | "roof" | "floor" | "internal";
  orientation?: string;
  width_m?: number;
  height_m?: number;
  area_m2?: number;
  adjacent_type?: string;
  adjacent_temp_c?: number;
  adjacent_r_factor?: number;
  construction_id?: string;
}

export interface Opening {
  id: string;
  room_id: string;
  surface_id?: string;
  orientation?: string;
  area_m2?: number;
  glass_id?: string;
  shading_sc?: number;
  solar_area_ratio_pct?: number;
}

export interface ConstructionLayer {
  layer_no: number;
  material_name: string;
  thickness_mm?: number;
  thermal_conductivity?: number;  // W/(m·K)
  thermal_resistance?: number;   // m²·K/W
}

export interface Construction {
  id: string;
  name: string;
  wall_type?: string;
  layers: ConstructionLayer[];
  ao_summer?: number;  // exterior surface heat transfer coefficient
  ao_winter?: number;
  ai?: number;  // interior surface heat transfer coefficient
  total_resistance?: number;  // calculated
  u_value_w_m2k?: number;  // calculated from layers
  u_value_override?: number;  // user can override
}

export interface Glass {
  id: string;  // GL-01, GL-02, etc.
  glass_code?: string;  // e.g. "2FA06"
  glass_type?: string;  // e.g. "複層ガラス"
  glass_description?: string;
  blind_type?: string;  // "なし" | "明色ブラインド" | "中間色ブラインド"
  sc?: number;  // shading coefficient (selected based on blind_type)
  u_value_w_m2k?: number;  // U-value (selected based on blind_type)
}

export interface InternalLoad {
  id: string;
  room_id: string;
  kind: "lighting" | "occupancy" | "equipment" | "other" | "internal_envelope" | "internal_solar";
  sensible_w: number;
  latent_w: number;
  // Optional fields for lighting loads
  illuminance_lux?: number;
  power_density_w_m2?: number;
  // Optional fields for occupancy loads
  occupancy_count?: number;
  sensible_per_person_w?: number;
  latent_per_person_w?: number;
}

export interface MechanicalLoad {
  id: string;
  room_id: string;
  sensible_w: number;
  latent_w: number;
}

export interface Ventilation {
  id: string;
  room_id: string;
  outdoor_air_m3h: number;
  infiltration_mode?: string;
  infiltration_area_m2?: number;
  sash_type?: string;
  airtightness?: string;
  wind_speed_ms?: number;
}

export interface SystemEntity {
  id: string;
  name: string;
  room_ids: string[];
}

export interface Project {
  id: string;
  name: string;
  building_name: string;
  building_location: string;
  building_usage: string;
  building_structure: string;
  total_floor_area_m2: number | null;
  floors_above: number | null;
  floors_below: number | null;
  report_author: string;
  remarks: string;
  unit_system: string;
  region: string;
  solar_region: string;
  orientation_basis: string;
  orientation_deg: number;
  location_lat: number | null;
  location_lon: number | null;
  location_label: string;
  design_conditions: DesignCondition[];
  rooms: Room[];
  surfaces: Surface[];
  openings: Opening[];
  constructions: Construction[];
  glasses: Glass[];
  internal_loads: InternalLoad[];
  mechanical_loads: MechanicalLoad[];
  ventilation_infiltration: Ventilation[];
  systems: SystemEntity[];
  metadata: {
    correction_factors: CorrectionFactors;
    rounding: RoundingSettings;
  };
}

export interface CalcResult {
  major_cells: Record<string, number | null>;
  totals: Record<string, number>;
  traces: Array<{
    formula_id: string;
    entity_type: string;
    entity_id: string;
    inputs: Record<string, unknown>;
    references: Record<string, unknown>;
    intermediates: Record<string, unknown>;
    output: Record<string, unknown>;
  }>;
}
