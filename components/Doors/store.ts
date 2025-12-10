"use client";

import { create } from "zustand";
import type { DoorBlockRuleMap } from "@/lib/utils/ddDoorRules";
import { DDBLOCKRULES } from "@/lib/utils/ddDoorRules";
import { DEFAULT_DOOR_NUMBERS, type DoorMode } from "@/lib/utils/doors";
import type { DoorAssignments, Route } from "@/lib/utils/generateFloorDoors";
import { generateFloorDoors } from "@/lib/utils/generateFloorDoors";
import { getRoutePrefix } from "@/lib/utils/getRoutePrefix";
import { mapRoutesToFloorAssignments } from "@/lib/utils/mapRoutesToFloorAssignments";
import { parseRoutes } from "@/lib/utils/parseRoutes";
import type { RegionAssignments } from "@/lib/utils/regionAssignments";
import { waveToMinutes } from "@/lib/utils/waveToMinutes";

type DoorsState = {
  doors: DoorAssignments;
  waveOrder: string[];
  doorMode: Record<number, DoorMode>;
  doorNumbers: number[];
  blockRules: DoorBlockRuleMap;
  flrAssignments: RegionAssignments;
  routes: Route[];
  overrideRouteId: Route["id"] | null;
  setDoorMode: (door: number) => void;
  setDoorNumbers: (doors: number[]) => void;
  setBlockRules: (rules: DoorBlockRuleMap) => void;
  normalizeUnique: (doors: DoorAssignments) => { doors: DoorAssignments };
  generateFromText: (text: string) => void;
  enableOverride: (routeId: Route["id"]) => void;
  clearOverride: () => void;
  moveRouteToDoor: (route: Route, doorId: number | string) => void;
  swapCells: (sourceDoor: number, sourceRow: number, targetDoor: number, targetRow: number) => void;
};

export const useDoorsStore = create<DoorsState>((set, get) => ({
  doors: {},
  waveOrder: [],
  doorMode: {},
  doorNumbers: DEFAULT_DOOR_NUMBERS,
  blockRules: { ...DDBLOCKRULES },
  flrAssignments: {},
  routes: [],
  overrideRouteId: null,
  normalizeUnique: (doors: DoorAssignments) => {
    const seen = new Set<number>();
    const normalizedDoors: DoorAssignments = {};
    for (const [doorKey, rows] of Object.entries(doors)) {
      const doorNum = Number(doorKey);
      normalizedDoors[doorNum] = (rows || []).map((r) => {
        if (r && seen.has(r.id)) return null;
        if (r) seen.add(r.id);
        return r ?? null;
      });
    }
    return { doors: normalizedDoors };
  },

  enableOverride: (routeId) => set({ overrideRouteId: routeId }),
  clearOverride: () => set({ overrideRouteId: null }),

  moveRouteToDoor: (route, doorId) => {
    const targetDoor = Number(doorId);
    if (!Number.isFinite(targetDoor)) return;

    set((state) => {
      const nextDoors: DoorAssignments = {};
      for (const [doorKey, rows] of Object.entries(state.doors)) {
        const numericDoor = Number(doorKey);
        nextDoors[numericDoor] = (rows || []).filter((r) => r?.id !== route.id);
      }

      if (!nextDoors[targetDoor]) nextDoors[targetDoor] = [];
      nextDoors[targetDoor].push(route);

      const normalized = state.normalizeUnique(nextDoors);
      return { ...state, ...normalized, overrideRouteId: null };
    });
  },

  setDoorMode: (door) => {
    set((state) => {
      const current = state.doorMode[door] ?? "all";
      const next = current === "all" ? "truck-only" : current === "truck-only" ? "closed" : "all";
      return { doorMode: { ...state.doorMode, [door]: next } };
    });
  },

  setDoorNumbers: (numbers) => {
    const cleaned = numbers
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n))
      .filter((value, index, arr) => arr.indexOf(value) === index);
    set({
      doorNumbers: cleaned.length ? cleaned : DEFAULT_DOOR_NUMBERS,
      doors: {},
      doorMode: {},
      waveOrder: [],
      flrAssignments: {},
      routes: [],
    });
  },

  setBlockRules: (rules) => {
    const sanitized: DoorBlockRuleMap = {};
    for (const [prefix, doors] of Object.entries(rules || {})) {
      sanitized[prefix] = (doors || [])
        .map((d) => Number(d))
        .filter((d) => Number.isFinite(d))
        .filter((value, index, arr) => arr.indexOf(value) === index);
    }
    set({ blockRules: sanitized });
  },

  generateFromText: (text) => {
    const routes = parseRoutes(text);
    const blockRules = get().blockRules;
    const doorNumbers = get().doorNumbers;
    const isBlocked = (door: number, route: Route) => {
      const prefix = getRoutePrefix(route.route);
      const blocked = blockRules[prefix] || [];
      return blocked.includes(door);
    };
    const toMinutes = (wave: string) => {
      const minutes = waveToMinutes(wave);
      return Number.isFinite(minutes) ? minutes : Number.POSITIVE_INFINITY;
    };
    const waveOrder = Array.from(new Set(routes.map((r) => r.waveTime))).sort(
      (a, b) => toMinutes(a) - toMinutes(b),
    );
    const assignments = generateFloorDoors(routes, { doors: doorNumbers, blockRules });
    const fitsDoor = (door: number, route: Route) => {
      if (isBlocked(door, route)) return false;
      const mode = get().doorMode[door] ?? "all";
      if (mode === "closed") return false;
      if (mode === "truck-only" && route.vehicle === "van") return false;
      return true;
    };

    const pruned: DoorAssignments = {};
    const requeue: Route[] = [];
    for (const d of doorNumbers) {
      const col: (Route | null)[] = [];
      for (const r of assignments[d] || []) {
        if (r && fitsDoor(d, r)) col.push(r);
        else if (r) requeue.push(r);
      }
      pruned[d] = col;
    }

    for (const r of requeue) {
      let bestDoor: number | null = null;
      let bestLoad = Infinity;
      for (const d of doorNumbers) {
        if (!fitsDoor(d, r)) continue;
        const load = pruned[d]?.length ?? 0;
        if (load < bestLoad) {
          bestDoor = d;
          bestLoad = load;
        }
      }
      if (bestDoor !== null) {
        pruned[bestDoor] = pruned[bestDoor] || [];
        pruned[bestDoor].push(r);
      }
    }

    const normalized = get().normalizeUnique(pruned);
    const flrAssignments = mapRoutesToFloorAssignments(routes);

    set({ ...normalized, waveOrder, flrAssignments, routes });
  },

  swapCells: (sourceDoor, sourceRow, targetDoor, targetRow) => {
    const state = get();
    const newDoors = { ...state.doors };

    const sourceCol = [...(newDoors[sourceDoor] || [])];
    const targetCol = [...(newDoors[targetDoor] || [])];

    const sourceItem = sourceCol[sourceRow] ?? null;
    const targetItem = targetCol[targetRow] ?? null;

    const rules = get().blockRules;
    const blockedFor = (route: Route | null, door: number) => {
      if (!route) return false;
      const prefix = getRoutePrefix(route.route);
      const blocked = rules[prefix] || [];
      return blocked.includes(door);
    };

    if (blockedFor(sourceItem, targetDoor) || blockedFor(targetItem, sourceDoor)) return;

    const targetMode = state.doorMode[targetDoor] ?? "all";
    if (sourceItem && targetMode === "closed") return;
    if (sourceItem && targetMode === "truck-only" && sourceItem.vehicle === "van") return;
    const sourceMode = state.doorMode[sourceDoor] ?? "all";
    if (targetItem && sourceMode === "closed") return;
    if (targetItem && sourceMode === "truck-only" && targetItem.vehicle === "van") return;

    sourceCol[sourceRow] = targetItem;
    targetCol[targetRow] = sourceItem;

    newDoors[sourceDoor] = sourceCol;
    newDoors[targetDoor] = targetCol;

    const normalized = state.normalizeUnique(newDoors);
    set(normalized);
  },
}));
