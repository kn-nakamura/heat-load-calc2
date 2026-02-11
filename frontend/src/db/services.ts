// Database service functions for syncing between stores and IndexedDB

import { db } from './database';
import {
  useProjectStore,
  useMasterDataStore,
  useRoomStore,
  useSystemStore,
} from '../stores';

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

    useMasterDataStore.getState().loadMasterData({
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

// Application initialization
export const appService = {
  async initialize(): Promise<void> {
    // Load all data from IndexedDB into stores
    await Promise.all([
      masterDataService.loadAllMasterData(),
      roomService.loadAllRooms(),
      systemService.loadAllSystems(),
    ]);
  },

  async saveAll(): Promise<void> {
    // Save all data from stores to IndexedDB
    await Promise.all([
      projectService.saveProject(),
      masterDataService.saveAllMasterData(),
      roomService.saveAllRooms(),
      systemService.saveAllSystems(),
    ]);
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
