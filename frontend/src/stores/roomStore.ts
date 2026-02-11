// Room store for managing room data

import { create } from 'zustand';
import { Room, EnvelopeRow } from '../types';

interface RoomState {
  rooms: Room[];
  selectedRoomId: string | null;

  // Actions
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  selectRoom: (id: string | null) => void;
  getRoom: (id: string) => Room | undefined;

  // Envelope actions
  addEnvelopeRow: (roomId: string, row: EnvelopeRow) => void;
  updateEnvelopeRow: (roomId: string, rowNumber: number, updates: Partial<EnvelopeRow>) => void;
  deleteEnvelopeRow: (roomId: string, rowNumber: number) => void;

  // Load all rooms
  loadRooms: (rooms: Room[]) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  selectedRoomId: null,

  addRoom: (room) =>
    set((state) => ({
      rooms: [...state.rooms, room],
    })),

  updateRoom: (id, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === id ? { ...room, ...updates, updatedAt: new Date() } : room
      ),
    })),

  deleteRoom: (id) =>
    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== id),
      selectedRoomId: state.selectedRoomId === id ? null : state.selectedRoomId,
    })),

  selectRoom: (id) =>
    set({
      selectedRoomId: id,
    }),

  getRoom: (id) => {
    return get().rooms.find((room) => room.id === id);
  },

  addEnvelopeRow: (roomId, row) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              envelope: {
                ...room.envelope,
                rows: [...room.envelope.rows, row],
              },
              updatedAt: new Date(),
            }
          : room
      ),
    })),

  updateEnvelopeRow: (roomId, rowNumber, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              envelope: {
                ...room.envelope,
                rows: room.envelope.rows.map((row) =>
                  row.rowNumber === rowNumber ? { ...row, ...updates } : row
                ),
              },
              updatedAt: new Date(),
            }
          : room
      ),
    })),

  deleteEnvelopeRow: (roomId, rowNumber) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              envelope: {
                ...room.envelope,
                rows: room.envelope.rows
                  .filter((row) => row.rowNumber !== rowNumber)
                  .map((row, index) => ({ ...row, rowNumber: index + 1 })), // Renumber rows
              },
              updatedAt: new Date(),
            }
          : room
      ),
    })),

  loadRooms: (rooms) =>
    set({
      rooms,
    }),
}));
