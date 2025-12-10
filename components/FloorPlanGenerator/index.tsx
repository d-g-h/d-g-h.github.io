"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useFloorPlanStore } from "@/components/FloorPlan/store";

export function FloorPlanGenerator() {
  const planText = useFloorPlanStore((s) => s.planText);
  const setPlanText = useFloorPlanStore((s) => s.setPlanText);
  const planError = useFloorPlanStore((s) => s.planError);
  const resetToEmpty = useFloorPlanStore((s) => s.resetToEmpty);
  const [importText, setImportText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  return (
    <details style={detailsStyle}>
      <summary style={summaryStyle}>Floor</summary>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <textarea
          aria-label="Floor plan JSON"
          value={importText}
          onChange={(event) => {
            setImportText(event.target.value);
            setImportError(null);
            setCopied(false);
          }}
          spellCheck={false}
          placeholder="Paste floor plan JSON"
          style={textareaStyle}
        />
        {importError ? (
          <p style={{ margin: 0, color: "oklch(from #b91c1c l c h)" }}>{importError}</p>
        ) : null}

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            style={pillButtonStyle}
            onClick={() => {
              const trimmed = importText.trim();
              if (!trimmed) return;
              try {
                const parsed = JSON.parse(importText) as unknown;
                const isRegionsArray = Array.isArray(parsed);
                const isPlanObject =
                  !!parsed &&
                  typeof parsed === "object" &&
                  Array.isArray((parsed as { regions?: unknown }).regions);
                if (!isRegionsArray && !isPlanObject) {
                  setImportError('Expected "{ regions: [...] }" or an array of regions.');
                  return;
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : "Invalid JSON";
                setImportError(message);
                return;
              }

              setPlanText(importText);
              setImportText("");
              setCopied(false);
            }}
            disabled={!importText.trim()}
          >
            Import
          </button>
          <button
            type="button"
            style={pillButtonStyle}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(planText);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            style={{
              ...pillButtonStyle,
              backgroundColor: "oklch(from #e2e8f0 l c h)",
              color: "oklch(from #0f172a l c h)",
            }}
            onClick={() => {
              resetToEmpty();
              setImportText("");
              setImportError(null);
              setCopied(false);
            }}
          >
            Reset
          </button>
        </div>

        {planError ? (
          <p style={{ margin: 0, color: "oklch(from #b91c1c l c h)" }}>{planError}</p>
        ) : null}
      </div>
    </details>
  );
}

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
