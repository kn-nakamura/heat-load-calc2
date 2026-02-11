// API client for backend services

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/v1';

export interface ApiError {
  detail: string | { issues: any[] };
}

// Backend types (simplified from schemas.py)
export interface BackendLoadVector {
  cool_9: number;
  cool_12: number;
  cool_14: number;
  cool_16: number;
  cool_latent: number;
  heat_sensible: number;
  heat_latent: number;
}

export interface BackendRoomLoadSummary {
  room_id: string;
  room_name: string;
  envelope_loads: BackendLoadVector;
  envelope_loads_by_orientation: Record<string, BackendLoadVector>;
  internal_loads: BackendLoadVector;
  ventilation_loads: BackendLoadVector;
  pre_correction: BackendLoadVector;
  post_correction: BackendLoadVector;
  final_totals: Record<string, number>;
}

export interface BackendSystemLoadSummary {
  system_id: string;
  system_name: string;
  room_ids: string[];
  totals: Record<string, number>;
}

export interface BackendCalcResult {
  major_cells: Record<string, number | null>;
  room_results: BackendRoomLoadSummary[];
  system_results: BackendSystemLoadSummary[];
  totals: Record<string, number>;
  traces: any[];
}

export interface BackendProject {
  id: string;
  name: string;
  building_name?: string;
  building_location?: string;
  building_usage?: string;
  building_structure?: string;
  total_floor_area_m2?: number;
  floors_above?: number;
  floors_below?: number;
  report_author?: string;
  remarks?: string;
  unit_system: string;
  region: string;
  solar_region?: string;
  orientation_basis: string;
  orientation_deg: number;
  location_lat?: number;
  location_lon?: number;
  location_label?: string;
  design_conditions: any[];
  rooms: any[];
  surfaces: any[];
  openings: any[];
  constructions: any[];
  glasses: any[];
  internal_loads: any[];
  mechanical_loads: any[];
  ventilation_infiltration: any[];
  systems: any[];
  metadata?: any;
}

/**
 * Run heat load calculation on the backend
 */
export async function runCalculation(project: BackendProject): Promise<BackendCalcResult> {
  const response = await fetch(`${API_BASE_URL}/calc/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ project }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(typeof error.detail === 'string' ? error.detail : 'Calculation failed');
  }

  return response.json();
}

/**
 * Get reference data table from backend
 */
export async function getReferenceTable(tableName: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/reference/${tableName}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch reference table: ${tableName}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get nearest region based on coordinates
 */
export async function getNearestRegion(
  lat: number,
  lon: number,
  tag?: string
): Promise<{
  region: string;
  lat: number;
  lon: number;
  distance_km: number;
  tags: string[];
}> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });
  if (tag) {
    params.append('tag', tag);
  }

  const response = await fetch(`${API_BASE_URL}/reference/nearest_region?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch nearest region');
  }

  return response.json();
}

/**
 * Validate project data
 */
export async function validateProject(project: BackendProject): Promise<{
  valid: boolean;
  issues: Array<{
    level: 'error' | 'warn';
    message: string;
    path?: string[];
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/projects/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    throw new Error('Validation request failed');
  }

  return response.json();
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    // Use /health endpoint (not under /v1)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
