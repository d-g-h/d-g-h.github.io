"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import { useFloorPlanStore } from "@/components/FloorPlan/store";
import { FloorSlotBuilder } from "@/components/FloorSlotBuilder";
import type { Region } from "@/lib/floor";
import { FLOOR_PLAN_DIMENSIONS, floorPlanRegions } from "@/lib/floorPlan";

type Plan = {
  regions: Region[];
  width: number;
  height: number;
};

const EMPTY_PLAN: Plan = {
  width: FLOOR_PLAN_DIMENSIONS.width,
  height: FLOOR_PLAN_DIMENSIONS.height,
  regions: [],
};

export function FloorPlanBuilder() {
  const doorNumbers = useDoorsStore((s) => s.doorNumbers);
  const currentPlan = useFloorPlanStore((s) => s.plan);

  const [plan, setPlan] = useState<Plan>(EMPTY_PLAN);
  const [copied, setCopied] = useState<boolean>(false);

  const planText = useMemo(
    () =>
      JSON.stringify({ width: plan.width, height: plan.height, regions: plan.regions }, null, 2),
    [plan.height, plan.regions, plan.width],
  );

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          style={pillButtonStyle}
          onClick={() => {
            setPlan(currentPlan);
            setCopied(false);
          }}
        >
          Current
        </button>
        <button
          type="button"
          style={pillButtonStyle}
          onClick={() => {
            setPlan(EMPTY_PLAN);
            setCopied(false);
          }}
        >
          Empty
        </button>
        <button
          type="button"
          style={pillButtonStyle}
          onClick={() => {
            setPlan({
              width: FLOOR_PLAN_DIMENSIONS.width,
              height: FLOOR_PLAN_DIMENSIONS.height,
              regions: floorPlanRegions,
            });
            setCopied(false);
          }}
        >
          Sample
        </button>
        <button
          type="button"
          style={pillButtonStyle}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(planText);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <FloorSlotBuilder
        regions={plan.regions}
        width={plan.width}
        height={plan.height}
        doorNumbers={doorNumbers}
        onChange={(nextRegions) => {
          setPlan((prev) => ({ ...prev, regions: nextRegions }));
          setCopied(false);
        }}
      />

      <details style={detailsStyle}>
        <summary style={summaryStyle}>JSON</summary>
        <textarea
          readOnly
          value={planText}
          spellCheck={false}
          style={textareaStyle}
          aria-label="Generated floor plan JSON"
        />
      </details>
    </div>
  );
}

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "8rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.8rem",
  padding: "0.625rem",
  borderRadius: "0.375rem",
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  background: "oklch(from #f8fafc l c h)",
  color: "oklch(from #0f172a l c h)",
  resize: "vertical",
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

const detailsStyle: CSSProperties = {
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  borderRadius: "0.5rem",
  padding: "0.5rem",
  background: "oklch(from #f8fafc l c h)",
};

const summaryStyle: CSSProperties = {
  fontWeight: 700,
  cursor: "pointer",
};
