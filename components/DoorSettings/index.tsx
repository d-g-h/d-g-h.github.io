"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import { DEFAULT_DOOR_NUMBERS } from "@/lib/utils/doors";

export function DoorSettings() {
  const doorNumbers = useDoorsStore((s) => s.doorNumbers);
  const setDoorNumbers = useDoorsStore((s) => s.setDoorNumbers);

  const [doorText, setDoorText] = useState<string>(doorNumbers.join(", "));
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDoorText(doorNumbers.join(", "));
  }, [doorNumbers]);

  const applyDoors = () => {
    const parsed = doorText
      .split(/[,\\s]+/)
      .map((d) => Number(d))
      .filter((d) => Number.isFinite(d))
      .filter((value, index, arr) => arr.indexOf(value) === index);

    setDoorNumbers(parsed);
    setStatus("Door numbers updated");
  };

  const resetDefaults = () => {
    setDoorNumbers(DEFAULT_DOOR_NUMBERS);
    setStatus("Reset to defaults");
  };

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ display: "grid", gap: "0.35rem" }}>
        <label htmlFor="doorNumbers" style={{ fontWeight: 700 }}>
          Door numbers (comma or space separated)
        </label>
        <input
          id="doorNumbers"
          value={doorText}
          onChange={(event) => setDoorText(event.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "0.375rem",
            border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={applyDoors} style={pillButtonStyle}>
            Apply door numbers
          </button>
          <button
            type="button"
            onClick={() => {
              setDoorText(DEFAULT_DOOR_NUMBERS.join(", "));
              setStatus(null);
              resetDefaults();
            }}
            style={{
              ...pillButtonStyle,
              backgroundColor: "oklch(from #e2e8f0 l c h)",
              color: "oklch(from #0f172a l c h)",
            }}
          >
            Fill defaults
          </button>
        </div>
      </div>

      {status ? <p style={{ margin: 0, color: "oklch(from #15803d l c h)" }}>{status}</p> : null}
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
