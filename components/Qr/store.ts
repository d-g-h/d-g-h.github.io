"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type DisplayState = "show" | "hide" | "qrOnly";

export type QRRow = {
  id: string;
  dsp?: string;
  label: string;
  value: string;
  door?: number;
  svg: string;
  waveTime?: string;
};

export type QRLogRow = {
  id: string;
  dsp?: string;
  label: string;
  value: string;
  door?: number;
  waveTime?: string;
  inTime?: string;
  outTime?: string;
};

interface PersistedShape {
  input: string;
  doorsInput: string;
  doors: number[];
  doorAssignments: Record<number, string>; // door -> rowId
  rows: QRRow[];
  inProgress: QRRow[];
  displayStates: Record<string, DisplayState>;
  log: QRLogRow[];
  showTextarea: boolean;
  recentDepartureIds: string[];
  stagingOrder: string[];
}

interface QRStore {
  input: string;
  doorsInput: string;
  doors: number[];
  doorAssignments: Map<number, string>; // door -> rowId
  rows: QRRow[];
  inProgress: QRRow[];
  displayStates: Map<string, DisplayState>;
  loading: boolean;
  showTextarea: boolean;
  log: QRLogRow[];
  recentDepartureIds: string[];
  stagingOrder: string[];
  setInput: (input: string) => void;
  setDoorsInput: (input: string) => void;
  setDoors: (doors: number[]) => void;
  assignRowToDoor: (door: number, rowId: string | null) => void;
  setRows: (rows: QRRow[]) => void;
  setInProgress: (rows: QRRow[]) => void;
  setDisplayStates: (
    states:
      | Map<string, DisplayState>
      | ((prev: Map<string, DisplayState>) => Map<string, DisplayState>),
  ) => void;
  setLoading: (loading: boolean) => void;
  setShowTextarea: (show: boolean | ((prev: boolean) => boolean)) => void;
  addInLog: (row: QRRow) => void;
  addOutLog: (row: QRRow) => void;
  updateLogRow: (rowId: string, updates: Partial<QRLogRow>) => void;
  removeLogRow: (rowId: string) => void;
  bumpRecentDeparture: (rowId: string) => void;
  removeRecentDeparture: (rowId: string) => void;
  clearRecentDepartures: () => void;
  setStagingOrder: (order: string[]) => void;
}

const RECENT_DEPARTURE_LIMIT = 12;

const mapToObject = (map: Map<string, DisplayState>): Record<string, DisplayState> =>
  Object.fromEntries(Array.from(map.entries()));

const objectToMap = (obj: Record<string, DisplayState> | undefined): Map<string, DisplayState> =>
  new Map(Object.entries(obj ?? {}));

const doorMapToObject = (map: Map<number, string>): Record<number, string> =>
  Object.fromEntries(Array.from(map.entries()));

const objectToDoorMap = (obj: Record<number, string> | undefined): Map<number, string> =>
  new Map(Object.entries(obj ?? {}).map(([k, v]) => [Number(k), v]));

const useQRStore = create<QRStore>()(
  devtools(
    persist(
      (set) => ({
        input: "",
        doorsInput: "",
        doors: [],
        doorAssignments: new Map<number, string>(),
        rows: [],
        inProgress: [],
        displayStates: new Map<string, DisplayState>(),
        loading: false,
        showTextarea: true,
        log: [],
        recentDepartureIds: [],
        stagingOrder: [],
        setInput: (input: string) => set({ input }),
        setDoorsInput: (doorsInput: string) => set({ doorsInput }),
        setDoors: (doors: number[]) => set({ doors }),
        assignRowToDoor: (door: number, rowId: string | null) =>
          set((state) => {
            const newMap = new Map(state.doorAssignments);
            if (rowId === null) {
              newMap.delete(door);
            } else {
              // Remove rowId from any other door first
              for (const [d, id] of newMap.entries()) {
                if (id === rowId) newMap.delete(d);
              }
              newMap.set(door, rowId);
            }
            return { doorAssignments: newMap };
          }),
        setRows: (rows: QRRow[]) => set({ rows }),
        setInProgress: (inProgress: QRRow[]) => set({ inProgress }),
        setDisplayStates: (displayStates) =>
          set((state) => ({
            displayStates:
              typeof displayStates === "function"
                ? displayStates(state.displayStates)
                : displayStates,
          })),
        setLoading: (loading: boolean) => set({ loading }),
        setShowTextarea: (show: boolean | ((prev: boolean) => boolean)) =>
          set((state) => ({
            showTextarea: typeof show === "function" ? show(state.showTextarea) : show,
          })),
        addInLog: (row: QRRow) =>
          set((state) => {
            const now = new Date();
            const hours = now.getHours() % 12 || 12;
            const timeString = `${hours}:${now.getMinutes().toString().padStart(2, "0")}`;
            const existingIndex = state.log.findIndex((r) => r.id === row.id);
            if (existingIndex !== -1) {
              const updatedLog = [...state.log];
              updatedLog[existingIndex] = { ...updatedLog[existingIndex], inTime: timeString };
              return { log: updatedLog };
            }
            return { log: [...state.log, { ...row, inTime: timeString }] };
          }),
        addOutLog: (row: QRRow) =>
          set((state) => {
            const now = new Date();
            const hours = now.getHours() % 12 || 12;
            const timeString = `${hours}:${now.getMinutes().toString().padStart(2, "0")}`;
            const updated = state.log.map((r) =>
              r.id === row.id ? { ...r, outTime: timeString } : r,
            );
            return { log: updated };
          }),
        updateLogRow: (rowId: string, updates: Partial<QRLogRow>) =>
          set((state) => ({
            log: state.log.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
          })),
        removeLogRow: (rowId: string) =>
          set((state) => ({
            log: state.log.filter((row) => row.id !== rowId),
            recentDepartureIds: state.recentDepartureIds.filter((id) => id !== rowId),
          })),
        bumpRecentDeparture: (rowId: string) =>
          set((state) => {
            const next = [rowId, ...state.recentDepartureIds.filter((id) => id !== rowId)];
            return { recentDepartureIds: next.slice(0, RECENT_DEPARTURE_LIMIT) };
          }),
        removeRecentDeparture: (rowId: string) =>
          set((state) => ({
            recentDepartureIds: state.recentDepartureIds.filter((id) => id !== rowId),
          })),
        clearRecentDepartures: () => set({ recentDepartureIds: [] }),
        setStagingOrder: (stagingOrder: string[]) => set({ stagingOrder }),
      }),
      {
        name: "qr-store",
        partialize: (state): PersistedShape => ({
          input: state.input,
          doorsInput: state.doorsInput,
          doors: state.doors,
          doorAssignments: doorMapToObject(state.doorAssignments),
          rows: state.rows,
          inProgress: state.inProgress,
          displayStates: mapToObject(state.displayStates),
          log: state.log,
          showTextarea: state.showTextarea,
          recentDepartureIds: state.recentDepartureIds,
          stagingOrder: state.stagingOrder,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.displayStates = objectToMap(
              state.displayStates as unknown as Record<string, DisplayState>,
            );
            state.doorAssignments = objectToDoorMap(
              state.doorAssignments as unknown as Record<number, string>,
            );
          }
        },
      },
    ),
    { name: "QR Store" },
  ),
);

export default useQRStore;
