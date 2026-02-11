// IndexedDB database configuration using Dexie

import Dexie, { Table } from 'dexie';
import {
  Project,
  Room,
  System,
  IndoorConditionMaster,
  LightingPowerMaster,
  OccupancyHeatMaster,
  EquipmentPowerMaster,
  NonAirConditionedTempDiffMaster,
  OverhangMaster,
  WindowGlassMaster,
  ExteriorWallMaster,
  RoofMaster,
  PilotiFloorMaster,
  InteriorWallMaster,
  CeilingFloorMaster,
  UndergroundWallMaster,
  EarthFloorMaster,
  MaterialMaster,
} from '../types';

export class HeatLoadDatabase extends Dexie {
  // Projects
  projects!: Table<Project, string>;

  // Rooms
  rooms!: Table<Room, string>;

  // Systems
  systems!: Table<System, string>;

  // Indoor master data
  indoorConditions!: Table<IndoorConditionMaster, string>;
  lightingPower!: Table<LightingPowerMaster, string>;
  occupancyHeat!: Table<OccupancyHeatMaster, string>;
  equipmentPower!: Table<EquipmentPowerMaster, string>;
  nonAirConditionedTempDiff!: Table<NonAirConditionedTempDiffMaster, string>;

  // Envelope master data
  overhangs!: Table<OverhangMaster, string>;
  windowGlass!: Table<WindowGlassMaster, string>;
  exteriorWalls!: Table<ExteriorWallMaster, string>;
  roofs!: Table<RoofMaster, string>;
  pilotiFloors!: Table<PilotiFloorMaster, string>;
  interiorWalls!: Table<InteriorWallMaster, string>;
  ceilingFloors!: Table<CeilingFloorMaster, string>;
  undergroundWalls!: Table<UndergroundWallMaster, string>;
  earthFloors!: Table<EarthFloorMaster, string>;
  materials!: Table<MaterialMaster, string>;

  constructor() {
    super('HeatLoadCalcDB');

    this.version(1).stores({
      // Projects
      projects: 'id, name, createdAt, updatedAt',

      // Rooms (with index on systemId for filtering)
      rooms: 'id, floor, roomNumber, systemNotes.systemId',

      // Systems
      systems: 'id, name, parentId, order',

      // Indoor master data
      indoorConditions: 'id, name',
      lightingPower: 'id, name',
      occupancyHeat: 'id, name',
      equipmentPower: 'id, name',
      nonAirConditionedTempDiff: 'id, name',

      // Envelope master data
      overhangs: 'id, name',
      windowGlass: 'id, name, glassCode',
      exteriorWalls: 'id, name, wallType',
      roofs: 'id, name, roofType',
      pilotiFloors: 'id, name, floorType',
      interiorWalls: 'id, name, wallType',
      ceilingFloors: 'id, name, elementType',
      undergroundWalls: 'id, name, wallType',
      earthFloors: 'id, name, floorType',
      materials: 'id, name',
    });
  }

  // Helper method to clear all data
  async clearAll(): Promise<void> {
    await Promise.all([
      this.projects.clear(),
      this.rooms.clear(),
      this.systems.clear(),
      this.indoorConditions.clear(),
      this.lightingPower.clear(),
      this.occupancyHeat.clear(),
      this.equipmentPower.clear(),
      this.nonAirConditionedTempDiff.clear(),
      this.overhangs.clear(),
      this.windowGlass.clear(),
      this.exteriorWalls.clear(),
      this.roofs.clear(),
      this.pilotiFloors.clear(),
      this.interiorWalls.clear(),
      this.ceilingFloors.clear(),
      this.undergroundWalls.clear(),
      this.earthFloors.clear(),
      this.materials.clear(),
    ]);
  }

  // Helper method to export all data
  async exportAllData(): Promise<any> {
    return {
      projects: await this.projects.toArray(),
      rooms: await this.rooms.toArray(),
      systems: await this.systems.toArray(),
      indoorConditions: await this.indoorConditions.toArray(),
      lightingPower: await this.lightingPower.toArray(),
      occupancyHeat: await this.occupancyHeat.toArray(),
      equipmentPower: await this.equipmentPower.toArray(),
      nonAirConditionedTempDiff: await this.nonAirConditionedTempDiff.toArray(),
      overhangs: await this.overhangs.toArray(),
      windowGlass: await this.windowGlass.toArray(),
      exteriorWalls: await this.exteriorWalls.toArray(),
      roofs: await this.roofs.toArray(),
      pilotiFloors: await this.pilotiFloors.toArray(),
      interiorWalls: await this.interiorWalls.toArray(),
      ceilingFloors: await this.ceilingFloors.toArray(),
      undergroundWalls: await this.undergroundWalls.toArray(),
      earthFloors: await this.earthFloors.toArray(),
      materials: await this.materials.toArray(),
    };
  }

  // Helper method to import all data
  async importAllData(data: any): Promise<void> {
    await this.transaction('rw', [
      this.projects,
      this.rooms,
      this.systems,
      this.indoorConditions,
      this.lightingPower,
      this.occupancyHeat,
      this.equipmentPower,
      this.nonAirConditionedTempDiff,
      this.overhangs,
      this.windowGlass,
      this.exteriorWalls,
      this.roofs,
      this.pilotiFloors,
      this.interiorWalls,
      this.ceilingFloors,
      this.undergroundWalls,
      this.earthFloors,
      this.materials,
    ], async () => {
      // Clear existing data
      await this.clearAll();

      // Import new data
      if (data.projects) await this.projects.bulkAdd(data.projects);
      if (data.rooms) await this.rooms.bulkAdd(data.rooms);
      if (data.systems) await this.systems.bulkAdd(data.systems);
      if (data.indoorConditions) await this.indoorConditions.bulkAdd(data.indoorConditions);
      if (data.lightingPower) await this.lightingPower.bulkAdd(data.lightingPower);
      if (data.occupancyHeat) await this.occupancyHeat.bulkAdd(data.occupancyHeat);
      if (data.equipmentPower) await this.equipmentPower.bulkAdd(data.equipmentPower);
      if (data.nonAirConditionedTempDiff) await this.nonAirConditionedTempDiff.bulkAdd(data.nonAirConditionedTempDiff);
      if (data.overhangs) await this.overhangs.bulkAdd(data.overhangs);
      if (data.windowGlass) await this.windowGlass.bulkAdd(data.windowGlass);
      if (data.exteriorWalls) await this.exteriorWalls.bulkAdd(data.exteriorWalls);
      if (data.roofs) await this.roofs.bulkAdd(data.roofs);
      if (data.pilotiFloors) await this.pilotiFloors.bulkAdd(data.pilotiFloors);
      if (data.interiorWalls) await this.interiorWalls.bulkAdd(data.interiorWalls);
      if (data.ceilingFloors) await this.ceilingFloors.bulkAdd(data.ceilingFloors);
      if (data.undergroundWalls) await this.undergroundWalls.bulkAdd(data.undergroundWalls);
      if (data.earthFloors) await this.earthFloors.bulkAdd(data.earthFloors);
      if (data.materials) await this.materials.bulkAdd(data.materials);
    });
  }
}

// Create a singleton instance
export const db = new HeatLoadDatabase();
