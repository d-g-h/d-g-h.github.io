"use client";

import type { CSSProperties, PointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import { FloorRenderer } from "@/components/FloorRenderer";
import type { Region } from "@/lib/floor";
import { doorsToRegions } from "@/lib/utils/doorRegions";

type FloorSlotBuilderProps = {
  regions: Region[];
  width: number;
  height: number;
  doorNumbers?: number[];
  enableDoorModeToggle?: boolean;
  onChange: (regions: Region[]) => void;
};

type ShapeKey = "2x3" | "1x6";

type SlotShape = {
  width: number;
  height: number;
  label: string;
  color: string;
};

const SHAPES: Record<ShapeKey, SlotShape> = {
  "2x3": { width: 2, height: 3, label: "2×3", color: "oklch(from #22d3ee l c h)" },
  "1x6": { width: 1, height: 6, label: "1×6", color: "oklch(from #a855f7 l c h)" },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function regionsOverlap(a: Region, b: Region): boolean {
  return a.startX <= b.endX && a.endX >= b.startX && a.startY <= b.endY && a.endY >= b.startY;
}

function sanitizeRegion(
  topLeftX: number,
  topLeftY: number,
  shape: SlotShape,
  width: number,
  height: number,
): Region {
  const startX = clamp(topLeftX, 0, width - shape.width);
  const startY = clamp(topLeftY, 0, height - shape.height);
  return {
    id: "",
    label: shape.label,
    type: "lane",
    startX,
    startY,
    endX: startX + shape.width - 1,
    endY: startY + shape.height - 1,
    color: shape.color,
  };
}

function getCellFromEvent(
  event: PointerEvent<HTMLDivElement>,
  gridWidth: number,
  gridHeight: number,
): { x: number; y: number } | null {
  const rect = event.currentTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const relativeX = clamp(event.clientX - rect.left, 0, rect.width);
  const relativeY = clamp(event.clientY - rect.top, 0, rect.height);
  const x = clamp(Math.floor((relativeX / rect.width) * gridWidth), 0, gridWidth - 1);
  const y = clamp(Math.floor((relativeY / rect.height) * gridHeight), 0, gridHeight - 1);
  return { x, y };
}

function nextSlotIndex(shapeKey: ShapeKey, regions: Region[]): number {
  const prefix = shapeKey === "2x3" ? "slot_2x3_" : "slot_1x6_";
  let maxIndex = 0;
  for (const region of regions) {
    if (!region.id.startsWith(prefix)) continue;
    const suffix = Number(region.id.slice(prefix.length));
    if (Number.isFinite(suffix)) {
      maxIndex = Math.max(maxIndex, suffix);
    }
  }
  return maxIndex + 1;
}

export function FloorSlotBuilder({
  regions,
  width,
  height,
  doorNumbers = [],
  enableDoorModeToggle = false,
  onChange,
}: FloorSlotBuilderProps) {
  const doorModeState = useDoorsStore((s) => s.doorMode);
  const setDoorMode = useDoorsStore((s) => s.setDoorMode);
  const [shapeKey, setShapeKey] = useState<ShapeKey>("2x3");
  const [previewRegion, setPreviewRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const isDraggingRef = useRef<boolean>(false);

  const regionsForRender = useMemo(() => {
    if (!previewRegion) return regions;
    return [...regions, { ...previewRegion, id: "__preview" }];
  }, [regions, previewRegion]);

  const placeRegion = (event: PointerEvent<HTMLDivElement>) => {
    const cell = getCellFromEvent(event, width, height);
    if (!cell) return;
    const shape = SHAPES[shapeKey];
    const candidate = sanitizeRegion(cell.x, cell.y, shape, width, height);

    const overlapsExisting = regions.some((region) => regionsOverlap(region, candidate));
    if (overlapsExisting) {
      setError("Placement overlaps an existing region. Try another spot.");
      return;
    }

    const nextIndex = nextSlotIndex(shapeKey, regions);
    const newId = shapeKey === "2x3" ? `slot_2x3_${nextIndex}` : `slot_1x6_${nextIndex}`;
    const newRegion: Region = {
      ...candidate,
      id: newId,
      label: `${shape.label} #${nextIndex}`,
      type: "lane",
    };

    onChange([...regions, newRegion]);
    setAddedIds((prev) => [...prev, newId]);
    setPreviewRegion(null);
    setError(null);
  };

  const updatePreview = (event: PointerEvent<HTMLDivElement>) => {
    const cell = getCellFromEvent(event, width, height);
    if (!cell) return;
    const shape = SHAPES[shapeKey];
    setPreviewRegion(sanitizeRegion(cell.x, cell.y, shape, width, height));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePreview(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updatePreview(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    placeRegion(event);
    setPreviewRegion(null);
  };

  const handleUndo = () => {
    const lastId = addedIds[addedIds.length - 1];
    if (!lastId) return;
    onChange(regions.filter((region) => region.id !== lastId));
    setAddedIds((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    if (!addedIds.length) return;
    const removalSet = new Set(addedIds);
    onChange(regions.filter((region) => !removalSet.has(region.id)));
    setAddedIds([]);
    setError(null);
    setPreviewRegion(null);
  };

  const insertDoors = () => {
    if (!doorNumbers.length) return;
    const withoutDoors = regions.filter((region) => region.type !== "door");
    const doorRegions = doorsToRegions(doorNumbers);
    onChange([...withoutDoors, ...doorRegions]);
    setError(null);
  };

  const clearDoors = () => {
    const withoutDoors = regions.filter((region) => region.type !== "door");
    onChange(withoutDoors);
    setError(null);
  };

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Shape:</span>
        {(Object.keys(SHAPES) as ShapeKey[]).map((key) => {
          const active = key === shapeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setShapeKey(key)}
              style={{
                ...pillButtonStyle,
                background: active ? "oklch(from #2563eb l c h)" : "oklch(from #e2e8f0 l c h)",
                color: active ? "oklch(from #f8fafc l c h)" : "oklch(from #0f172a l c h)",
              }}
            >
              {SHAPES[key].label}
            </button>
          );
        })}
        <button type="button" onClick={handleUndo} style={pillButtonStyle}>
          Undo
        </button>
        <button type="button" onClick={handleClear} style={pillButtonStyle}>
          Clear
        </button>
        <button
          type="button"
          onClick={insertDoors}
          style={pillButtonStyle}
          disabled={!doorNumbers.length}
        >
          Insert doors
        </button>
        <button type="button" onClick={clearDoors} style={pillButtonStyle}>
          Clear doors
        </button>
      </div>

      <p style={{ margin: 0, color: "oklch(from #334155 l c h)" }}>
        Drag to place. {width} × {height}.
      </p>
      {error ? <p style={{ margin: 0, color: "oklch(from #b91c1c l c h)" }}>{error}</p> : null}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setPreviewRegion(null)}
        style={{
          position: "relative",
          width: `${width * 1.8}rem`,
          height: `${height * 1.8}rem`,
          borderRadius: "0.5rem",
          overflow: "hidden",
        }}
      >
        <FloorRenderer
          regions={regionsForRender}
          width={width}
          height={height}
          cellSize={1.8}
          showGrid
          metaFields={["doorMode", "staging", "waveTime", "dsp", "wave"]}
          onDoorToggle={
            enableDoorModeToggle
              ? (doorId) => {
                  const num = Number(doorId.replace("door_", ""));
                  if (!Number.isFinite(num)) return;
                  const current = doorModeState[num] ?? "all";
                  const next =
                    current === "all" ? "truck-only" : current === "truck-only" ? "closed" : "all";
                  setDoorMode(num);
                  onChange(
                    regions.map((region) =>
                      region.id === doorId
                        ? {
                            ...region,
                            doorMode: next,
                          }
                        : region,
                    ),
                  );
                }
              : undefined
          }
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            cursor: "crosshair",
          }}
        />
      </div>
    </div>
  );
}

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
