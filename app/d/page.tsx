"use client";

import { useEffect } from "react";
import { DoorAssignmentList } from "@/components/DoorAssignmentList";
import { DoorSettings } from "@/components/DoorSettings";
import { Doors } from "@/components/Doors";
import { FloorPlanGenerator } from "@/components/FloorPlanGenerator";
import { RouteFloorPreview } from "@/components/RouteFloorPreview";
import { RoutesInput } from "@/components/RoutesInput";

export default function Page() {
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;

    document.body.style.backgroundColor = "#FFF";
    document.body.style.color = "#000";

    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <RoutesInput />
      <section style={{ display: "grid", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Door settings</h2>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Adjust which doors are available before generating assignments.
        </p>
        <DoorSettings />
      </section>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Floor overlay from pasted routes</h2>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Uses the routes you paste above: 1×6 slots fill with CP-prefixed routes, 2×3 slots fill
          with everything else in wave order. Toggle overlays below.
        </p>
        <RouteFloorPreview />
      </div>

      <section style={{ display: "grid", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Dock door board</h2>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Drag/drop overrides: click “override” on a route card to drag it onto another door.
        </p>
        <Doors />
      </section>

      <section style={{ display: "grid", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Dock door assignments</h2>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Lists each route with its door, staging code, and DSP from the current generation.
        </p>
        <DoorAssignmentList />
      </section>

      <section style={{ display: "grid", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>Floor plan layout</h2>
        <p style={{ margin: 0, color: "oklch(from #475569 l c h)" }}>
          Paste or edit a layout JSON. Resetting leaves you with an empty canvas (no doors/slots);
          add doors from your settings, then drag shapes only if you need them. Routes you paste
          above keep overlaying automatically.
        </p>
        <FloorPlanGenerator />
      </section>
    </div>
  );
}
