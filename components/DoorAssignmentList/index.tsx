"use client";

import { useMemo, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";

type AssignmentRow = {
  door: number;
  route: string;
  staging: string;
  dsp: string;
};

export function DoorAssignmentList() {
  const doors = useDoorsStore((s) => s.doors);
  const doorOverrides = useDoorsStore((s) => s.doorOverrides);
  const autoDoorByRoute = useDoorsStore((s) => s.autoDoorByRoute);
  const doorNumbers = useDoorsStore((s) => s.doorNumbers);
  const doorMode = useDoorsStore((s) => s.doorMode);
  const clearDoorOverrides = useDoorsStore((s) => s.clearDoorOverrides);

  const [copied, setCopied] = useState(false);

  const rows = useMemo<AssignmentRow[]>(() => {
    const list: AssignmentRow[] = [];
    for (const [doorKey, slots] of Object.entries(doors || {})) {
      const door = Number(doorKey);
      if (!Number.isFinite(door)) continue;
      for (const slot of slots || []) {
        if (!slot) continue;
        list.push({
          door,
          route: slot.route,
          staging: slot.staging,
          dsp: slot.dsp ?? "",
        });
      }
    }
    return list.sort((a, b) =>
      b.door !== a.door ? b.door - a.door : a.route.localeCompare(b.route),
    );
  }, [doors]);

  const textAreaValue = [
    "Door\tRoute\tStaging\tDSP",
    ...rows.map((row) => `${row.door}\t${row.route}\t${row.staging}\t${row.dsp}`),
  ].join("\n");

  const overridesJson = useMemo(() => {
    const moves = Object.entries(doorOverrides)
      .map(([route, toDoor]) => ({
        route,
        fromDoor: autoDoorByRoute[route] ?? null,
        toDoor,
      }))
      .sort((a, b) =>
        b.toDoor !== a.toDoor ? b.toDoor - a.toDoor : a.route.localeCompare(b.route),
      );

    return JSON.stringify(
      {
        moves,
        doorNumbers,
        doorMode,
      },
      null,
      2,
    );
  }, [autoDoorByRoute, doorMode, doorNumbers, doorOverrides]);

  if (!rows.length) {
    return (
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <p style={{ margin: 0, color: "oklch(from #94a3b8 l c h)" }}>
          No routes assigned to dock doors yet.
        </p>

        <label htmlFor="dockOverrides" style={{ fontWeight: 700 }}>
          Drag/drop overrides (JSON)
        </label>
        <textarea
          id="dockOverrides"
          value={overridesJson}
          readOnly
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: "8rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.8rem",
            padding: "0.5rem",
            borderRadius: "0.375rem",
            border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
            background: "oklch(from #f8fafc l c h)",
            color: "oklch(from #0f172a l c h)",
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(overridesJson);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            style={pillButtonStyle}
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={() => {
              clearDoorOverrides();
              setCopied(false);
            }}
            style={{
              ...pillButtonStyle,
              backgroundColor: "oklch(from #e2e8f0 l c h)",
              color: "oklch(from #0f172a l c h)",
            }}
          >
            Clear overrides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.35rem" }}>
      <label htmlFor="dockAssignments" style={{ fontWeight: 700 }}>
        Dock door assignments (copyable)
      </label>
      <textarea
        id="dockAssignments"
        value={textAreaValue}
        readOnly
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "8rem",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "0.8rem",
          padding: "0.5rem",
          borderRadius: "0.375rem",
          border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
          background: "oklch(from #f8fafc l c h)",
          color: "oklch(from #0f172a l c h)",
          resize: "vertical",
        }}
      />

      <label htmlFor="dockOverrides" style={{ fontWeight: 700 }}>
        Drag/drop overrides (JSON)
      </label>
      <textarea
        id="dockOverrides"
        value={overridesJson}
        readOnly
        spellCheck={false}
        style={{
          width: "100%",
          minHeight: "8rem",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: "0.8rem",
          padding: "0.5rem",
          borderRadius: "0.375rem",
          border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
          background: "oklch(from #f8fafc l c h)",
          color: "oklch(from #0f172a l c h)",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(overridesJson);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
          style={pillButtonStyle}
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearDoorOverrides();
            setCopied(false);
          }}
          style={{
            ...pillButtonStyle,
            backgroundColor: "oklch(from #e2e8f0 l c h)",
            color: "oklch(from #0f172a l c h)",
          }}
        >
          Clear overrides
        </button>
      </div>
    </div>
  );
}

const pillButtonStyle = {
  appearance: "none",
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  backgroundColor: "oklch(from #2563eb l c h)",
  color: "oklch(from #f8fafc l c h)",
  borderRadius: "999px",
  padding: "0.375rem 0.75rem",
  fontWeight: 600,
  cursor: "pointer",
} as const;
