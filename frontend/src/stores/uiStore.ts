// UI state store for managing application UI state

import { create } from 'zustand';

export type PageId =
  | 'design-conditions'
  | 'region-data'
  | 'indoor-data'
  | 'glass-structure'
  | 'room-registration'
  | 'system-registration'
  | 'load-check';

export type IndoorDataTab =
  | 'indoor-conditions'
  | 'lighting-power'
  | 'occupancy-heat'
  | 'equipment-power'
  | 'non-air-conditioned-temp-diff';

export type GlassStructureTab =
  | 'overhang'
  | 'window-glass'
  | 'exterior-wall'
  | 'roof'
  | 'piloti-floor'
  | 'interior-wall'
  | 'ceiling-floor'
  | 'underground-wall'
  | 'earth-floor';

export type RoomTab =
  | 'envelope'
  | 'indoor-conditions'
  | 'calculation-conditions'
  | 'system-notes';

interface UIState {
  // Navigation
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;

  // Tab states
  indoorDataTab: IndoorDataTab;
  setIndoorDataTab: (tab: IndoorDataTab) => void;

  glassStructureTab: GlassStructureTab;
  setGlassStructureTab: (tab: GlassStructureTab) => void;

  roomTab: RoomTab;
  setRoomTab: (tab: RoomTab) => void;

  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Dialog states
  isDialogOpen: boolean;
  dialogType: string | null;
  openDialog: (type: string) => void;
  closeDialog: () => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Snackbar/notification state
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
  hideSnackbar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Navigation
  currentPage: 'design-conditions',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Tab states
  indoorDataTab: 'indoor-conditions',
  setIndoorDataTab: (tab) => set({ indoorDataTab: tab }),

  glassStructureTab: 'window-glass',
  setGlassStructureTab: (tab) => set({ glassStructureTab: tab }),

  roomTab: 'envelope',
  setRoomTab: (tab) => set({ roomTab: tab }),

  // Sidebar state (default closed on mobile, open on desktop)
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 900 : true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Dialog states
  isDialogOpen: false,
  dialogType: null,
  openDialog: (type) => set({ isDialogOpen: true, dialogType: type }),
  closeDialog: () => set({ isDialogOpen: false, dialogType: null }),

  // Loading state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Snackbar state
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
  showSnackbar: (message, severity) =>
    set({ snackbar: { open: true, message, severity } }),
  hideSnackbar: () =>
    set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
}));
