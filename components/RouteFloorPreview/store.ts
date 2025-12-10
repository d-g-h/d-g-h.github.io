"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type FloorRouteOverrides = Record<string, string>;

type FloorRouteOverrideState = {
  overrides: FloorRouteOverrides;
  setOverrides: (
    overrides: FloorRouteOverrides | ((prev: FloorRouteOverrides) => FloorRouteOverrides),
  ) => void;
  setOverride: (route: string, slotId: string | null) => void;
  clearOverrides: () => void;
};

export const useFloorRouteOverridesStore = create<FloorRouteOverrideState>()(
  devtools(
    persist(
      (set) => ({
        overrides: {},
        setOverrides: (overrides) =>
          set((state) => ({
            overrides: typeof overrides === "function" ? overrides(state.overrides) : overrides,
          })),
        setOverride: (route, slotId) =>
          set((state) => {
            const next = { ...state.overrides };
            if (!slotId) delete next[route];
            else next[route] = slotId;
            return { overrides: next };
          }),
        clearOverrides: () => set({ overrides: {} }),
      }),
      {
        name: "floor-route-overrides",
        partialize: (state) => ({ overrides: state.overrides }),
      },
    ),
    { name: "Floor Route Overrides" },
  ),
);
