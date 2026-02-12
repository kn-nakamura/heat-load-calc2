// Backend calculation service

import { Project } from '../types/project';
import { Room } from '../types/room';
import { System } from '../types/system';
import { EquipmentPowerMaster, LightingPowerMaster, OccupancyHeatMaster } from '../types';
import { SystemLoadResult, RoomLoadResult } from '../types/system';
import { runCalculation, BackendCalcResult, BackendLoadVector, checkBackendHealth } from './api';
import { mapProjectToBackend } from './dataMapper';

/**
 * Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  return checkBackendHealth();
}

/**
 * Calculate loads using backend API
 */
interface BackendCalculationMasterData {
  lightingPower: LightingPowerMaster[];
  occupancyHeat: OccupancyHeatMaster[];
  equipmentPower: EquipmentPowerMaster[];
}

export async function calculateWithBackend(
  project: Project,
  rooms: Room[],
  systems: System[],
  masterData: BackendCalculationMasterData
): Promise<SystemLoadResult[]> {
  // Convert frontend data to backend format
  const backendProject = mapProjectToBackend(project, rooms, systems, masterData);

  // Call backend calculation
  const result = await runCalculation(backendProject);

  // Convert backend results to frontend format
  return convertBackendResults(result, systems);
}

/**
 * Convert backend calculation results to frontend format
 */
function convertBackendResults(backendResult: BackendCalcResult, systems: System[]): SystemLoadResult[] {
  const systemResults: SystemLoadResult[] = [];

  // Group rooms by system
  const roomsBySystem = new Map<string, RoomLoadResult[]>();

  backendResult.room_results.forEach((backendRoom) => {
    const roomResult = convertRoomResult(backendRoom);

    // Find which system this room belongs to
    const room = backendResult.room_results.find((r) => r.room_id === backendRoom.room_id);
    if (room) {
      // Find system from backend system results
      const systemId = backendResult.system_results.find((sys) => sys.room_ids.includes(backendRoom.room_id))?.system_id;

      if (systemId) {
        if (!roomsBySystem.has(systemId)) {
          roomsBySystem.set(systemId, []);
        }
        roomsBySystem.get(systemId)!.push(roomResult);
      }
    }
  });

  // Create system results
  backendResult.system_results.forEach((backendSystem) => {
    const system = systems.find((s) => s.id === backendSystem.system_id);
    if (!system) return;

    const roomLoads = roomsBySystem.get(backendSystem.system_id) || [];

    // Aggregate loads
    const summerSensible = (backendSystem.totals.cool_9 || 0) + (backendSystem.totals.cool_12 || 0);
    const summerLatent = backendSystem.totals.cool_latent || 0;
    const winterSensible = backendSystem.totals.heat_sensible || 0;
    const winterLatent = backendSystem.totals.heat_latent || 0;

    systemResults.push({
      systemId: backendSystem.system_id,
      systemName: backendSystem.system_name,
      summerSensibleLoad: summerSensible,
      summerLatentLoad: summerLatent,
      summerTotalLoad: summerSensible + summerLatent,
      winterSensibleLoad: winterSensible,
      winterLatentLoad: winterLatent,
      winterTotalLoad: winterSensible + winterLatent,
      outdoorAirVolume: 0, // Not directly available from backend
      exhaustAirVolume: 0,
      roomCount: backendSystem.room_ids.length,
      roomLoads,
    });
  });

  if (systemResults.length === 0 && backendResult.room_results.length > 0) {
    const roomLoads = backendResult.room_results.map((backendRoom) => convertRoomResult(backendRoom));

    const summerSensibleLoad = roomLoads.reduce((sum, room) => sum + room.summer.totalSensibleLoad, 0);
    const summerLatentLoad = roomLoads.reduce((sum, room) => sum + room.summer.totalLatentLoad, 0);
    const winterSensibleLoad = roomLoads.reduce((sum, room) => sum + room.winter.totalSensibleLoad, 0);
    const winterLatentLoad = roomLoads.reduce((sum, room) => sum + room.winter.totalLatentLoad, 0);

    systemResults.push({
      systemId: '__unassigned__',
      systemName: '未系統（全室集計）',
      summerSensibleLoad,
      summerLatentLoad,
      summerTotalLoad: summerSensibleLoad + summerLatentLoad,
      winterSensibleLoad,
      winterLatentLoad,
      winterTotalLoad: winterSensibleLoad + winterLatentLoad,
      outdoorAirVolume: 0,
      exhaustAirVolume: 0,
      roomCount: roomLoads.length,
      roomLoads,
    });
  }

  return systemResults;
}

/**
 * Convert backend room result to frontend format
 */
function convertRoomResult(backendRoom: any): RoomLoadResult {
  const envelopeLoads = backendRoom.envelope_loads as BackendLoadVector;
  const internalLoads = backendRoom.internal_loads as BackendLoadVector;
  const ventilationLoads = backendRoom.ventilation_loads as BackendLoadVector;

  // Summer loads
  const summerEnvelopeLoad = envelopeLoads.cool_9 + envelopeLoads.cool_12;
  const summerSolarLoad = 0; // Would need to separate from envelope
  const summerLightingLoad = internalLoads.cool_9; // Approximate
  const summerOccupancySensible = internalLoads.cool_12; // Approximate
  const summerOccupancyLatent = internalLoads.cool_latent;
  const summerEquipmentLoad = internalLoads.cool_14; // Approximate
  const summerOutdoorAirSensible = ventilationLoads.cool_9;
  const summerOutdoorAirLatent = ventilationLoads.cool_latent;

  const summerTotalSensible =
    summerEnvelopeLoad +
    summerSolarLoad +
    summerLightingLoad +
    summerOccupancySensible +
    summerEquipmentLoad +
    summerOutdoorAirSensible;
  const summerTotalLatent = summerOccupancyLatent + summerOutdoorAirLatent;

  // Winter loads
  const winterEnvelopeLoad = envelopeLoads.heat_sensible;
  const winterLightingLoad = internalLoads.heat_sensible * 0.3; // Approximate
  const winterOccupancySensible = internalLoads.heat_sensible * 0.3;
  const winterOccupancyLatent = internalLoads.heat_latent;
  const winterEquipmentLoad = internalLoads.heat_sensible * 0.4;
  const winterOutdoorAirSensible = ventilationLoads.heat_sensible;
  const winterOutdoorAirLatent = ventilationLoads.heat_latent;

  const winterTotalSensible = Math.max(
    0,
    winterEnvelopeLoad + winterOutdoorAirSensible - winterLightingLoad - winterOccupancySensible - winterEquipmentLoad
  );
  const winterTotalLatent = winterOccupancyLatent + winterOutdoorAirLatent;

  return {
    roomId: backendRoom.room_id,
    roomName: backendRoom.room_name,
    floor: '', // Not available from backend result
    summer: {
      envelopeLoad: summerEnvelopeLoad,
      solarLoad: summerSolarLoad,
      lightingLoad: summerLightingLoad,
      occupancySensibleLoad: summerOccupancySensible,
      occupancyLatentLoad: summerOccupancyLatent,
      equipmentLoad: summerEquipmentLoad,
      otherSensibleLoad: 0,
      otherLatentLoad: 0,
      outdoorAirSensibleLoad: summerOutdoorAirSensible,
      outdoorAirLatentLoad: summerOutdoorAirLatent,
      infiltrationSensibleLoad: 0,
      infiltrationLatentLoad: 0,
      totalSensibleLoad: summerTotalSensible,
      totalLatentLoad: summerTotalLatent,
      totalLoad: summerTotalSensible + summerTotalLatent,
    },
    winter: {
      envelopeLoad: winterEnvelopeLoad,
      lightingLoad: winterLightingLoad,
      occupancySensibleLoad: winterOccupancySensible,
      occupancyLatentLoad: winterOccupancyLatent,
      equipmentLoad: winterEquipmentLoad,
      otherSensibleLoad: 0,
      otherLatentLoad: 0,
      outdoorAirSensibleLoad: winterOutdoorAirSensible,
      outdoorAirLatentLoad: winterOutdoorAirLatent,
      infiltrationSensibleLoad: 0,
      infiltrationLatentLoad: 0,
      totalSensibleLoad: winterTotalSensible,
      totalLatentLoad: winterTotalLatent,
      totalLoad: winterTotalSensible + winterTotalLatent,
    },
    outdoorAirVolume: 0,
    infiltrationVolume: 0,
  };
}
