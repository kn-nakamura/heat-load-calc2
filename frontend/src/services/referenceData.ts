// Reference data service for fetching backend reference tables

import * as api from './api';

export interface IndoorConditionRecord {
  condition_name: string;
  summer: {
    drybulb_c: number;
    wetbulb_c: number;
    dewpoint_c: number;
    rh_pct: number;
    enthalpy_kj_per_kgda: number;
    abs_humidity_kg_per_kgda: number;
  };
  winter: {
    drybulb_c: number;
    wetbulb_c: number;
    dewpoint_c: number;
    rh_pct: number;
    enthalpy_kj_per_kgda: number;
    abs_humidity_kg_per_kgda: number;
  };
}

export interface OutdoorConditionRecord {
  city: string;
  cooling_drybulb_daily_max_c: number;
  cooling_drybulb_9_c: number;
  cooling_drybulb_12_c: number;
  cooling_drybulb_14_c: number;
  cooling_drybulb_16_c: number;
  cooling_wetbulb_daily_max_c: number;
  cooling_wetbulb_9_c: number;
  cooling_wetbulb_12_c: number;
  cooling_wetbulb_14_c: number;
  cooling_wetbulb_16_c: number;
  cooling_abs_humidity_9_g_per_kgda: number;
  cooling_abs_humidity_12_g_per_kgda: number;
  cooling_abs_humidity_14_g_per_kgda: number;
  cooling_abs_humidity_16_g_per_kgda: number;
  cooling_rh_9_pct: number;
  cooling_rh_12_pct: number;
  cooling_rh_14_pct: number;
  cooling_rh_16_pct: number;
  cooling_enthalpy_9_kj_per_kgda: number;
  cooling_enthalpy_12_kj_per_kgda: number;
  cooling_enthalpy_14_kj_per_kgda: number;
  cooling_enthalpy_16_kj_per_kgda: number;
  max_monthly_mean_daily_max_c: number;
  cooling_prevailing_wind_dir: string;
  heating_drybulb_c: number;
  heating_wetbulb_c: number;
  heating_abs_humidity_g_per_kgda: number;
  heating_rh_pct: number;
  heating_enthalpy_kj_per_kgda: number;
  min_monthly_mean_daily_min_c: number;
  heating_prevailing_wind_dir: string;
}

export interface LocationDataRecord {
  city: string;
  latitude_deg: number;
  longitude_deg: number;
}

export interface HeatingGroundTemperatureRecord {
  city: string;
  temperatures_c_by_depth_m: {
    [depth: string]: number;
  };
}

export interface ReferenceData {
  design_indoor_conditions: {
    metadata: any;
    records: IndoorConditionRecord[];
    units: any;
  };
  design_outdoor_conditions: {
    metadata: any;
    records: OutdoorConditionRecord[];
    units: any;
  };
  location_data: {
    metadata: any;
    records: LocationDataRecord[];
    units: any;
  };
  heating_ground_temperature?: {
    metadata: any;
    records: HeatingGroundTemperatureRecord[];
    units: any;
  };
  material_thermal_constants?: {
    metadata: any;
    records: any[];
    units: any;
  };
  glass_properties?: {
    metadata: any;
    records: any[];
    units: any;
  };
  lighting_power_density?: {
    metadata: any;
    records: any[];
    units: any;
  };
  occupancy_density?: {
    metadata: any;
    records: any[];
    units: any;
  };
}

/**
 * Fetch all reference data from backend
 */
export async function fetchAllReferenceData(): Promise<Partial<ReferenceData>> {
  const tables = [
    'design_indoor_conditions',
    'design_outdoor_conditions',
    'location_data',
    'heating_ground_temperature',
    'material_thermal_constants',
    'glass_properties',
    'lighting_power_density',
    'occupancy_density',
  ];

  const results: Partial<ReferenceData> = {};

  // Check backend availability first
  try {
    const isAvailable = await api.checkBackendHealth();
    if (!isAvailable) {
      console.warn('Backend is not available, skipping reference data fetch');
      return results;
    }
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return results;
  }

  await Promise.all(
    tables.map(async (tableName) => {
      try {
        const data = await api.getReferenceTable(tableName);
        results[tableName as keyof ReferenceData] = data;
        console.log(`Fetched ${tableName}:`, data.records?.length || 0, 'records');
      } catch (error) {
        console.warn(`Failed to fetch reference table: ${tableName}`, error);
      }
    })
  );

  return results;
}

/**
 * Get indoor conditions by name
 */
export function getIndoorConditionByName(
  referenceData: ReferenceData,
  name: string
): IndoorConditionRecord | null {
  const records = referenceData.design_indoor_conditions?.records || [];
  return records.find((r) => r.condition_name === name) || null;
}

/**
 * Get outdoor conditions by city
 */
export function getOutdoorConditionByCity(
  referenceData: ReferenceData,
  city: string
): OutdoorConditionRecord | null {
  const records = referenceData.design_outdoor_conditions?.records || [];
  return records.find((r) => r.city === city) || null;
}

/**
 * Find nearest location by coordinates using Haversine formula
 */
export function findNearestLocation(
  referenceData: ReferenceData,
  lat: number,
  lon: number
): { location: LocationDataRecord; distance: number } | null {
  const records = referenceData.location_data?.records || [];
  if (records.length === 0) return null;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  let nearest: LocationDataRecord | null = null;
  let minDistance = Infinity;

  for (const record of records) {
    const distance = haversine(lat, lon, record.latitude_deg, record.longitude_deg);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = record;
    }
  }

  return nearest ? { location: nearest, distance: minDistance } : null;
}

/**
 * Search locations by city name
 */
export function searchLocationsByCity(
  referenceData: ReferenceData,
  searchTerm: string
): LocationDataRecord[] {
  const records = referenceData.location_data?.records || [];
  if (!searchTerm) return records;

  return records.filter((r) => r.city.includes(searchTerm));
}

/**
 * Get ground temperature data by city
 */
export function getGroundTemperatureByCity(
  referenceData: ReferenceData,
  city: string
): HeatingGroundTemperatureRecord | null {
  const records = referenceData.heating_ground_temperature?.records || [];
  return records.find((r) => r.city === city) || null;
}

/**
 * Convert reference data indoor conditions to master data format
 */
export function convertIndoorConditionsToMaster(referenceData: Partial<ReferenceData>): any[] {
  const records = referenceData.design_indoor_conditions?.records || [];
  const now = new Date();

  return records.map((record, index) => ({
    id: `ref-indoor-${index}`,
    name: record.condition_name,
    summer: {
      dryBulbTemp: record.summer.drybulb_c,
      wetBulbTemp: record.summer.wetbulb_c,
      relativeHumidity: record.summer.rh_pct,
      absoluteHumidity: record.summer.abs_humidity_kg_per_kgda,
      enthalpy: record.summer.enthalpy_kj_per_kgda,
    },
    winter: {
      dryBulbTemp: record.winter.drybulb_c,
      wetBulbTemp: record.winter.wetbulb_c,
      relativeHumidity: record.winter.rh_pct,
      absoluteHumidity: record.winter.abs_humidity_kg_per_kgda,
      enthalpy: record.winter.enthalpy_kj_per_kgda,
    },
    remarks: '',
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Convert lighting power density to master data format
 */
export function convertLightingPowerToMaster(referenceData: Partial<ReferenceData>): any[] {
  const records = referenceData.lighting_power_density?.records || [];
  const now = new Date();

  return records.map((record: any, index: number) => ({
    id: `ref-lighting-${index}`,
    name: `${record.room_examples || '一般'} (${record.design_illuminance_lux}lx)`,
    designIlluminance: record.design_illuminance_lux || 500,
    powerDensity: {
      fluorescentDownlight: record.lighting_subtype === '下面開放形' ? record.power_w_per_m2 : 15,
      fluorescentLouver: record.lighting_subtype === 'ルーパー有' ? record.power_w_per_m2 : 18,
      fluorescentAcrylicCover: record.lighting_subtype === 'アクリルカバー有' ? record.power_w_per_m2 : 16,
      ledDownlight: record.power_w_per_m2 * 0.5 || 8,
      ledLouver: record.power_w_per_m2 * 0.5 || 10,
    },
    remarks: `${record.lighting_type} ${record.lighting_subtype}`,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Convert occupancy density to master data format
 */
export function convertOccupancyHeatToMaster(referenceData: Partial<ReferenceData>): any[] {
  const records = referenceData.occupancy_density?.records || [];
  const now = new Date();

  return records.map((record: any, index: number) => ({
    id: `ref-occupancy-${index}`,
    name: record.room_name || `室用途${index + 1}`,
    summer: {
      sensibleHeat: record.sensible_w_per_person || 60,
      latentHeat: record.latent_w_per_person || 50,
      totalHeat: (record.sensible_w_per_person || 60) + (record.latent_w_per_person || 50),
    },
    winter: {
      sensibleHeat: record.sensible_w_per_person || 60,
      latentHeat: record.latent_w_per_person || 50,
      totalHeat: (record.sensible_w_per_person || 60) + (record.latent_w_per_person || 50),
    },
    remarks: `人員密度: ${record.people_density_per_m2 || 0.15} 人/m²`,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Convert material thermal constants to master data format
 */
export function convertMaterialsToMaster(referenceData: Partial<ReferenceData>): any[] {
  const records = referenceData.material_thermal_constants?.records || [];
  const now = new Date();

  return records.map((record: any, index: number) => ({
    id: `ref-material-${index}`,
    name: record.material_name || `材料${index + 1}`,
    category: record.category || '一般材料',
    thermalConductivity: record.thermal_conductivity_w_per_mk || 1.0,
    volumetricHeatCapacity: record.volumetric_heat_capacity_kj_per_m3k || 1000.0,
    remarks: `材料番号: ${record.material_no || ''}`,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Convert glass properties to master data format
 */
export function convertWindowGlassToMaster(referenceData: Partial<ReferenceData>): any[] {
  const records = referenceData.glass_properties?.records || [];
  const now = new Date();

  // Group by glass_code to avoid duplicates
  const glassMap = new Map<string, any>();

  records.forEach((record: any) => {
    if (!glassMap.has(record.glass_code)) {
      glassMap.set(record.glass_code, {
        id: `ref-glass-${record.glass_code}`,
        name: record.glass_description || record.glass_code,
        glassCode: record.glass_code,
        glassType: record.glass_type || '複層ガラス',
        shadingCoefficient: record.sc_no_blind || 0.85,
        shadingCoefficientWithBlind: record.sc_light_blind || 0.5,
        uValue: record.u_value_glass_w_per_m2k || 3.5,
        remarks: `フレーム: ${record.frame_type || 'アルミ'}`,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  return Array.from(glassMap.values());
}
