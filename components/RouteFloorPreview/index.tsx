"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import { useFloorPlanStore } from "@/components/FloorPlan/store";
import { FloorRenderer } from "@/components/FloorRenderer";
import { applyFloorRouteOverrides } from "@/lib/utils/applyFloorRouteOverrides";
import { mapRoutesToFloorAssignments } from "@/lib/utils/mapRoutesToFloorAssignments";
import { applyAssignmentsToRegions } from "@/lib/utils/regionAssignments";
import {
  getRouteKeyFromNormalized,
  normalizeDspCode,
  normalizeRouteCode,
} from "@/lib/utils/routeKey";
import { useFloorRouteOverridesStore } from "./store";

function areOverrideMapsEqual(a: Record<string, string>, b: Record<string, string>) {
  const aEntries = Object.entries(a);
  const bEntries = Object.entries(b);
  if (aEntries.length !== bEntries.length) return false;
  for (const [key, value] of aEntries) {
    if (b[key] !== value) return false;
  }
  return true;
}

function normalizeStagingCode(staging: string): string {
  return staging.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

export function RouteFloorPreview() {
  const routes = useDoorsStore((s) => s.routes);
  const doorMode = useDoorsStore((s) => s.doorMode);
  const toggleDoorMode = useDoorsStore((s) => s.setDoorMode);
  const plan = useFloorPlanStore((s) => s.plan);
  const planError = useFloorPlanStore((s) => s.planError);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const routeOverrides = useFloorRouteOverridesStore((s) => s.overrides);
  const setRouteOverrides = useFloorRouteOverridesStore((s) => s.setOverrides);
  const clearRouteOverrides = useFloorRouteOverridesStore((s) => s.clearOverrides);

  const normalizedRoutes = useMemo(() => {
    const seen = new Set<string>();
    return routes
      .map((route) => {
        const routeCode = normalizeRouteCode(route.route);
        const dspCode = normalizeDspCode(route.dsp);
        const routeKey = getRouteKeyFromNormalized(
          routeCode,
          dspCode,
          route.staging,
          route.waveTime,
        );
        return {
          ...route,
          route: routeCode,
          routeKey,
          staging: normalizeStagingCode(route.staging),
          waveTime: route.waveTime.trim(),
          dsp: dspCode,
        };
      })
      .filter((route) => {
        if (!route.routeKey) return false;
        if (seen.has(route.routeKey)) return false;
        seen.add(route.routeKey);
        return true;
      });
  }, [routes]);

  const slotMetaById = useMemo(() => {
    const meta: Record<string, { startX: number; startY: number; endX: number; endY: number }> = {};
    for (const region of plan.regions) {
      if (region.type !== "lane") continue;
      meta[region.id] = {
        startX: region.startX,
        startY: region.startY,
        endX: region.endX,
        endY: region.endY,
      };
    }
    return meta;
  }, [plan.regions]);

  const autoAssignments = useMemo(
    () => mapRoutesToFloorAssignments(normalizedRoutes, plan.regions),
    [normalizedRoutes, plan.regions],
  );

  const applied = useMemo(
    () => applyFloorRouteOverrides(normalizedRoutes, plan.regions, autoAssignments, routeOverrides),
    [autoAssignments, normalizedRoutes, plan.regions, routeOverrides],
  );

  useEffect(() => {
    if (areOverrideMapsEqual(routeOverrides, applied.normalizedOverrides)) return;
    setRouteOverrides(applied.normalizedOverrides);
  }, [applied.normalizedOverrides, routeOverrides, setRouteOverrides]);

  const regions = useMemo(
    () =>
      applyAssignmentsToRegions(plan.regions, applied.assignments).map((region) => {
        if (region.type !== "door") return region;
        const doorNum = Number(region.label ?? region.id.replace("door_", ""));
        const mode = Number.isFinite(doorNum) ? doorMode[doorNum] : undefined;
        return { ...region, doorMode: mode ?? region.doorMode };
      }),
    [applied.assignments, doorMode, plan.regions],
  );

  const exportJson = useMemo(() => {
    const moves = Object.entries(applied.normalizedOverrides)
      .map(([route, toSlotId]) => ({
        route,
        fromSlotId: applied.autoSlotByRoute[route] ?? null,
        toSlotId,
        from: applied.autoSlotByRoute[route]
          ? (slotMetaById[applied.autoSlotByRoute[route]] ?? null)
          : null,
        to: slotMetaById[toSlotId] ?? null,
      }))
      .sort((a, b) => a.route.localeCompare(b.route));

    return JSON.stringify(
      {
        width: plan.width,
        height: plan.height,
        overridesByRoute: applied.normalizedOverrides,
        moves,
        assignmentsBySlotId: applied.assignments,
      },
      null,
      2,
    );
  }, [
    applied.assignments,
    applied.autoSlotByRoute,
    applied.normalizedOverrides,
    plan.height,
    plan.width,
    slotMetaById,
  ]);

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={showRoutes}
            onChange={(event) => setShowRoutes(event.target.checked)}
          />
          Routes
        </label>
        <label style={toggleStyle}>
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(event) => setShowLabels(event.target.checked)}
          />
          Labels
        </label>
      </div>
      {planError ? (
        <p style={{ margin: 0, color: "oklch(from #b91c1c l c h)" }}>{planError}</p>
      ) : null}

      <FloorRenderer
        regions={regions}
        width={plan.width}
        height={plan.height}
        cellSize={1.6}
        showGrid
        showRoutes={showRoutes}
        showRegionLabels={showLabels}
        metaFields={["doorMode", "staging", "waveTime", "dsp", "wave"]}
        enableRouteDrag={showRoutes}
        onRouteSwap={(sourceRegionId, targetRegionId) => {
          const sourceRoute = applied.slotToRoute[sourceRegionId];
          if (!sourceRoute) return;
          const targetRoute = applied.slotToRoute[targetRegionId];

          const next = { ...applied.normalizedOverrides };
          const setOverride = (route: string, slotId: string) => {
            const autoSlot = applied.autoSlotByRoute[route];
            if (!autoSlot || autoSlot === slotId) delete next[route];
            else next[route] = slotId;
          };

          setOverride(sourceRoute, targetRegionId);
          if (targetRoute) setOverride(targetRoute, sourceRegionId);

          setRouteOverrides(next);
          setCopied(false);
        }}
        onDoorToggle={(doorId) => {
          const num = Number(doorId.replace("door_", ""));
          if (!Number.isFinite(num)) return;
          toggleDoorMode(num);
        }}
      />

      <details style={detailsStyle}>
        <summary style={summaryStyle}>
          Route overrides (JSON) ({Object.keys(applied.normalizedOverrides).length})
        </summary>
        <textarea
          value={exportJson}
          readOnly
          spellCheck={false}
          style={textareaStyle}
          aria-label="Floor route override JSON"
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            style={pillButtonStyle}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(exportJson);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
          <button
            type="button"
            style={{
              ...pillButtonStyle,
              backgroundColor: "oklch(from #e2e8f0 l c h)",
              color: "oklch(from #0f172a l c h)",
            }}
            onClick={() => {
              clearRouteOverrides();
              setCopied(false);
            }}
            disabled={!Object.keys(applied.normalizedOverrides).length}
          >
            Clear overrides
          </button>
        </div>
      </details>
    </div>
  );
}

const toggleStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  fontWeight: 600,
};

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
