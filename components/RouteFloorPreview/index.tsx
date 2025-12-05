"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import { FloorRenderer } from "@/components/FloorRenderer";
import { FLOOR_PLAN_DIMENSIONS, floorPlanRegions } from "@/lib/floorPlan";
import { applyAssignmentsToRegions } from "@/lib/utils/regionAssignments";

export function RouteFloorPreview() {
  const assignments = useDoorsStore((s) => s.flrAssignments);
  const doorMode = useDoorsStore((s) => s.doorMode);
  const toggleDoorMode = useDoorsStore((s) => s.setDoorMode);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);

  const regions = useMemo(
    () =>
      applyAssignmentsToRegions(floorPlanRegions, assignments).map((region) => {
        if (region.type !== "door") return region;
        const doorNum = Number(region.label ?? region.id.replace("door_", ""));
        const mode = Number.isFinite(doorNum) ? doorMode[doorNum] : undefined;
        return { ...region, doorMode: mode };
      }),
    [assignments, doorMode],
  );

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={showRoutes}
            onChange={(event) => setShowRoutes(event.target.checked)}
          />
          Show routes
        </label>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(event) => setShowLabels(event.target.checked)}
          />
          Show region labels
        </label>
      </div>

      <FloorRenderer
        regions={regions}
        width={FLOOR_PLAN_DIMENSIONS.width}
        height={FLOOR_PLAN_DIMENSIONS.height}
        cellSize={1.6}
        showGrid
        showRoutes={showRoutes}
        showRegionLabels={showLabels}
        metaFields={["doorMode", "staging", "waveTime", "dsp", "wave"]}
        onDoorToggle={(doorId) => {
          const num = Number(doorId.replace("door_", ""));
          if (!Number.isFinite(num)) return;
          toggleDoorMode(num);
        }}
      />
    </div>
  );
}

const toggleStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  fontWeight: 600,
};
