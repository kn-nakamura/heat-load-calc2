// Data mapper: Frontend types -> Backend types

import { Project as FrontendProject, DesignConditions } from '../types/project';
import { Room as FrontendRoom } from '../types/room';
import { System as FrontendSystem } from '../types/system';
import { BackendProject } from './api';

/**
 * Convert frontend project to backend project format
 */
export function mapProjectToBackend(
  project: FrontendProject,
  rooms: FrontendRoom[],
  systems: FrontendSystem[]
): BackendProject {
  const designConditions = mapDesignConditionsToBackend(project.designConditions);
  const backendRooms = rooms.map((room) => mapRoomToBackend(room));
  const backendSystems = systems.map((system) => mapSystemToBackend(system));

  // Extract surfaces from rooms
  const surfaces: any[] = [];
  const openings: any[] = [];

  rooms.forEach((room) => {
    room.envelope.rows.forEach((row, index) => {
      if (row.code && row.codeType) {
        const surfaceId = `${room.id}_surface_${index}`;

        // Add surface (wall/roof/floor)
        surfaces.push({
          id: surfaceId,
          room_id: room.id,
          kind: mapEnvelopeTypeToSurfaceKind(row.codeType),
          orientation: row.orientation || null,
          width_m: row.width,
          height_m: row.height,
          area_m2: row.area,
          adjacent_type: 'outdoor', // Simplified
          construction_id: row.code,
        });

        // If it's a window, add as opening
        if (row.codeType === 'window') {
          openings.push({
            id: `${room.id}_opening_${index}`,
            room_id: room.id,
            surface_id: surfaceId,
            orientation: row.orientation || null,
            width_m: row.width,
            height_m: row.height,
            area_m2: row.area,
            glass_id: row.code,
            shading_sc: 1.0,
            solar_area_ratio_pct: 100.0,
          });
        }
      }
    });
  });

  // Extract internal loads from rooms
  const internal_loads: any[] = [];
  rooms.forEach((room) => {
    // Lighting load
    if (room.indoorConditions?.lightingCode) {
      internal_loads.push({
        id: `${room.id}_lighting`,
        room_id: room.id,
        kind: 'lighting',
        sensible_w: 100, // Placeholder - should come from master data
        latent_w: 0,
      });
    }
    // Occupancy load
    if (room.indoorConditions?.occupancyCode) {
      internal_loads.push({
        id: `${room.id}_occupancy`,
        room_id: room.id,
        kind: 'occupancy',
        sensible_w: room.calculationConditions?.occupancyCount ? (room.calculationConditions.occupancyCount * 100) : 100,
        latent_w: room.calculationConditions?.occupancyCount ? (room.calculationConditions.occupancyCount * 50) : 50,
      });
    }
    // Equipment load
    if (room.indoorConditions?.equipmentCode) {
      internal_loads.push({
        id: `${room.id}_equipment`,
        room_id: room.id,
        kind: 'equipment',
        sensible_w: 100, // Placeholder - should come from master data
        latent_w: 0,
      });
    }
    // Other loads
    if (room.calculationConditions?.otherSensibleLoad || room.calculationConditions?.otherLatentLoad) {
      internal_loads.push({
        id: `${room.id}_other`,
        room_id: room.id,
        kind: 'other',
        sensible_w: room.calculationConditions?.otherSensibleLoad || 0,
        latent_w: room.calculationConditions?.otherLatentLoad || 0,
      });
    }
  });

  return {
    id: project.id,
    name: project.name,
    building_name: project.designConditions.buildingName,
    building_location: project.designConditions.buildingLocation,
    building_usage: project.designConditions.buildingUsage,
    building_structure: project.designConditions.buildingStructure,
    total_floor_area_m2: project.designConditions.totalFloorArea || undefined,
    floors_above: project.designConditions.floorsAbove || undefined,
    floors_below: project.designConditions.floorsBelow || undefined,
    report_author: project.designConditions.reportAuthor,
    remarks: project.designConditions.remarks,
    unit_system: project.designConditions.unitSystem,
    region: project.designConditions.region,
    solar_region: project.designConditions.solarRegion || project.designConditions.region,
    orientation_basis: project.designConditions.orientationBasis,
    orientation_deg: project.designConditions.orientationAngle,
    location_lat: project.designConditions.latitude || undefined,
    location_lon: project.designConditions.longitude || undefined,
    location_label: project.designConditions.locationLabel,
    design_conditions: designConditions,
    rooms: backendRooms,
    surfaces: surfaces,
    openings: openings,
    constructions: [], // Would need envelope master data
    glasses: [], // Would need glass master data
    internal_loads: internal_loads,
    mechanical_loads: [],
    ventilation_infiltration: [],
    systems: backendSystems,
  };
}

function mapDesignConditionsToBackend(conditions: DesignConditions): any[] {
  return [
    {
      id: 'default',
      summer_drybulb_c: conditions.outdoorSummer.dryBulbTemp,
      summer_rh_pct: conditions.outdoorSummer.relativeHumidity,
      summer_wetbulb_c: conditions.outdoorSummer.wetBulbTemp,
      summer_dewpoint_c: 0, // Not available in frontend
      summer_enthalpy_kj_per_kgda: conditions.outdoorSummer.enthalpy,
      summer_abs_humidity_kg_per_kgda: conditions.outdoorSummer.absoluteHumidity,
      winter_drybulb_c: conditions.outdoorWinter.dryBulbTemp,
      winter_rh_pct: conditions.outdoorWinter.relativeHumidity,
      winter_wetbulb_c: conditions.outdoorWinter.wetBulbTemp,
      winter_dewpoint_c: 0,
      winter_enthalpy_kj_per_kgda: conditions.outdoorWinter.enthalpy,
      winter_abs_humidity_kg_per_kgda: conditions.outdoorWinter.absoluteHumidity,
    },
  ];
}

function mapRoomToBackend(room: FrontendRoom): any {
  return {
    id: room.id,
    name: room.roomName,
    usage: null,
    floor: room.floor,
    area_m2: room.floorArea,
    ceiling_height_m: room.ceilingHeight,
    volume_m3: room.roomVolume,
    design_condition_id: 'default',
    system_id: room.systemNotes.systemId,
  };
}

function mapSystemToBackend(system: FrontendSystem): any {
  return {
    id: system.id,
    name: system.name,
    parent_id: system.parentId,
  };
}

function mapEnvelopeTypeToSurfaceKind(type: string): string {
  switch (type) {
    case 'wall':
      return 'wall';
    case 'roof':
      return 'roof';
    case 'floor':
      return 'floor';
    case 'glass':
      return 'wall'; // Glass is typically in walls
    default:
      return 'wall';
  }
}
