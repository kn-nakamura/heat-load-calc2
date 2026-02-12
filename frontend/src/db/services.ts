// Database service functions for syncing between stores and IndexedDB

import { db } from './database';
import {
  useProjectStore,
  useMasterDataStore,
  useRoomStore,
  useSystemStore,
  useUIStore,
} from '../stores';
import {
  fetchAllReferenceData,
  convertIndoorConditionsToMaster,
  convertLightingPowerToMaster,
  convertOccupancyHeatToMaster,
  convertMaterialsToMaster,
  convertWindowGlassToMaster,
} from '../services/referenceData';

// Project services
export const projectService = {
  async loadProject(projectId: string): Promise<void> {
    const project = await db.projects.get(projectId);
    if (project) {
      useProjectStore.getState().setCurrentProject(project);
    }
  },

  async saveProject(): Promise<void> {
    const { currentProject } = useProjectStore.getState();
    if (currentProject) {
      await db.projects.put(currentProject);
    }
  },

  async createProject(name: string): Promise<string> {
    useProjectStore.getState().createNewProject(name);
    const { currentProject } = useProjectStore.getState();
    if (currentProject) {
      await db.projects.add(currentProject);
      return currentProject.id;
    }
    throw new Error('Failed to create project');
  },

  async deleteProject(projectId: string): Promise<void> {
    await db.projects.delete(projectId);
  },

  async listProjects() {
    return await db.projects.toArray();
  },
};

// Master data services
export const masterDataService = {
  async loadAllMasterData(): Promise<void> {
    const [
      indoorConditions,
      lightingPower,
      occupancyHeat,
      equipmentPower,
      nonAirConditionedTempDiff,
      overhangs,
      windowGlass,
      exteriorWalls,
      roofs,
      pilotiFloors,
      interiorWalls,
      ceilingFloors,
      undergroundWalls,
      earthFloors,
      materials,
    ] = await Promise.all([
      db.indoorConditions.toArray(),
      db.lightingPower.toArray(),
      db.occupancyHeat.toArray(),
      db.equipmentPower.toArray(),
      db.nonAirConditionedTempDiff.toArray(),
      db.overhangs.toArray(),
      db.windowGlass.toArray(),
      db.exteriorWalls.toArray(),
      db.roofs.toArray(),
      db.pilotiFloors.toArray(),
      db.interiorWalls.toArray(),
      db.ceilingFloors.toArray(),
      db.undergroundWalls.toArray(),
      db.earthFloors.toArray(),
      db.materials.toArray(),
    ]);

    const { referenceData } = useProjectStore.getState();

    // If no data exists in DB, populate from reference data
    let finalIndoorConditions = indoorConditions;
    let finalLightingPower = lightingPower;
    let finalOccupancyHeat = occupancyHeat;
    let finalMaterials = materials;
    let finalWindowGlass = windowGlass;

    // Indoor conditions
    if (indoorConditions.length === 0 && referenceData?.design_indoor_conditions) {
      console.log('Loading indoor conditions from reference data...');
      const refConditions = convertIndoorConditionsToMaster(referenceData);
      if (refConditions.length > 0) {
        finalIndoorConditions = refConditions;
        await db.indoorConditions.bulkPut(refConditions);
        console.log('Saved indoor conditions:', refConditions.length);
      }
    } else {
      console.log('Loaded indoor conditions from DB:', indoorConditions.length);
    }

    // Lighting power
    if (lightingPower.length === 0 && referenceData?.lighting_power_density) {
      console.log('Loading lighting power from reference data...');
      const refLighting = convertLightingPowerToMaster(referenceData);
      if (refLighting.length > 0) {
        finalLightingPower = refLighting;
        await db.lightingPower.bulkPut(refLighting);
        console.log('Saved lighting power:', refLighting.length);
      }
    } else {
      console.log('Loaded lighting power from DB:', lightingPower.length);
    }

    // Occupancy heat
    if (occupancyHeat.length === 0 && referenceData?.occupancy_density) {
      console.log('Loading occupancy heat from reference data...');
      const refOccupancy = convertOccupancyHeatToMaster(referenceData);
      if (refOccupancy.length > 0) {
        finalOccupancyHeat = refOccupancy;
        await db.occupancyHeat.bulkPut(refOccupancy);
        console.log('Saved occupancy heat:', refOccupancy.length);
      }
    } else {
      console.log('Loaded occupancy heat from DB:', occupancyHeat.length);
    }

    // Materials
    if (materials.length === 0 && referenceData?.material_thermal_constants) {
      console.log('Loading materials from reference data...');
      const refMaterials = convertMaterialsToMaster(referenceData);
      if (refMaterials.length > 0) {
        finalMaterials = refMaterials;
        await db.materials.bulkPut(refMaterials);
        console.log('Saved materials:', refMaterials.length);
      }
    } else {
      console.log('Loaded materials from DB:', materials.length);
    }

    // Window glass
    if (windowGlass.length === 0 && referenceData?.glass_properties) {
      console.log('Loading window glass from reference data...');
      const refGlass = convertWindowGlassToMaster(referenceData);
      if (refGlass.length > 0) {
        finalWindowGlass = refGlass;
        await db.windowGlass.bulkPut(refGlass);
        console.log('Saved window glass:', refGlass.length);
      }
    } else {
      console.log('Loaded window glass from DB:', windowGlass.length);
    }

    useMasterDataStore.getState().loadMasterData({
      indoorConditions: finalIndoorConditions,
      lightingPower: finalLightingPower,
      occupancyHeat: finalOccupancyHeat,
      equipmentPower,
      nonAirConditionedTempDiff,
      overhangs,
      windowGlass: finalWindowGlass,
      exteriorWalls,
      roofs,
      pilotiFloors,
      interiorWalls,
      ceilingFloors,
      undergroundWalls,
      earthFloors,
      materials: finalMaterials,
    });
  },

  async saveAllMasterData(): Promise<void> {
    const state = useMasterDataStore.getState();
    await Promise.all([
      db.indoorConditions.bulkPut(state.indoorConditions),
      db.lightingPower.bulkPut(state.lightingPower),
      db.occupancyHeat.bulkPut(state.occupancyHeat),
      db.equipmentPower.bulkPut(state.equipmentPower),
      db.nonAirConditionedTempDiff.bulkPut(state.nonAirConditionedTempDiff),
      db.overhangs.bulkPut(state.overhangs),
      db.windowGlass.bulkPut(state.windowGlass),
      db.exteriorWalls.bulkPut(state.exteriorWalls),
      db.roofs.bulkPut(state.roofs),
      db.pilotiFloors.bulkPut(state.pilotiFloors),
      db.interiorWalls.bulkPut(state.interiorWalls),
      db.ceilingFloors.bulkPut(state.ceilingFloors),
      db.undergroundWalls.bulkPut(state.undergroundWalls),
      db.earthFloors.bulkPut(state.earthFloors),
      db.materials.bulkPut(state.materials),
    ]);
  },
};

// Room services
export const roomService = {
  async loadAllRooms(): Promise<void> {
    const rooms = await db.rooms.toArray();
    useRoomStore.getState().loadRooms(rooms);
  },

  async saveRoom(roomId: string): Promise<void> {
    const room = useRoomStore.getState().getRoom(roomId);
    if (room) {
      await db.rooms.put(room);
    }
  },

  async saveAllRooms(): Promise<void> {
    const { rooms } = useRoomStore.getState();
    await db.rooms.bulkPut(rooms);
  },

  async deleteRoom(roomId: string): Promise<void> {
    await db.rooms.delete(roomId);
    useRoomStore.getState().deleteRoom(roomId);
  },
};

// System services
export const systemService = {
  async loadAllSystems(): Promise<void> {
    const systems = await db.systems.toArray();
    useSystemStore.getState().loadSystems(systems);
  },

  async saveSystem(systemId: string): Promise<void> {
    const system = useSystemStore.getState().getSystem(systemId);
    if (system) {
      await db.systems.put(system);
    }
  },

  async saveAllSystems(): Promise<void> {
    const { systems } = useSystemStore.getState();
    await db.systems.bulkPut(systems);
  },

  async deleteSystem(systemId: string): Promise<void> {
    await db.systems.delete(systemId);
    useSystemStore.getState().deleteSystem(systemId);
  },
};

// Reference data services
export const referenceDataService = {
  async loadReferenceData(): Promise<void> {
    try {
      console.log('Loading reference data from backend...');
      const referenceData = await fetchAllReferenceData();
      console.log('Reference data loaded:', {
        indoor: referenceData.design_indoor_conditions?.records?.length || 0,
        outdoor: referenceData.design_outdoor_conditions?.records?.length || 0,
        locations: referenceData.location_data?.records?.length || 0,
      });
      useProjectStore.getState().setReferenceData(referenceData);
    } catch (error) {
      console.error('Failed to load reference data:', error);
      // Continue even if reference data fails to load
    }
  },
};

// Session state services (for persisting page state on reload)
const STORAGE_KEYS = {
  currentPage: 'currentPage',
  currentProjectId: 'currentProjectId',
} as const;

const PAGE_IDS = new Set([
  'design-conditions',
  'region-data',
  'indoor-data',
  'glass-structure',
  'room-registration',
  'system-registration',
  'load-check',
]);

const isValidPageId = (value: string | null): value is ReturnType<typeof useUIStore.getState>['currentPage'] => {
  return typeof value === 'string' && PAGE_IDS.has(value);
};

export const sessionStateService = {
  saveState(): void {
    const { currentPage } = useUIStore.getState();
    const { currentProject } = useProjectStore.getState();

    try {
      localStorage.setItem(STORAGE_KEYS.currentPage, currentPage);

      if (currentProject) {
        localStorage.setItem(STORAGE_KEYS.currentProjectId, currentProject.id);
      }
    } catch (error) {
      console.warn('Session state save skipped because storage is unavailable:', error);
    }
  },

  async restoreState(): Promise<void> {
    let savedPage: string | null = null;
    let savedProjectId: string | null = null;

    try {
      savedPage =
        localStorage.getItem(STORAGE_KEYS.currentPage) ?? sessionStorage.getItem(STORAGE_KEYS.currentPage);
      savedProjectId =
        localStorage.getItem(STORAGE_KEYS.currentProjectId) ?? sessionStorage.getItem(STORAGE_KEYS.currentProjectId);
    } catch (error) {
      console.warn('Session state restore skipped because storage is unavailable:', error);
      return;
    }

    if (savedProjectId) {
      await projectService.loadProject(savedProjectId);
    }

    const hasProject = useProjectStore.getState().currentProject !== null;
    if (isValidPageId(savedPage) && (savedPage === 'design-conditions' || hasProject)) {
      useUIStore.getState().setCurrentPage(savedPage);
      return;
    }

    if (!hasProject) {
      useUIStore.getState().setCurrentPage('design-conditions');
    }
  },

  clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.currentPage);
      localStorage.removeItem(STORAGE_KEYS.currentProjectId);
      sessionStorage.removeItem(STORAGE_KEYS.currentPage);
      sessionStorage.removeItem(STORAGE_KEYS.currentProjectId);
    } catch (error) {
      console.warn('Session state clear skipped because storage is unavailable:', error);
    }
  },
};

// Application initialization
export const appService = {
  async initialize(): Promise<void> {
    // Load reference data first (needed for default master data)
    await referenceDataService.loadReferenceData();

    // Load all data from IndexedDB into stores
    await Promise.all([
      masterDataService.loadAllMasterData(),
      roomService.loadAllRooms(),
      systemService.loadAllSystems(),
    ]);

    // Restore session state after data is loaded
    await sessionStateService.restoreState();
  },

  async saveAll(): Promise<void> {
    // Save all data from stores to IndexedDB
    await Promise.all([
      projectService.saveProject(),
      masterDataService.saveAllMasterData(),
      roomService.saveAllRooms(),
      systemService.saveAllSystems(),
    ]);

    // Save session state
    sessionStateService.saveState();
  },

  async exportData(): Promise<string> {
    const data = await db.exportAllData();
    return JSON.stringify(data, null, 2);
  },

  async importData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    await db.importAllData(data);
    await this.initialize();
  },
};
