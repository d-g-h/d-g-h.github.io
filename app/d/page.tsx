import { ClearLocalStorageButton } from "@/components/ClearLocalStorageButton";
import { DoorAssignmentList } from "@/components/DoorAssignmentList";
import { DoorSettings } from "@/components/DoorSettings";
import { Doors } from "@/components/Doors";
import { FloorPlanGenerator } from "@/components/FloorPlanGenerator";
import { RouteFloorPreview } from "@/components/RouteFloorPreview";
import { RoutesInput } from "@/components/RoutesInput";

export default function Page() {
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <ClearLocalStorageButton />
      <RoutesInput />
      <FloorPlanGenerator />
      <RouteFloorPreview />

      <details style={{ display: "grid", gap: "0.75rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Dock</summary>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <DoorSettings />
          <Doors />
          <DoorAssignmentList />
        </div>
      </details>
    </div>
  );
}
