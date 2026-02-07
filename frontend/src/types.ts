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

export interface DesignCondition {
  id: string;
  season: Season;
  indoor_temp_c: number;
  indoor_rh_pct: number;
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

export interface Construction {
  id: string;
  name: string;
  u_value_w_m2k: number;
  wall_type?: string;
}

export interface Glass {
  id: string;
  name: string;
  solar_gain_key?: string;
  u_value_w_m2k?: number;
}

export interface InternalLoad {
  id: string;
  room_id: string;
  kind: "lighting" | "occupancy" | "equipment" | "other" | "internal_envelope" | "internal_solar";
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
  ventilation_infiltration: Ventilation[];
  systems: SystemEntity[];
  metadata: {
    correction_factors: CorrectionFactors;
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
