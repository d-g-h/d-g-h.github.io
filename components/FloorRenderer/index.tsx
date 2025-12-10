"use client";

import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import type { Region } from "@/lib/floor";
import styles from "./floorRenderer.module.css";

type FloorRendererProps = {
  regions: Region[];
  width: number;
  height: number;
  cellSize?: number; // rem units
  showGrid?: boolean;
  showRegionLabels?: boolean;
  showRoutes?: boolean;
  metaFields?: Array<"doorMode" | "staging" | "vehicle" | "dsp" | "waveTime" | "wave">;
  enableRouteDrag?: boolean;
  onRouteSwap?: (sourceRegionId: string, targetRegionId: string) => void;
  onDoorToggle?: (doorId: string) => void;
};

const REGION_COLORS: Record<Region["type"], string> = {
  door: "oklch(from #2563eb l c h)",
  lane: "oklch(from #16a34a l c h)",
  aisle: "oklch(from #d1d5db l c h)",
  staging: "oklch(from #f97316 l c h)",
  forbidden: "oklch(from #0f172a l c h)",
};

const LANE_VARIANT_COLORS: Record<string, string> = {
  CP: "oklch(from #a855f7 l c h)",
  C: "oklch(from #06b6d4 l c h)",
  F: "oklch(from #16a34a l c h)",
  I: "oklch(from #f59e0b l c h)",
};

function getVehicleEmoji(vehicle: Region["vehicle"] | undefined): string | null {
  if (vehicle === "van") return "🚐";
  if (vehicle === "truck") return "🚚";
  return null;
}

function getLaneVariantColor(label?: string): string | undefined {
  if (!label) return undefined;
  const normalized = label.trim().toUpperCase();
  if (normalized.startsWith("CP")) return LANE_VARIANT_COLORS.CP;
  if (normalized.startsWith("C")) return LANE_VARIANT_COLORS.C;
  if (normalized.startsWith("F")) return LANE_VARIANT_COLORS.F;
  if (normalized.startsWith("I")) return LANE_VARIANT_COLORS.I;
  return undefined;
}

function getRegionColor(region: Region): string {
  if (region.color) return region.color;
  if (region.type === "lane") {
    const laneVariantColor = getLaneVariantColor(region.label);
    if (laneVariantColor) return laneVariantColor;
  }
  return REGION_COLORS[region.type];
}

export function FloorRenderer({
  regions,
  width,
  height,
  cellSize = 2.5,
  showGrid = false,
  showRegionLabels = true,
  showRoutes = true,
  metaFields = ["doorMode", "staging", "vehicle", "dsp", "waveTime", "wave"],
  enableRouteDrag = false,
  onRouteSwap,
  onDoorToggle,
}: FloorRendererProps) {
  const dragStateRef = useRef<{
    pointerId: number;
    sourceRegionId: string;
    startX: number;
    startY: number;
    element: HTMLDivElement;
    onRouteSwap: (sourceRegionId: string, targetRegionId: string) => void;
  } | null>(null);
  const [draggingRegionId, setDraggingRegionId] = useState<string | null>(null);
  const globalDragListenersRef = useRef<{
    onPointerUp: (event: globalThis.PointerEvent) => void;
    onPointerCancel: (event: globalThis.PointerEvent) => void;
    onBlur: () => void;
  } | null>(null);
  const unit = "rem";
  const cellSizeValue = `${cellSize}${unit}`;
  const dividerThickness = Math.max(0.2, cellSize * 0.12);
  const twoByThreeLanes = regions.filter(
    (region) =>
      region.type === "lane" &&
      region.endX - region.startX + 1 === 2 &&
      region.endY - region.startY + 1 === 3,
  );
  const laneStartMap = new Map<string, Region>();
  for (const lane of twoByThreeLanes) {
    laneStartMap.set(`${lane.startX}:${lane.endX}:${lane.startY}`, lane);
  }
  const lanesWithDividerBelow = new Set<string>();
  const lanesWithDividerAbove = new Set<string>();
  for (const lane of twoByThreeLanes) {
    const belowKey = `${lane.startX}:${lane.endX}:${lane.endY + 1}`;
    const belowLane = laneStartMap.get(belowKey);
    if (!belowLane) continue;
    lanesWithDividerBelow.add(lane.id);
    lanesWithDividerAbove.add(belowLane.id);
  }
  const containerStyle: CSSProperties = {
    width: `${width * cellSize}${unit}`,
    height: `${height * cellSize}${unit}`,
    backgroundSize: showGrid ? `${cellSizeValue} ${cellSizeValue}` : undefined,
    backgroundImage: showGrid
      ? `
        linear-gradient(to right, rgba(15, 23, 42, 0.12) 0.0625rem, transparent 0.0625rem),
        linear-gradient(to bottom, rgba(15, 23, 42, 0.12) 0.0625rem, transparent 0.0625rem)
      `
      : undefined,
  };

  const coordinateGridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${width}, ${cellSizeValue})`,
    gridTemplateRows: `repeat(${height}, ${cellSizeValue})`,
  };

  const doorModeEmoji = (mode?: Region["doorMode"]) => {
    if (mode === "truck-only") return "🚚";
    if (mode === "closed") return "⛔";
    if (mode === "all") return "✅";
    return null;
  };

  function getLaneAtPoint(clientX: number, clientY: number): HTMLElement | null {
    if (typeof document === "undefined") return null;

    const elements =
      typeof document.elementsFromPoint === "function"
        ? document.elementsFromPoint(clientX, clientY)
        : [document.elementFromPoint(clientX, clientY)].filter((value): value is Element =>
            Boolean(value),
          );

    for (const element of elements) {
      const lane = element.closest?.('[data-region-type="lane"]');
      if (lane instanceof HTMLElement) return lane;
    }

    return null;
  }

  function detachGlobalDragListeners() {
    if (typeof window === "undefined") return;
    const listeners = globalDragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener("pointerup", listeners.onPointerUp);
    window.removeEventListener("pointercancel", listeners.onPointerCancel);
    window.removeEventListener("blur", listeners.onBlur);
    globalDragListenersRef.current = null;
  }

  function cancelDrag(pointerId: number) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== pointerId) return;
    dragStateRef.current = null;
    detachGlobalDragListeners();
    setDraggingRegionId(null);
    try {
      state.element.releasePointerCapture(pointerId);
    } catch {
      // ignore
    }
  }

  function finishDrag(pointerId: number, clientX: number, clientY: number) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== pointerId) return;
    dragStateRef.current = null;
    detachGlobalDragListeners();
    setDraggingRegionId(null);
    try {
      state.element.releasePointerCapture(pointerId);
    } catch {
      // ignore
    }

    const dx = Math.abs(clientX - state.startX);
    const dy = Math.abs(clientY - state.startY);
    if (dx + dy < 6) return;

    const targetLane = getLaneAtPoint(clientX, clientY);
    const targetRegionId = targetLane?.dataset.regionId?.trim() ?? "";
    if (!targetRegionId || targetRegionId === state.sourceRegionId) return;

    const targetRoute = (targetLane?.dataset.route ?? "").trim();
    if (targetRoute) return;

    state.onRouteSwap(state.sourceRegionId, targetRegionId);
  }

  function onRoutePointerDown(event: ReactPointerEvent<HTMLDivElement>, regionId: string) {
    if (!enableRouteDrag || !onRouteSwap) return;
    if (event.button !== 0) return;
    detachGlobalDragListeners();
    setDraggingRegionId(regionId);

    const element = event.currentTarget;
    dragStateRef.current = {
      pointerId: event.pointerId,
      sourceRegionId: regionId,
      startX: event.clientX,
      startY: event.clientY,
      element,
      onRouteSwap,
    };
    const listeners = {
      onPointerUp: (windowEvent: globalThis.PointerEvent) => {
        finishDrag(windowEvent.pointerId, windowEvent.clientX, windowEvent.clientY);
      },
      onPointerCancel: (windowEvent: globalThis.PointerEvent) => {
        cancelDrag(windowEvent.pointerId);
      },
      onBlur: () => {
        const current = dragStateRef.current;
        if (current) cancelDrag(current.pointerId);
      },
    };
    globalDragListenersRef.current = listeners;
    if (typeof window !== "undefined") {
      window.addEventListener("pointerup", listeners.onPointerUp);
      window.addEventListener("pointercancel", listeners.onPointerCancel);
      window.addEventListener("blur", listeners.onBlur);
    }

    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    event.preventDefault();
  }

  return (
    <div className={styles.canvas} style={containerStyle} role="presentation">
      {regions.map((region) => {
        const regionStyle: CSSProperties = {
          left: `${region.startX * cellSize}${unit}`,
          top: `${region.startY * cellSize}${unit}`,
          width: `${(region.endX - region.startX + 1) * cellSize}${unit}`,
          height: `${(region.endY - region.startY + 1) * cellSize}${unit}`,
          backgroundColor: getRegionColor(region),
          borderBottom: lanesWithDividerBelow.has(region.id)
            ? `${dividerThickness}${unit} solid #000`
            : undefined,
          borderTopWidth: lanesWithDividerAbove.has(region.id) ? "0" : undefined,
        };

        const showRouteBlock =
          showRoutes &&
          (region.route ||
            (metaFields.includes("doorMode") && region.doorMode) ||
            (metaFields.includes("staging") && region.staging) ||
            (metaFields.includes("waveTime") && region.waveTime) ||
            (metaFields.includes("dsp") && region.dsp) ||
            (metaFields.includes("wave") && region.wave) ||
            (metaFields.includes("vehicle") && region.vehicle));
        const showLabelTag = showRegionLabels && !!region.label && !showRouteBlock;
        const modeSymbol = doorModeEmoji(region.doorMode);
        const isDoor = region.type === "door";
        const isDraggableRoute =
          enableRouteDrag &&
          showRoutes &&
          !!region.route &&
          region.type === "lane" &&
          !!onRouteSwap;
        const isDragging = isDraggableRoute && draggingRegionId === region.id;
        const dragEmoji = isDragging ? getVehicleEmoji(region.vehicle ?? "truck") : null;

        const handleClick = isDoor && onDoorToggle ? () => onDoorToggle(region.id) : undefined;
        const handleKeyDown =
          isDoor && onDoorToggle
            ? (event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onDoorToggle(region.id);
                }
              }
            : undefined;
        const style: CSSProperties =
          handleClick && handleKeyDown ? { ...regionStyle, cursor: "pointer" } : regionStyle;
        const interactiveProps =
          handleClick && handleKeyDown
            ? {
                role: "button" as const,
                tabIndex: 0,
                onClick: handleClick,
                onKeyDown: handleKeyDown,
                style,
              }
            : { style };

        const regionInfoContent = (
          <>
            {dragEmoji ? <span className={styles.dragEmoji}>{dragEmoji}</span> : null}
            {region.route ? (
              <span className={`${styles.regionLine} ${styles.regionLineSmall}`}>
                {region.route}
              </span>
            ) : null}
            {metaFields.includes("doorMode") && modeSymbol ? (
              <span className={styles.regionLine}>{modeSymbol}</span>
            ) : null}
            {metaFields.includes("staging") && region.staging ? (
              <span className={`${styles.regionLine} ${styles.regionLineStaging}`}>
                {`${region.staging}`}
              </span>
            ) : null}
            {metaFields.includes("waveTime") && region.waveTime ? (
              <span className={`${styles.regionLine} ${styles.regionLineSmall}`}>
                {region.waveTime}
              </span>
            ) : null}
            {metaFields.includes("vehicle") && region.vehicle ? (
              <span className={styles.regionLine}>{region.vehicle}</span>
            ) : null}
            {metaFields.includes("dsp") && region.dsp ? (
              <span className={`${styles.regionLine} ${styles.regionLineSmall}`}>{region.dsp}</span>
            ) : null}
            {metaFields.includes("wave") && !region.waveTime && region.wave ? (
              <span className={styles.regionLine}>{`Wave ${region.wave}`}</span>
            ) : null}
          </>
        );

        const regionInfoBlock = showRouteBlock ? (
          <div className={styles.regionInfo}>{regionInfoContent}</div>
        ) : null;

        const regionContent = (
          <>
            {showLabelTag ? <span className={styles.regionTag}>{region.label}</span> : null}
            {isDoor && modeSymbol ? <span className={styles.regionMode}>{modeSymbol}</span> : null}
            {regionInfoBlock}
          </>
        );

        const content = isDraggableRoute ? (
          <div
            className={styles.regionContent}
            style={{
              userSelect: "none",
              touchAction: "none",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onPointerDown={(event) => onRoutePointerDown(event, region.id)}
          >
            {regionContent}
          </div>
        ) : (
          <div className={styles.regionContent}>{regionContent}</div>
        );

        return (
          <div
            key={region.id}
            className={`${styles.region} ${isDragging ? styles.regionDragging : ""}`}
            title={region.id}
            data-region-id={region.id}
            data-region-type={region.type}
            data-route={region.route ?? ""}
            data-dsp={region.dsp ?? ""}
            {...interactiveProps}
          >
            {content}
          </div>
        );
      })}
      {showGrid ? (
        <div className={styles.coordinateGrid} style={coordinateGridStyle} aria-hidden="true">
          {Array.from({ length: height }).map((_, row) =>
            Array.from({ length: width }).map((_, col) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: synthetic grid keyed by coordinates
              <span key={`${col}-${row}`} className={styles.coordinateCell}>
                ({col},{row})
              </span>
            )),
          )}
        </div>
      ) : null}
    </div>
  );
}
