"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import { FloorSlotBuilder } from "@/components/FloorSlotBuilder";
import type { Region } from "@/lib/floor";
import { FLOOR_PLAN_DIMENSIONS, FLOOR_PLAN_LEFT_MARGIN, floorPlanRegions } from "@/lib/floorPlan";
import { doorsToRegions } from "@/lib/utils/doorRegions";

type ParsedPlan = {
  regions: Region[];
  width: number;
  height: number;
};

type PlanInput = { width?: number; height?: number; regions: Region[] } | Region[];

const EMPTY_PLAN_TEXT = JSON.stringify(
  {
    width: FLOOR_PLAN_DIMENSIONS.width,
    height: FLOOR_PLAN_DIMENSIONS.height,
    regions: [],
  },
  null,
  2,
);

const SAMPLE_PLAN_TEXT = JSON.stringify(
  {
    width: FLOOR_PLAN_DIMENSIONS.width,
    height: FLOOR_PLAN_DIMENSIONS.height,
    regions: floorPlanRegions,
  },
  null,
  2,
);

export function FloorPlanGenerator() {
  const doorNumbers = useDoorsStore((s) => s.doorNumbers);
  const [planText, setPlanText] = useState<string>(EMPTY_PLAN_TEXT);
  const [planCopied, setPlanCopied] = useState<boolean>(false);

  const { plan, planError } = useMemo<{
    plan: ParsedPlan;
    planError: string | null;
  }>(() => {
    try {
      const parsed = JSON.parse(planText) as PlanInput;
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
      return {
        plan: {
          regions: [],
          width: FLOOR_PLAN_DIMENSIONS.width,
          height: FLOOR_PLAN_DIMENSIONS.height,
        },
        planError: message,
      };
    }
  }, [planText]);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
        Edit or paste a floor layout JSON below. Reset leaves you with an empty canvas (no doors, no
        2×3 or 1×6 slots) sized to the defaults. You can insert doors from your settings or drag
        shapes into place.
      </p>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <label style={{ fontWeight: 700 }} htmlFor="planJson">
          Floor plan JSON
        </label>
        <textarea
          id="planJson"
          value={planText}
          onChange={(event) => {
            setPlanText(event.target.value);
            setPlanCopied(false);
          }}
          spellCheck={false}
          style={textareaStyle}
        />
        {planError ? (
          <p style={{ margin: 0, color: "oklch(from #b91c1c l c h)" }}>
            Failed to parse JSON; showing fallback layout. ({planError})
          </p>
        ) : (
          <p style={{ margin: 0, color: "oklch(from #334155 l c h)" }}>
            Shape: {"{ width?, height?, regions: Region[] }"} or just an array of regions.
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            style={pillButtonStyle}
            onClick={() => {
              setPlanText(EMPTY_PLAN_TEXT);
              setPlanCopied(false);
            }}
          >
            Reset to empty
          </button>
          <button
            type="button"
            style={pillButtonStyle}
            onClick={() => {
              const regions = doorsToRegions(doorNumbers);
              const width = Math.max(
                FLOOR_PLAN_DIMENSIONS.width,
                FLOOR_PLAN_LEFT_MARGIN + doorNumbers.length * 3,
              );
              setPlanText(
                JSON.stringify(
                  {
                    width,
                    height: FLOOR_PLAN_DIMENSIONS.height,
                    regions: regions.length ? regions : [],
                  },
                  null,
                  2,
                ),
              );
              setPlanCopied(false);
            }}
          >
            Insert doors from settings
          </button>
          <button
            type="button"
            style={pillButtonStyle}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(planText);
                setPlanCopied(true);
              } catch {
                setPlanCopied(false);
              }
            }}
          >
            {planCopied ? "Copied" : "Copy JSON"}
          </button>
          <button
            type="button"
            style={{
              ...pillButtonStyle,
              backgroundColor: "oklch(from #e2e8f0 l c h)",
              color: "oklch(from #0f172a l c h)",
            }}
            onClick={() => {
              setPlanText(SAMPLE_PLAN_TEXT);
              setPlanCopied(false);
            }}
          >
            Load sample layout (with slots)
          </button>
        </div>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Region shape: {"{ id, label?, type, startX, startY, endX, endY, color? }"}. Canvas is
          54×21 by default and includes the left margin before doors.
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>Interactive slot placement</h3>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Drag to place 2×3 or 1×6 slots; overlaps are blocked. Adds to the JSON above so you can
          copy or fine-tune afterward.
        </p>
        <FloorSlotBuilder
          regions={plan.regions}
          width={plan.width}
          height={plan.height}
          doorNumbers={doorNumbers}
          enableDoorModeToggle
          onChange={(nextRegions) => {
            setPlanText(
              JSON.stringify(
                { width: plan.width, height: plan.height, regions: nextRegions },
                null,
                2,
              ),
            );
            setPlanCopied(false);
          }}
        />
      </div>
    </div>
  );
}

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "15rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.8rem",
  padding: "0.625rem",
  borderRadius: "0.375rem",
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  background: "oklch(from #f8fafc l c h)",
  color: "oklch(from #0f172a l c h)",
};

const pillButtonStyle: CSSProperties = {
  appearance: "none",
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  backgroundColor: "oklch(from #2563eb l c h)",
  color: "oklch(from #f8fafc l c h)",
  borderRadius: "999px",
  padding: "0.375rem 0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};
