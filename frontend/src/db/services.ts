// Database service functions for syncing between stores and IndexedDB

import { db } from './database';
import {
  useProjectStore,
  useMasterDataStore,
  useRoomStore,
  useSystemStore,
  useUIStore,
} from '../stores';
import { fetchAllReferenceData, convertIndoorConditionsToMaster } from '../services/referenceData';

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

    // If no indoor conditions exist in DB, populate from reference data
    let finalIndoorConditions = indoorConditions;
    if (indoorConditions.length === 0) {
      console.log('No indoor conditions in DB, loading from reference data...');
      const { referenceData } = useProjectStore.getState();
      if (referenceData && referenceData.design_indoor_conditions) {
        const refConditions = convertIndoorConditionsToMaster(referenceData);
        console.log('Converted indoor conditions:', refConditions.length);
        if (refConditions.length > 0) {
          finalIndoorConditions = refConditions;
          // Save to DB for persistence
          await db.indoorConditions.bulkPut(refConditions);
          console.log('Saved indoor conditions to DB');
        }
      } else {
        console.warn('No reference data available for indoor conditions');
      }
    } else {
      console.log('Loaded indoor conditions from DB:', indoorConditions.length);
    }

    useMasterDataStore.getState().loadMasterData({
      indoorConditions: finalIndoorConditions,
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
export const sessionStateService = {
  saveState(): void {
    const { currentPage } = useUIStore.getState();
    const { currentProject } = useProjectStore.getState();

    sessionStorage.setItem('currentPage', currentPage);
    if (currentProject) {
      sessionStorage.setItem('currentProjectId', currentProject.id);
    }
  },

  async restoreState(): Promise<void> {
    const savedPage = sessionStorage.getItem('currentPage');
    const savedProjectId = sessionStorage.getItem('currentProjectId');

    if (savedPage) {
      useUIStore.getState().setCurrentPage(savedPage as any);
    }

    if (savedProjectId) {
      await projectService.loadProject(savedProjectId);
    }
  },

  clearState(): void {
    sessionStorage.removeItem('currentPage');
    sessionStorage.removeItem('currentProjectId');
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
