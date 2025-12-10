"use client";

import { create } from "zustand";
import type { Region } from "@/lib/floor";
import { FLOOR_PLAN_DIMENSIONS, floorPlanRegions } from "@/lib/floorPlan";

export type ParsedPlan = {
  regions: Region[];
  width: number;
  height: number;
};

type PlanInput = { width?: number; height?: number; regions: Region[] } | Region[];

export const EMPTY_FLOOR_PLAN_TEXT = JSON.stringify(
  {
    width: FLOOR_PLAN_DIMENSIONS.width,
    height: FLOOR_PLAN_DIMENSIONS.height,
    regions: [],
  },
  null,
  2,
);

export const SAMPLE_FLOOR_PLAN_TEXT = JSON.stringify(
  {
    width: FLOOR_PLAN_DIMENSIONS.width,
    height: FLOOR_PLAN_DIMENSIONS.height,
    regions: floorPlanRegions,
  },
  null,
  2,
);

function parsePlan(text: string): { plan: ParsedPlan | null; planError: string | null } {
  try {
    const parsed = JSON.parse(text) as PlanInput;
    if (Array.isArray(parsed)) {
      return {
        plan: {
          regions: parsed,
          width: FLOOR_PLAN_DIMENSIONS.width,
          height: FLOOR_PLAN_DIMENSIONS.height,
        },
        planError: null,
      };
    }
    const width = parsed.width ?? FLOOR_PLAN_DIMENSIONS.width;
    const height = parsed.height ?? FLOOR_PLAN_DIMENSIONS.height;
    const regions = parsed.regions ?? [];
    return { plan: { regions, width, height }, planError: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    return { plan: null, planError: message };
  }
}

type FloorPlanState = {
  planText: string;
  plan: ParsedPlan;
  planError: string | null;
  setPlanText: (text: string) => void;
  setPlan: (plan: ParsedPlan) => void;
  resetToEmpty: () => void;
  loadSample: () => void;
};

export const useFloorPlanStore = create<FloorPlanState>((set) => {
  const defaultPlan: ParsedPlan = {
    regions: [],
    width: FLOOR_PLAN_DIMENSIONS.width,
    height: FLOOR_PLAN_DIMENSIONS.height,
  };
  const initial = parsePlan(SAMPLE_FLOOR_PLAN_TEXT);
  return {
    planText: SAMPLE_FLOOR_PLAN_TEXT,
    plan: initial.plan ?? defaultPlan,
    planError: initial.planError,
    setPlanText: (text) => {
      const next = parsePlan(text);
      if (next.planError || !next.plan) {
        set({ planText: text, planError: next.planError });
        return;
      }
      set({ planText: text, plan: next.plan, planError: null });
    },
    setPlan: (plan) => {
      set({
        planText: JSON.stringify(
          { width: plan.width, height: plan.height, regions: plan.regions },
          null,
          2,
        ),
        plan,
        planError: null,
      });
    },
    resetToEmpty: () => {
      const next = parsePlan(EMPTY_FLOOR_PLAN_TEXT);
      set({
        planText: EMPTY_FLOOR_PLAN_TEXT,
        plan: next.plan ?? defaultPlan,
        planError: next.planError,
      });
    },
    loadSample: () => {
      const next = parsePlan(SAMPLE_FLOOR_PLAN_TEXT);
      set({
        planText: SAMPLE_FLOOR_PLAN_TEXT,
        plan: next.plan ?? defaultPlan,
        planError: next.planError,
      });
    },
  };
});
