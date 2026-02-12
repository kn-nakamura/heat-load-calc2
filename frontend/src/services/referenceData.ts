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
    'material_thermal_constants',
    'glass_properties',
    'lighting_power_density',
    'occupancy_density',
  ];

  const results: Partial<ReferenceData> = {};

  await Promise.all(
    tables.map(async (tableName) => {
      try {
        const data = await api.getReferenceTable(tableName);
        results[tableName as keyof ReferenceData] = data;
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
 * Convert reference data indoor conditions to master data format
 */
export function convertIndoorConditionsToMaster(
  referenceData: Partial<ReferenceData>
): any[] {
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
