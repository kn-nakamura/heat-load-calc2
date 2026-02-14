// Project store for managing project-level data

import { create } from 'zustand';
import { Project, DesignConditions, RegionClimateData } from '../types';
import { ReferenceData } from '../services/referenceData';

interface ProjectState {
  // Current project
  currentProject: Project | null;

  // Reference data from backend
  referenceData: Partial<ReferenceData> | null;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  updateDesignConditions: (conditions: Partial<DesignConditions>) => void;
  updateRegionClimateData: (data: RegionClimateData | null) => void;
  createNewProject: (name: string) => void;
  setReferenceData: (data: Partial<ReferenceData>) => void;
}

// Default design conditions
const defaultDesignConditions: DesignConditions = {
  buildingName: '',
  buildingLocation: '',
  buildingUsage: '',
  buildingStructure: '',
  totalFloorArea: null,
  floorsAbove: null,
  floorsBelow: null,
  reportAuthor: '',
  remarks: '',
  region: '6地域',
  solarRegion: '東京',
  latitude: null,
  longitude: null,
  locationLabel: '',
  orientationBasis: '真北',
  orientationAngle: 0,
  outdoorSummer: {
    dryBulbTemp: 33.2,
    relativeHumidity: 55.8,
    absoluteHumidity: 0.0174,
    enthalpy: 77.6,
    wetBulbTemp: 26.2,
  },
  outdoorWinter: {
    dryBulbTemp: -0.6,
    relativeHumidity: 62.0,
    absoluteHumidity: 0.0017,
    enthalpy: 3.7,
    wetBulbTemp: -2.3,
  },
  calculationMethod: '最大負荷法',
  unitSystem: 'SI',
};

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  referenceData: null,

  setCurrentProject: (project) => set({ currentProject: project }),

  updateDesignConditions: (conditions) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          designConditions: {
            ...state.currentProject.designConditions,
            ...conditions,
          },
          updatedAt: new Date(),
        },
      };
    }),

  updateRegionClimateData: (data) =>
    set((state) => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          regionClimateData: data,
          updatedAt: new Date(),
        },
      };
    }),

  createNewProject: (name) => {
    const now = new Date();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      designConditions: defaultDesignConditions,
      regionClimateData: null,
      createdAt: now,
      updatedAt: now,
      lastCalculatedAt: null,
    };
    set({ currentProject: newProject });
  },

  setReferenceData: (data) => set({ referenceData: data }),
}));
