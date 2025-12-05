"use client";

import { useMemo } from "react";
import { useDoorsStore } from "@/components/Doors/store";

type AssignmentRow = {
  door: number;
  route: string;
  staging: string;
  dsp: string;
};

export function DoorAssignmentList() {
  const doors = useDoorsStore((s) => s.doors);

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

  if (!rows.length) {
    return (
      <p style={{ margin: 0, color: "oklch(from #94a3b8 l c h)" }}>
        No routes assigned to dock doors yet.
      </p>
    );
  }

  const textAreaValue = [
    "Door\tRoute\tStaging\tDSP",
    ...rows.map((row) => `${row.door}\t${row.route}\t${row.staging}\t${row.dsp}`),
  ].join("\n");

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
    </div>
  );
}
