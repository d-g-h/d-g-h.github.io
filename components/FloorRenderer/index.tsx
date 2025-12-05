import type { CSSProperties, KeyboardEvent } from "react";
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
  onDoorToggle,
}: FloorRendererProps) {
  const unit = "rem";
  const cellSizeValue = `${cellSize}${unit}`;
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

  return (
    <div className={styles.canvas} style={containerStyle} role="presentation">
      {regions.map((region) => {
        const regionStyle: CSSProperties = {
          left: `${region.startX * cellSize}${unit}`,
          top: `${region.startY * cellSize}${unit}`,
          width: `${(region.endX - region.startX + 1) * cellSize}${unit}`,
          height: `${(region.endY - region.startY + 1) * cellSize}${unit}`,
          backgroundColor: getRegionColor(region),
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
        const interactiveProps =
          handleClick && handleKeyDown
            ? {
                role: "button" as const,
                tabIndex: 0,
                onClick: handleClick,
                onKeyDown: handleKeyDown,
                style: { ...regionStyle, cursor: "pointer" },
              }
            : { style: regionStyle };

        return (
          <div
            key={region.id}
            className={styles.region}
            title={region.id}
            data-region-type={region.type}
            data-route={region.route ?? ""}
            data-dsp={region.dsp ?? ""}
            {...interactiveProps}
          >
            <div className={styles.regionContent}>
              {showLabelTag ? <span className={styles.regionTag}>{region.label}</span> : null}
              {isDoor && modeSymbol ? (
                <span className={styles.regionMode}>{modeSymbol}</span>
              ) : null}
              {showRouteBlock ? (
                <div className={styles.regionInfo}>
                  {region.route ? <span className={styles.regionLine}>{region.route}</span> : null}
                  {metaFields.includes("doorMode") && modeSymbol ? (
                    <span className={styles.regionLine}>{modeSymbol}</span>
                  ) : null}
                  {metaFields.includes("staging") && region.staging ? (
                    <span className={styles.regionLine}>{`Staging ${region.staging}`}</span>
                  ) : null}
                  {metaFields.includes("waveTime") && region.waveTime ? (
                    <span className={styles.regionLine}>{region.waveTime}</span>
                  ) : null}
                  {metaFields.includes("vehicle") && region.vehicle ? (
                    <span className={styles.regionLine}>{region.vehicle}</span>
                  ) : null}
                  {metaFields.includes("dsp") && region.dsp ? (
                    <span className={styles.regionLine}>{region.dsp}</span>
                  ) : null}
                  {metaFields.includes("wave") && !region.waveTime && region.wave ? (
                    <span className={styles.regionLine}>{`Wave ${region.wave}`}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
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
