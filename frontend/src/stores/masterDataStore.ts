// Master data store for indoor and envelope master data

import { create } from 'zustand';
import {
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

interface MasterDataState {
  // Indoor master data (屋内データ)
  indoorConditions: IndoorConditionMaster[];
  lightingPower: LightingPowerMaster[];
  occupancyHeat: OccupancyHeatMaster[];
  equipmentPower: EquipmentPowerMaster[];
  nonAirConditionedTempDiff: NonAirConditionedTempDiffMaster[];

  // Envelope master data (窓ガラス・構造体)
  overhangs: OverhangMaster[];
  windowGlass: WindowGlassMaster[];
  exteriorWalls: ExteriorWallMaster[];
  roofs: RoofMaster[];
  pilotiFloors: PilotiFloorMaster[];
  interiorWalls: InteriorWallMaster[];
  ceilingFloors: CeilingFloorMaster[];
  undergroundWalls: UndergroundWallMaster[];
  earthFloors: EarthFloorMaster[];
  materials: MaterialMaster[];

  // Actions for indoor master data
  addIndoorCondition: (condition: IndoorConditionMaster) => void;
  updateIndoorCondition: (id: string, condition: Partial<IndoorConditionMaster>) => void;
  deleteIndoorCondition: (id: string) => void;

  addLightingPower: (lighting: LightingPowerMaster) => void;
  updateLightingPower: (id: string, lighting: Partial<LightingPowerMaster>) => void;
  deleteLightingPower: (id: string) => void;

  addOccupancyHeat: (occupancy: OccupancyHeatMaster) => void;
  updateOccupancyHeat: (id: string, occupancy: Partial<OccupancyHeatMaster>) => void;
  deleteOccupancyHeat: (id: string) => void;

  addEquipmentPower: (equipment: EquipmentPowerMaster) => void;
  updateEquipmentPower: (id: string, equipment: Partial<EquipmentPowerMaster>) => void;
  deleteEquipmentPower: (id: string) => void;

  addNonAirConditionedTempDiff: (tempDiff: NonAirConditionedTempDiffMaster) => void;
  updateNonAirConditionedTempDiff: (id: string, tempDiff: Partial<NonAirConditionedTempDiffMaster>) => void;
  deleteNonAirConditionedTempDiff: (id: string) => void;

  // Actions for envelope master data
  addWindowGlass: (glass: WindowGlassMaster) => void;
  updateWindowGlass: (id: string, glass: Partial<WindowGlassMaster>) => void;
  deleteWindowGlass: (id: string) => void;

  addExteriorWall: (wall: ExteriorWallMaster) => void;
  updateExteriorWall: (id: string, wall: Partial<ExteriorWallMaster>) => void;
  deleteExteriorWall: (id: string) => void;

  addMaterial: (material: MaterialMaster) => void;
  updateMaterial: (id: string, material: Partial<MaterialMaster>) => void;
  deleteMaterial: (id: string) => void;

  // Load all master data
  loadMasterData: (data: Partial<MasterDataState>) => void;
}

export const useMasterDataStore = create<MasterDataState>((set) => ({
  // Initial state
  indoorConditions: [],
  lightingPower: [],
  occupancyHeat: [],
  equipmentPower: [],
  nonAirConditionedTempDiff: [],
  overhangs: [],
  windowGlass: [],
  exteriorWalls: [],
  roofs: [],
  pilotiFloors: [],
  interiorWalls: [],
  ceilingFloors: [],
  undergroundWalls: [],
  earthFloors: [],
  materials: [],

  // Indoor condition actions
  addIndoorCondition: (condition) =>
    set((state) => ({
      indoorConditions: [...state.indoorConditions, condition],
    })),

  updateIndoorCondition: (id, updates) =>
    set((state) => ({
      indoorConditions: state.indoorConditions.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteIndoorCondition: (id) =>
    set((state) => ({
      indoorConditions: state.indoorConditions.filter((item) => item.id !== id),
    })),

  // Lighting power actions
  addLightingPower: (lighting) =>
    set((state) => ({
      lightingPower: [...state.lightingPower, lighting],
    })),

  updateLightingPower: (id, updates) =>
    set((state) => ({
      lightingPower: state.lightingPower.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteLightingPower: (id) =>
    set((state) => ({
      lightingPower: state.lightingPower.filter((item) => item.id !== id),
    })),

  // Occupancy heat actions
  addOccupancyHeat: (occupancy) =>
    set((state) => ({
      occupancyHeat: [...state.occupancyHeat, occupancy],
    })),

  updateOccupancyHeat: (id, updates) =>
    set((state) => ({
      occupancyHeat: state.occupancyHeat.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteOccupancyHeat: (id) =>
    set((state) => ({
      occupancyHeat: state.occupancyHeat.filter((item) => item.id !== id),
    })),

  // Equipment power actions
  addEquipmentPower: (equipment) =>
    set((state) => ({
      equipmentPower: [...state.equipmentPower, equipment],
    })),

  updateEquipmentPower: (id, updates) =>
    set((state) => ({
      equipmentPower: state.equipmentPower.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteEquipmentPower: (id) =>
    set((state) => ({
      equipmentPower: state.equipmentPower.filter((item) => item.id !== id),
    })),

  // Non-air conditioned temp diff actions
  addNonAirConditionedTempDiff: (tempDiff) =>
    set((state) => ({
      nonAirConditionedTempDiff: [...state.nonAirConditionedTempDiff, tempDiff],
    })),

  updateNonAirConditionedTempDiff: (id, updates) =>
    set((state) => ({
      nonAirConditionedTempDiff: state.nonAirConditionedTempDiff.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteNonAirConditionedTempDiff: (id) =>
    set((state) => ({
      nonAirConditionedTempDiff: state.nonAirConditionedTempDiff.filter((item) => item.id !== id),
    })),

  // Window glass actions
  addWindowGlass: (glass) =>
    set((state) => ({
      windowGlass: [...state.windowGlass, glass],
    })),

  updateWindowGlass: (id, updates) =>
    set((state) => ({
      windowGlass: state.windowGlass.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteWindowGlass: (id) =>
    set((state) => ({
      windowGlass: state.windowGlass.filter((item) => item.id !== id),
    })),

  // Exterior wall actions
  addExteriorWall: (wall) =>
    set((state) => ({
      exteriorWalls: [...state.exteriorWalls, wall],
    })),

  updateExteriorWall: (id, updates) =>
    set((state) => ({
      exteriorWalls: state.exteriorWalls.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteExteriorWall: (id) =>
    set((state) => ({
      exteriorWalls: state.exteriorWalls.filter((item) => item.id !== id),
    })),

  // Material actions
  addMaterial: (material) =>
    set((state) => ({
      materials: [...state.materials, material],
    })),

  updateMaterial: (id, updates) =>
    set((state) => ({
      materials: state.materials.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    })),

  deleteMaterial: (id) =>
    set((state) => ({
      materials: state.materials.filter((item) => item.id !== id),
    })),

  // Load all master data
  loadMasterData: (data) =>
    set((state) => ({
      ...state,
      ...data,
    })),
}));
