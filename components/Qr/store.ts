"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type DisplayState = "show" | "hide" | "qrOnly";

export type QRRow = {
  id: string;
  label: string;
  value: string;
  door: number;
  svg: string;
  waveTime?: string;
};

export type QRLogRow = {
  id: string;
  label: string;
  value: string;
  door: number;
  waveTime?: string;
  inTime?: string;
  outTime?: string;
};

interface PersistedShape {
  input: string;
  rows: QRRow[];
  inProgress: QRRow[];
  displayStates: Record<string, DisplayState>;
  log: QRLogRow[];
  showTextarea: boolean;
  recentDepartureIds: string[];
}

interface QRStore {
  input: string;
  rows: QRRow[];
  inProgress: QRRow[];
  displayStates: Map<string, DisplayState>;
  loading: boolean;
  showTextarea: boolean;
  log: QRLogRow[];
  recentDepartureIds: string[];
  setInput: (input: string) => void;
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
  bumpRecentDeparture: (rowId: string) => void;
  removeRecentDeparture: (rowId: string) => void;
  clearRecentDepartures: () => void;
}

const RECENT_DEPARTURE_LIMIT = 12;

const mapToObject = (map: Map<string, DisplayState>): Record<string, DisplayState> =>
  Object.fromEntries(Array.from(map.entries()));

const objectToMap = (obj: Record<string, DisplayState> | undefined): Map<string, DisplayState> =>
  new Map(Object.entries(obj ?? {}));

const useQRStore = create<QRStore>()(
  devtools(
    persist(
      (set) => ({
        input: "",
        rows: [],
        inProgress: [],
        displayStates: new Map<string, DisplayState>(),
        loading: false,
        showTextarea: true,
        log: [],
        recentDepartureIds: [],
        setInput: (input: string) => set({ input }),
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
      }),
      {
        name: "qr-store",
        partialize: (state): PersistedShape => ({
          input: state.input,
          rows: state.rows,
          inProgress: state.inProgress,
          displayStates: mapToObject(state.displayStates),
          log: state.log,
          showTextarea: state.showTextarea,
          recentDepartureIds: state.recentDepartureIds,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.displayStates = objectToMap(
              state.displayStates as unknown as Record<string, DisplayState>,
            );
          }
        },
      },
    ),
    { name: "QR Store" },
  ),
);

export default useQRStore;
