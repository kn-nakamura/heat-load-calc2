// Heat load calculation service

import { Room } from '../types/room';
import { System } from '../types/system';
import { RoomLoadResult, SystemLoadResult } from '../types/system';
import { DesignConditions } from '../types/project';
import { RegionClimateData } from '../types';
import { LightingPowerMaster, OccupancyHeatMaster, EquipmentPowerMaster } from '../types';

/**
 * Calculate room heat loads
 * This is a simplified calculation framework
 * In a real implementation, this would include detailed thermodynamic calculations
 */
export function calculateRoomLoad(
  room: Room,
  designConditions: DesignConditions,
  climateData?: RegionClimateData,
  lightingPowerMaster?: LightingPowerMaster[],
  occupancyHeatMaster?: OccupancyHeatMaster[],
  equipmentPowerMaster?: EquipmentPowerMaster[]
): RoomLoadResult {
  const area = room.floorArea || 0;
  const volume = room.roomVolume || area * 2.7; // Assume 2.7m ceiling if volume not specified
  const occupancy = room.calculationConditions.occupancyDensity || 0;
  const totalOccupants = area * occupancy; // occupancy is per m²

  // Get design temperatures
  const summerOutdoor = designConditions.outdoorSummer.dryBulbTemp;
  const summerIndoor = 26; // Default indoor summer temp
  const winterOutdoor = designConditions.outdoorWinter.dryBulbTemp;
  const winterIndoor = 22; // Default indoor winter temp

  const summerDeltaT = Math.abs(summerOutdoor - summerIndoor);
  const winterDeltaT = Math.abs(winterIndoor - winterOutdoor);

  // Get master data items
  const selectedLighting = lightingPowerMaster?.find((item) => item.id === room.indoorConditions.lightingCode);
  const selectedOccupancy = occupancyHeatMaster?.find((item) => item.id === room.indoorConditions.occupancyCode);
  const selectedEquipment = equipmentPowerMaster?.find((item) => item.id === room.indoorConditions.equipmentCode);

  // Calculate lighting power density based on lighting type
  const getLightingPowerDensity = (): number => {
    if (!selectedLighting || !room.indoorConditions.lightingType) return 0;

    const typeMap: { [key: string]: keyof typeof selectedLighting.powerDensity } = {
      '蛍光灯ダウンライト': 'fluorescentDownlight',
      '蛍光灯ルーバ': 'fluorescentLouver',
      'LEDダウンライト': 'ledDownlight',
      'LEDルーバ': 'ledLouver',
    };

    const key = typeMap[room.indoorConditions.lightingType];
    return key ? selectedLighting.powerDensity[key] : 0;
  };

  const lightingPowerDensity = getLightingPowerDensity();
  const equipmentPowerDensity = selectedEquipment?.powerDensity || 0;

  // Simplified calculations (placeholder formulas)
  // Real implementation would use detailed heat transfer equations

  // Summer loads
  const summerEnvelopeLoad = area * 15 * summerDeltaT; // Simplified U*A*ΔT
  const summerSolarLoad = area * 100; // Simplified solar gain [W/m²]
  const summerLightingLoad = lightingPowerDensity * area; // W/m² × m²
  const summerOccupancySensible = selectedOccupancy ? selectedOccupancy.summer.sensibleHeat * totalOccupants : 0;
  const summerOccupancyLatent = selectedOccupancy ? selectedOccupancy.summer.latentHeat * totalOccupants : 0;
  const summerEquipmentLoad = equipmentPowerDensity * area; // W/m² × m²
  const summerOtherSensible = room.calculationConditions.otherSensibleLoad || 0;
  const summerOtherLatent = room.calculationConditions.otherLatentLoad || 0;

  const summerOutdoorAirSensible = (room.calculationConditions.outdoorAirVolume || 0) * 1.2 * 1.005 * summerDeltaT;
  const summerOutdoorAirLatent = (room.calculationConditions.outdoorAirVolume || 0) * 1.2 * 2500 * 0.005; // Simplified
  const summerInfiltrationSensible = (room.calculationConditions.infiltrationVolume || 0) * 1.2 * 1.005 * summerDeltaT;
  const summerInfiltrationLatent = (room.calculationConditions.infiltrationVolume || 0) * 1.2 * 2500 * 0.003;

  const summerTotalSensible =
    summerEnvelopeLoad +
    summerSolarLoad +
    summerLightingLoad +
    summerOccupancySensible +
    summerEquipmentLoad +
    summerOtherSensible +
    summerOutdoorAirSensible +
    summerInfiltrationSensible;

  const summerTotalLatent =
    summerOccupancyLatent + summerOtherLatent + summerOutdoorAirLatent + summerInfiltrationLatent;

  // Winter loads (heating)
  const winterEnvelopeLoad = area * 15 * winterDeltaT;
  const winterLightingLoad = lightingPowerDensity * area; // W/m² × m²
  const winterOccupancySensible = selectedOccupancy ? selectedOccupancy.winter.sensibleHeat * totalOccupants : 0;
  const winterOccupancyLatent = selectedOccupancy ? selectedOccupancy.winter.latentHeat * totalOccupants : 0;
  const winterEquipmentLoad = equipmentPowerDensity * area; // W/m² × m²
  const winterOtherSensible = room.calculationConditions.otherSensibleLoad || 0;
  const winterOtherLatent = room.calculationConditions.otherLatentLoad || 0;

  const winterOutdoorAirSensible = (room.calculationConditions.outdoorAirVolume || 0) * 1.2 * 1.005 * winterDeltaT;
  const winterOutdoorAirLatent = (room.calculationConditions.outdoorAirVolume || 0) * 1.2 * 2500 * 0.003;
  const winterInfiltrationSensible = (room.calculationConditions.infiltrationVolume || 0) * 1.2 * 1.005 * winterDeltaT;
  const winterInfiltrationLatent = (room.calculationConditions.infiltrationVolume || 0) * 1.2 * 2500 * 0.002;

  // Winter: subtract internal gains from heating load
  const winterTotalSensible = Math.max(
    0,
    winterEnvelopeLoad +
      winterOutdoorAirSensible +
      winterInfiltrationSensible -
      winterLightingLoad -
      winterOccupancySensible -
      winterEquipmentLoad -
      winterOtherSensible
  );

  const winterTotalLatent =
    winterOccupancyLatent + winterOtherLatent + winterOutdoorAirLatent + winterInfiltrationLatent;

  return {
    roomId: room.id,
    roomName: room.roomName,
    floor: room.floor,
    summer: {
      envelopeLoad: summerEnvelopeLoad,
      solarLoad: summerSolarLoad,
      lightingLoad: summerLightingLoad,
      occupancySensibleLoad: summerOccupancySensible,
      occupancyLatentLoad: summerOccupancyLatent,
      equipmentLoad: summerEquipmentLoad,
      otherSensibleLoad: summerOtherSensible,
      otherLatentLoad: summerOtherLatent,
      outdoorAirSensibleLoad: summerOutdoorAirSensible,
      outdoorAirLatentLoad: summerOutdoorAirLatent,
      infiltrationSensibleLoad: summerInfiltrationSensible,
      infiltrationLatentLoad: summerInfiltrationLatent,
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
      otherSensibleLoad: winterOtherSensible,
      otherLatentLoad: winterOtherLatent,
      outdoorAirSensibleLoad: winterOutdoorAirSensible,
      outdoorAirLatentLoad: winterOutdoorAirLatent,
      infiltrationSensibleLoad: winterInfiltrationSensible,
      infiltrationLatentLoad: winterInfiltrationLatent,
      totalSensibleLoad: winterTotalSensible,
      totalLatentLoad: winterTotalLatent,
      totalLoad: winterTotalSensible + winterTotalLatent,
    },
    outdoorAirVolume: room.calculationConditions.outdoorAirVolume || 0,
    infiltrationVolume: room.calculationConditions.infiltrationVolume || 0,
  };
}

/**
 * Calculate system heat loads by aggregating room loads
 */
export function calculateSystemLoad(
  system: System,
  rooms: Room[],
  designConditions: DesignConditions,
  climateData?: RegionClimateData,
  lightingPowerMaster?: LightingPowerMaster[],
  occupancyHeatMaster?: OccupancyHeatMaster[],
  equipmentPowerMaster?: EquipmentPowerMaster[]
): SystemLoadResult {
  // Get rooms assigned to this system
  const systemRooms = rooms.filter((room) => system.roomIds.includes(room.id));

  // Calculate load for each room
  const roomLoads = systemRooms.map((room) =>
    calculateRoomLoad(room, designConditions, climateData, lightingPowerMaster, occupancyHeatMaster, equipmentPowerMaster)
  );

  // Aggregate loads
  const summerSensibleLoad = roomLoads.reduce((sum, r) => sum + r.summer.totalSensibleLoad, 0);
  const summerLatentLoad = roomLoads.reduce((sum, r) => sum + r.summer.totalLatentLoad, 0);
  const winterSensibleLoad = roomLoads.reduce((sum, r) => sum + r.winter.totalSensibleLoad, 0);
  const winterLatentLoad = roomLoads.reduce((sum, r) => sum + r.winter.totalLatentLoad, 0);
  const outdoorAirVolume = roomLoads.reduce((sum, r) => sum + r.outdoorAirVolume, 0);
  const exhaustAirVolume = roomLoads.reduce((sum, r) => sum + r.outdoorAirVolume, 0); // Simplified

  return {
    systemId: system.id,
    systemName: system.name,
    summerSensibleLoad,
    summerLatentLoad,
    summerTotalLoad: summerSensibleLoad + summerLatentLoad,
    winterSensibleLoad,
    winterLatentLoad,
    winterTotalLoad: winterSensibleLoad + winterLatentLoad,
    outdoorAirVolume,
    exhaustAirVolume,
    roomCount: systemRooms.length,
    roomLoads,
  };
}

/**
 * Calculate all system loads
 */
export function calculateAllSystemLoads(
  systems: System[],
  rooms: Room[],
  designConditions: DesignConditions,
  climateData?: RegionClimateData,
  lightingPowerMaster?: LightingPowerMaster[],
  occupancyHeatMaster?: OccupancyHeatMaster[],
  equipmentPowerMaster?: EquipmentPowerMaster[]
): SystemLoadResult[] {
  if (systems.length === 0) {
    const roomLoads = rooms.map((room) =>
      calculateRoomLoad(room, designConditions, climateData, lightingPowerMaster, occupancyHeatMaster, equipmentPowerMaster)
    );

    const summerSensibleLoad = roomLoads.reduce((sum, r) => sum + r.summer.totalSensibleLoad, 0);
    const summerLatentLoad = roomLoads.reduce((sum, r) => sum + r.summer.totalLatentLoad, 0);
    const winterSensibleLoad = roomLoads.reduce((sum, r) => sum + r.winter.totalSensibleLoad, 0);
    const winterLatentLoad = roomLoads.reduce((sum, r) => sum + r.winter.totalLatentLoad, 0);
    const outdoorAirVolume = roomLoads.reduce((sum, r) => sum + r.outdoorAirVolume, 0);

    return [
      {
        systemId: '__unassigned__',
        systemName: '未系統（全室集計）',
        summerSensibleLoad,
        summerLatentLoad,
        summerTotalLoad: summerSensibleLoad + summerLatentLoad,
        winterSensibleLoad,
        winterLatentLoad,
        winterTotalLoad: winterSensibleLoad + winterLatentLoad,
        outdoorAirVolume,
        exhaustAirVolume: outdoorAirVolume,
        roomCount: roomLoads.length,
        roomLoads,
      },
    ];
  }

  return systems.map((system) =>
    calculateSystemLoad(system, rooms, designConditions, climateData, lightingPowerMaster, occupancyHeatMaster, equipmentPowerMaster)
  );
}
