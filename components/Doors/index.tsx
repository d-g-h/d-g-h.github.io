"use client";

import { Door } from "@/components/Door";
import { useDoorsStore } from "@/components/Doors/store";

export function Doors() {
  const doors = useDoorsStore((s) => s.doors);
  const doorMode = useDoorsStore((s) => s.doorMode);

  const doorEntries = Object.entries(doors || {})
    .map(([doorKey, routes]) => {
      const doorNum = Number(doorKey);
      return {
        id: doorKey,
        door: doorNum,
        routes: (routes || []).filter((r): r is NonNullable<typeof r> => Boolean(r)),
        mode: doorMode[doorNum] ?? "all",
      };
    })
    .sort((a, b) => b.door - a.door);

  if (!doorEntries.length) {
    return (
      <p style={{ margin: 0, color: "oklch(from #94a3b8 l c h)" }}>
        No door assignments yet. Paste routes and generate to view doors.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      {doorEntries.map((door) => (
        <div key={door.id} style={{ display: "grid", gap: "0.25rem" }}>
          <div style={{ fontWeight: 700, color: "oklch(from #0f172a l c h)" }}>
            Door {door.door}{" "}
            {door.mode === "truck-only" ? "🚚" : door.mode === "closed" ? "⛔" : "✅"}
          </div>
          <Door door={door} />
        </div>
      ))}
    </div>
  );
}
