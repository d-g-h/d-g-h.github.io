"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DoorBlockRuleMap } from "@/lib/utils/ddDoorRules";
import { DDBLOCKRULES } from "@/lib/utils/ddDoorRules";
import { DEFAULT_DOOR_NUMBERS, type DoorMode } from "@/lib/utils/doors";
import type { DoorAssignments, Route } from "@/lib/utils/generateFloorDoors";
import { generateFloorDoors } from "@/lib/utils/generateFloorDoors";
import { getRoutePrefix } from "@/lib/utils/getRoutePrefix";
import { parseRoutes } from "@/lib/utils/parseRoutes";
import {
  getRouteKeyFromNormalized,
  isCompositeRouteKey,
  normalizeDspCode,
  normalizeRouteCode,
  ROUTE_KEY_SEPARATOR,
} from "@/lib/utils/routeKey";

type DoorsState = {
  doors: DoorAssignments;
  autoDoorByRoute: Record<string, number>;
  doorOverrides: Record<string, number>;
  doorMode: Record<number, DoorMode>;
  doorNumbers: number[];
  blockRules: DoorBlockRuleMap;
  routes: Route[];
  overrideRouteId: Route["id"] | null;
  setDoorMode: (door: number) => void;
  setDoorNumbers: (doors: number[]) => void;
  setBlockRules: (rules: DoorBlockRuleMap) => void;
  clearDoorOverrides: () => void;
  normalizeUnique: (doors: DoorAssignments) => { doors: DoorAssignments };
  generateFromText: (text: string) => void;
  enableOverride: (routeId: Route["id"]) => void;
  clearOverride: () => void;
  moveRouteToDoor: (route: Route, doorId: number | string) => void;
  swapCells: (sourceDoor: number, sourceRow: number, targetDoor: number, targetRow: number) => void;
};

interface PersistedDoorsState {
  doors: DoorAssignments;
  autoDoorByRoute: Record<string, number>;
  doorOverrides: Record<string, number>;
  doorMode: Record<number, DoorMode>;
  doorNumbers: number[];
  blockRules: DoorBlockRuleMap;
  routes: Route[];
}

function routeFitsDoor(
  door: number,
  route: Route,
  options: { doorMode: Record<number, DoorMode>; blockRules: DoorBlockRuleMap },
): boolean {
  const prefix = getRoutePrefix(route.route);
  const blocked = options.blockRules[prefix] || [];
  if (blocked.includes(door)) return false;

  const mode = options.doorMode[door] ?? "all";
  if (mode === "closed") return false;
  const vehicle = prefix.toUpperCase() === "CP" ? "van" : (route.vehicle ?? "truck");
  if (mode === "truck-only" && vehicle === "van") return false;
  return true;
}

function normalizeUniqueDoorAssignments(doors: DoorAssignments): DoorAssignments {
  const seen = new Set<string>();
  const normalizedDoors: DoorAssignments = {};
  for (const [doorKey, rows] of Object.entries(doors)) {
    const doorNum = Number(doorKey);
    if (!Number.isFinite(doorNum)) continue;
    normalizedDoors[doorNum] = (rows || []).map((route) => {
      if (!route) return null;
      const routeCode = normalizeRouteCode(route.route);
      const dspCode = normalizeDspCode(route.dsp);
      const routeKey = getRouteKeyFromNormalized(routeCode, dspCode, route.staging, route.waveTime);
      const vehicle =
        getRoutePrefix(routeCode).toUpperCase() === "CP" ? "van" : (route.vehicle ?? "truck");
      if (!routeKey) return null;
      if (seen.has(routeKey)) return null;
      seen.add(routeKey);
      return { ...route, route: routeCode, dsp: dspCode, routeKey, vehicle };
    });
  }
  return normalizedDoors;
}

function getDoorByRoute(doors: DoorAssignments): Record<string, number> {
  const doorByRoute: Record<string, number> = {};
  for (const [doorKey, slots] of Object.entries(doors)) {
    const door = Number(doorKey);
    if (!Number.isFinite(door)) continue;
    for (const slot of slots || []) {
      if (!slot) continue;
      const routeKey = getRouteKeyFromNormalized(
        normalizeRouteCode(slot.route),
        normalizeDspCode(slot.dsp),
        slot.staging,
        slot.waveTime,
      );
      if (!routeKey) continue;
      doorByRoute[routeKey] = door;
    }
  }
  return doorByRoute;
}

function normalizeOverrideRouteKey(
  rawRouteCodeOrKey: string,
  routeKeysByCode: Map<string, string[]>,
  routeKeysByComposite: Map<string, string[]>,
): string {
  const rawKey = rawRouteCodeOrKey.trim();
  if (!rawKey) return "";

  if (isCompositeRouteKey(rawKey)) {
    const parts = rawKey.split(ROUTE_KEY_SEPARATOR).map((part) => part.trim());
    if (parts.length >= 3) {
      const [dspPart, routePart, stagingPart, ...waveParts] = parts;
      const dspCode = normalizeDspCode(dspPart);
      const routeCode = normalizeRouteCode(routePart);
      const wavePart = waveParts.join(ROUTE_KEY_SEPARATOR);
      return getRouteKeyFromNormalized(routeCode, dspCode, stagingPart, wavePart);
    }

    if (parts.length >= 2) {
      const dspCode = normalizeDspCode(parts[0]);
      const routeCode = normalizeRouteCode(parts[1]);
      const legacyKey = getLegacyRouteKey(routeCode, dspCode);
      if (!legacyKey) return "";
      const matches = routeKeysByComposite.get(legacyKey) ?? [];
      if (matches.length !== 1) return "";
      return matches[0] ?? "";
    }

    return "";
  }

  const routeCode = normalizeRouteCode(rawKey);
  if (!routeCode) return "";
  const matches = routeKeysByCode.get(routeCode) ?? [];
  if (matches.length !== 1) return "";
  return matches[0] ?? "";
}

function getLegacyRouteKey(routeCode: string, dspCode?: string): string {
  const normalizedRoute = normalizeRouteCode(routeCode);
  if (!normalizedRoute) return "";
  const normalizedDsp = normalizeDspCode(dspCode);
  return normalizedDsp
    ? `${normalizedDsp}${ROUTE_KEY_SEPARATOR}${normalizedRoute}`
    : normalizedRoute;
}

function applyDoorOverrides(
  doors: DoorAssignments,
  routes: Route[],
  doorOverrides: Record<string, number>,
  autoDoorByRoute: Record<string, number>,
  doorNumbers: number[],
  doorMode: Record<number, DoorMode>,
  blockRules: DoorBlockRuleMap,
): { doors: DoorAssignments; doorOverrides: Record<string, number> } {
  const doorSet = new Set(doorNumbers);
  const routeByKey = new Map<string, Route>();
  const routeKeysByCode = new Map<string, string[]>();
  const routeKeysByComposite = new Map<string, string[]>();
  for (const route of routes) {
    const routeCode = normalizeRouteCode(route.route);
    const dspCode = normalizeDspCode(route.dsp);
    const routeKey = getRouteKeyFromNormalized(routeCode, dspCode, route.staging, route.waveTime);
    if (!routeKey || routeByKey.has(routeKey)) continue;
    routeByKey.set(routeKey, { ...route, route: routeCode, dsp: dspCode, routeKey });
    const list = routeKeysByCode.get(routeCode) ?? [];
    list.push(routeKey);
    routeKeysByCode.set(routeCode, list);
    const legacyKey = getLegacyRouteKey(routeCode, dspCode);
    if (legacyKey) {
      const legacyList = routeKeysByComposite.get(legacyKey) ?? [];
      legacyList.push(routeKey);
      routeKeysByComposite.set(legacyKey, legacyList);
    }
  }
  const cleanedOverrides: Record<string, number> = {};

  for (const [rawRouteCodeOrKey, targetDoor] of Object.entries(doorOverrides)) {
    const routeKey = normalizeOverrideRouteKey(
      rawRouteCodeOrKey,
      routeKeysByCode,
      routeKeysByComposite,
    );
    const door = Number(targetDoor);
    if (!Number.isFinite(door) || !doorSet.has(door)) continue;
    if (!routeKey || !routeByKey.has(routeKey)) continue;
    if (autoDoorByRoute[routeKey] === door) continue;
    const route = routeByKey.get(routeKey);
    if (!route) continue;
    if (!routeFitsDoor(door, route, { doorMode, blockRules })) continue;
    cleanedOverrides[routeKey] = door;
  }

  const nextDoors: DoorAssignments = {};
  for (const [doorKey, slots] of Object.entries(doors)) {
    const door = Number(doorKey);
    if (!Number.isFinite(door)) continue;
    nextDoors[door] = (slots || []).slice();
  }

  for (const [routeKey, targetDoor] of Object.entries(cleanedOverrides)) {
    for (const [doorKey, slots] of Object.entries(nextDoors)) {
      const door = Number(doorKey);
      nextDoors[door] = (slots || []).filter((route) => {
        if (!route) return true;
        const existingKey = getRouteKeyFromNormalized(
          normalizeRouteCode(route.route),
          normalizeDspCode(route.dsp),
          route.staging,
          route.waveTime,
        );
        return existingKey !== routeKey;
      });
    }
    nextDoors[targetDoor] = nextDoors[targetDoor] || [];
    nextDoors[targetDoor].push(routeByKey.get(routeKey) ?? null);
  }

  return { doors: nextDoors, doorOverrides: cleanedOverrides };
}

function computeDoorAssignments(options: {
  routes: Route[];
  doorNumbers: number[];
  doorMode: Record<number, DoorMode>;
  blockRules: DoorBlockRuleMap;
  doorOverrides: Record<string, number>;
}): {
  doors: DoorAssignments;
  autoDoorByRoute: Record<string, number>;
  doorOverrides: Record<string, number>;
} {
  if (!options.routes.length || !options.doorNumbers.length) {
    return { doors: {}, autoDoorByRoute: {}, doorOverrides: {} };
  }

  const assignments = generateFloorDoors(options.routes, {
    doors: options.doorNumbers,
    blockRules: options.blockRules,
  });

  const pruned: DoorAssignments = {};
  const requeue: Route[] = [];
  for (const door of options.doorNumbers) {
    const col: (Route | null)[] = [];
    for (const route of assignments[door] || []) {
      if (route && routeFitsDoor(door, route, options)) col.push(route);
      else if (route) requeue.push(route);
    }
    pruned[door] = col;
  }

  for (const route of requeue) {
    let bestDoor: number | null = null;
    let bestLoad = Infinity;
    for (const door of options.doorNumbers) {
      if (!routeFitsDoor(door, route, options)) continue;
      const load = pruned[door]?.length ?? 0;
      if (load < bestLoad) {
        bestDoor = door;
        bestLoad = load;
      }
    }
    if (bestDoor !== null) {
      pruned[bestDoor] = pruned[bestDoor] || [];
      pruned[bestDoor].push(route);
    }
  }

  const baseline = normalizeUniqueDoorAssignments(pruned);
  const autoDoorByRoute = getDoorByRoute(baseline);
  const applied = applyDoorOverrides(
    baseline,
    options.routes,
    options.doorOverrides,
    autoDoorByRoute,
    options.doorNumbers,
    options.doorMode,
    options.blockRules,
  );

  return {
    doors: normalizeUniqueDoorAssignments(applied.doors),
    autoDoorByRoute,
    doorOverrides: applied.doorOverrides,
  };
}

export const useDoorsStore = create<DoorsState>()(
  devtools(
    persist(
      (set, get) => ({
        doors: {},
        autoDoorByRoute: {},
        doorOverrides: {},
        doorMode: {},
        doorNumbers: DEFAULT_DOOR_NUMBERS,
        blockRules: { ...DDBLOCKRULES },
        routes: [],
        overrideRouteId: null,
        normalizeUnique: (doors: DoorAssignments) => {
          return { doors: normalizeUniqueDoorAssignments(doors) };
        },

        enableOverride: (routeId) => set({ overrideRouteId: routeId }),
        clearOverride: () => set({ overrideRouteId: null }),

        clearDoorOverrides: () => set({ doorOverrides: {} }),

        moveRouteToDoor: (route, doorId) => {
          const targetDoor = Number(doorId);
          if (!Number.isFinite(targetDoor)) return;

          set((state) => {
            if (!state.doorNumbers.includes(targetDoor)) return state;
            const routeCode = normalizeRouteCode(route.route);
            const dspCode = normalizeDspCode(route.dsp);
            const routeKey = getRouteKeyFromNormalized(
              routeCode,
              dspCode,
              route.staging,
              route.waveTime,
            );
            if (!routeKey) return state;
            if (!routeFitsDoor(targetDoor, route, state)) return state;
            const nextDoors: DoorAssignments = {};
            for (const [doorKey, rows] of Object.entries(state.doors)) {
              const numericDoor = Number(doorKey);
              nextDoors[numericDoor] = (rows || []).filter((existing) => {
                if (!existing) return true;
                const existingKey = getRouteKeyFromNormalized(
                  normalizeRouteCode(existing.route),
                  normalizeDspCode(existing.dsp),
                  existing.staging,
                  existing.waveTime,
                );
                return existingKey !== routeKey;
              });
            }

            if (!nextDoors[targetDoor]) nextDoors[targetDoor] = [];
            nextDoors[targetDoor].push({ ...route, route: routeCode, dsp: dspCode, routeKey });

            const nextOverrides = { ...state.doorOverrides };
            const autoDoor = state.autoDoorByRoute[routeKey];
            if (autoDoor !== undefined && autoDoor === targetDoor) {
              delete nextOverrides[routeKey];
            } else {
              nextOverrides[routeKey] = targetDoor;
            }

            const normalized = state.normalizeUnique(nextDoors);
            return { ...state, ...normalized, doorOverrides: nextOverrides, overrideRouteId: null };
          });
        },

        setDoorMode: (door) => {
          set((state) => {
            const current: DoorMode = state.doorMode[door] ?? "all";
            const next: DoorMode =
              current === "all" ? "truck-only" : current === "truck-only" ? "closed" : "all";
            const nextDoorMode: Record<number, DoorMode> = { ...state.doorMode, [door]: next };
            if (!state.routes.length) return { doorMode: nextDoorMode };

            const computed = computeDoorAssignments({
              routes: state.routes,
              doorNumbers: state.doorNumbers,
              doorMode: nextDoorMode,
              blockRules: state.blockRules,
              doorOverrides: state.doorOverrides,
            });
            return { ...state, ...computed, doorMode: nextDoorMode, overrideRouteId: null };
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
            autoDoorByRoute: {},
            doorOverrides: {},
            doorMode: {},
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
          const parsedRoutes = parseRoutes(text);
          const seenRoutes = new Set<string>();
          const routes = parsedRoutes
            .map((route) => {
              const routeCode = normalizeRouteCode(route.route);
              const dspCode = normalizeDspCode(route.dsp);
              const routeKey = getRouteKeyFromNormalized(
                routeCode,
                dspCode,
                route.staging,
                route.waveTime,
              );
              const prefix = getRoutePrefix(routeCode);
              return {
                ...route,
                route: routeCode,
                routeKey,
                staging: route.staging.replace(/[^A-Za-z0-9.]/g, "").toUpperCase(),
                waveTime: route.waveTime.trim(),
                dsp: dspCode,
                vehicle: prefix.toUpperCase() === "CP" ? "van" : route.vehicle,
                prefix,
              };
            })
            .filter((route) => {
              if (!route.routeKey) return false;
              if (seenRoutes.has(route.routeKey)) return false;
              seenRoutes.add(route.routeKey);
              return true;
            });
          const computed = computeDoorAssignments({
            routes,
            doorNumbers: get().doorNumbers,
            doorMode: get().doorMode,
            blockRules: get().blockRules,
            doorOverrides: get().doorOverrides,
          });

          set({ ...computed, routes, overrideRouteId: null });
        },

        swapCells: (sourceDoor, sourceRow, targetDoor, targetRow) => {
          const state = get();
          const newDoors = { ...state.doors };

          const sourceCol = [...(newDoors[sourceDoor] || [])];
          const targetCol = [...(newDoors[targetDoor] || [])];

          const sourceItem = sourceCol[sourceRow] ?? null;
          const targetItem = targetCol[targetRow] ?? null;

          if (sourceItem && !routeFitsDoor(targetDoor, sourceItem, state)) return;
          if (targetItem && !routeFitsDoor(sourceDoor, targetItem, state)) return;

          sourceCol[sourceRow] = targetItem;
          targetCol[targetRow] = sourceItem;

          newDoors[sourceDoor] = sourceCol;
          newDoors[targetDoor] = targetCol;

          const normalized = state.normalizeUnique(newDoors);
          set(normalized);
        },
      }),
      {
        name: "doors-store",
        partialize: (state): PersistedDoorsState => ({
          doors: state.doors,
          autoDoorByRoute: state.autoDoorByRoute,
          doorOverrides: state.doorOverrides,
          doorMode: state.doorMode,
          doorNumbers: state.doorNumbers,
          blockRules: state.blockRules,
          routes: state.routes,
        }),
        version: 3,
        migrate: (persistedState): PersistedDoorsState => {
          const state = persistedState as PersistedDoorsState;
          if (!state) {
            return {
              doors: {},
              autoDoorByRoute: {},
              doorOverrides: {},
              doorMode: {},
              doorNumbers: DEFAULT_DOOR_NUMBERS,
              blockRules: { ...DDBLOCKRULES },
              routes: [],
            };
          }

          const normalizedRoutes = (state.routes || []).map((route) => {
            const routeCode = normalizeRouteCode(route.route);
            const dspCode = normalizeDspCode(route.dsp);
            const routeKey = getRouteKeyFromNormalized(
              routeCode,
              dspCode,
              route.staging,
              route.waveTime,
            );
            const prefix = getRoutePrefix(routeCode);
            const vehicle = prefix.toUpperCase() === "CP" ? "van" : (route.vehicle ?? "truck");
            return { ...route, route: routeCode, dsp: dspCode, routeKey, vehicle };
          });

          const routeKeysByCode = new Map<string, string[]>();
          const routeKeysByComposite = new Map<string, string[]>();
          for (const route of normalizedRoutes) {
            const routeCode = normalizeRouteCode(route.route);
            const routeKey = getRouteKeyFromNormalized(
              routeCode,
              route.dsp,
              route.staging,
              route.waveTime,
            );
            if (!routeCode || !routeKey) continue;
            const list = routeKeysByCode.get(routeCode) ?? [];
            if (!list.includes(routeKey)) list.push(routeKey);
            routeKeysByCode.set(routeCode, list);
            const legacyKey = getLegacyRouteKey(routeCode, route.dsp);
            if (legacyKey) {
              const legacyList = routeKeysByComposite.get(legacyKey) ?? [];
              if (!legacyList.includes(routeKey)) legacyList.push(routeKey);
              routeKeysByComposite.set(legacyKey, legacyList);
            }
          }

          const migrateRouteMap = (map: Record<string, number>): Record<string, number> => {
            const next: Record<string, number> = {};
            for (const [rawRouteCodeOrKey, value] of Object.entries(map || {})) {
              const routeKey = normalizeOverrideRouteKey(
                rawRouteCodeOrKey,
                routeKeysByCode,
                routeKeysByComposite,
              );
              if (!routeKey) continue;
              next[routeKey] = value;
            }
            return next;
          };

          const normalizedDoors: DoorAssignments = {};
          for (const [doorKey, slots] of Object.entries(state.doors || {})) {
            const door = Number(doorKey);
            if (!Number.isFinite(door)) continue;
            normalizedDoors[door] = (slots || []).map((route) => {
              if (!route) return null;
              const routeCode = normalizeRouteCode(route.route);
              const dspCode = normalizeDspCode(route.dsp);
              const routeKey = getRouteKeyFromNormalized(
                routeCode,
                dspCode,
                route.staging,
                route.waveTime,
              );
              const prefix = getRoutePrefix(routeCode);
              const vehicle = prefix.toUpperCase() === "CP" ? "van" : (route.vehicle ?? "truck");
              return { ...route, route: routeCode, dsp: dspCode, routeKey, vehicle };
            });
          }

          return {
            ...state,
            doors: normalizedDoors,
            routes: normalizedRoutes,
            autoDoorByRoute: migrateRouteMap(state.autoDoorByRoute || {}),
            doorOverrides: migrateRouteMap(state.doorOverrides || {}),
          };
        },
      },
    ),
    { name: "Doors Store" },
  ),
);
