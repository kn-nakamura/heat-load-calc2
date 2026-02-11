// System store for managing system hierarchy

import { create } from 'zustand';
import { System, SystemTreeNode } from '../types';

interface SystemState {
  systems: System[];
  selectedSystemId: string | null;

  // Actions
  addSystem: (system: System) => void;
  updateSystem: (id: string, updates: Partial<System>) => void;
  deleteSystem: (id: string) => void;
  selectSystem: (id: string | null) => void;
  getSystem: (id: string) => System | undefined;

  // Room assignment
  assignRoomToSystem: (roomId: string, systemId: string) => void;
  removeRoomFromSystem: (roomId: string, systemId: string) => void;

  // Tree operations
  getSystemTree: () => SystemTreeNode[];
  getSystemsByParent: (parentId: string | null) => System[];

  // Load all systems
  loadSystems: (systems: System[]) => void;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  systems: [],
  selectedSystemId: null,

  addSystem: (system) =>
    set((state) => ({
      systems: [...state.systems, system],
    })),

  updateSystem: (id, updates) =>
    set((state) => ({
      systems: state.systems.map((system) =>
        system.id === id ? { ...system, ...updates, updatedAt: new Date() } : system
      ),
    })),

  deleteSystem: (id) =>
    set((state) => {
      // When deleting a system, remove it from all child systems' parentId
      const updatedSystems = state.systems
        .filter((system) => system.id !== id)
        .map((system) =>
          system.parentId === id ? { ...system, parentId: null } : system
        );

      return {
        systems: updatedSystems,
        selectedSystemId: state.selectedSystemId === id ? null : state.selectedSystemId,
      };
    }),

  selectSystem: (id) =>
    set({
      selectedSystemId: id,
    }),

  getSystem: (id) => {
    return get().systems.find((system) => system.id === id);
  },

  assignRoomToSystem: (roomId, systemId) =>
    set((state) => ({
      systems: state.systems.map((system) => {
        if (system.id === systemId) {
          // Add room to this system if not already present
          if (!system.roomIds.includes(roomId)) {
            return {
              ...system,
              roomIds: [...system.roomIds, roomId],
              updatedAt: new Date(),
            };
          }
        } else {
          // Remove room from other systems
          return {
            ...system,
            roomIds: system.roomIds.filter((id) => id !== roomId),
            updatedAt: new Date(),
          };
        }
        return system;
      }),
    })),

  removeRoomFromSystem: (roomId, systemId) =>
    set((state) => ({
      systems: state.systems.map((system) =>
        system.id === systemId
          ? {
              ...system,
              roomIds: system.roomIds.filter((id) => id !== roomId),
              updatedAt: new Date(),
            }
          : system
      ),
    })),

  getSystemsByParent: (parentId) => {
    return get().systems.filter((system) => system.parentId === parentId);
  },

  getSystemTree: () => {
    const { systems } = get();

    // Build tree structure
    const buildTree = (parentId: string | null): SystemTreeNode[] => {
      return systems
        .filter((system) => system.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((system) => {
          const children = buildTree(system.id);
          const totalRoomCount = system.roomIds.length +
            children.reduce((sum, child) => sum + child.totalRoomCount, 0);

          return {
            id: system.id,
            name: system.name,
            parentId: system.parentId,
            children,
            roomIds: system.roomIds,
            roomCount: system.roomIds.length,
            totalRoomCount,
            isExpanded: false, // Default collapsed
          };
        });
    };

    return buildTree(null);
  },

  loadSystems: (systems) =>
    set({
      systems,
    }),
}));
