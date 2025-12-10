"use client";

type ClearLocalStorageButtonProps = {
  align?: "start" | "center" | "end";
};

const alignmentMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
} as const;

const buttonStyle = {
  appearance: "none",
  border: "0.0625rem solid oklch(from #cbd5e1 l c h)",
  backgroundColor: "oklch(from #f8fafc l c h)",
  color: "oklch(from #0f172a l c h)",
  borderRadius: "0.75rem",
  padding: "0.25rem 0.5rem",
  fontSize: "1.1rem",
  lineHeight: 1,
  cursor: "pointer",
} as const;

export function ClearLocalStorageButton({ align = "end" }: ClearLocalStorageButtonProps) {
  const wrapperStyle = {
    display: "flex",
    justifyContent: alignmentMap[align],
  } as const;

  return (
    <div style={wrapperStyle}>
      <button
        type="button"
        aria-label="Clear local storage"
        title="Clear local storage"
        onClick={() => {
          try {
            localStorage.clear();
          } catch {
            // Ignore storage errors to keep the UI responsive.
          }
        }}
        style={buttonStyle}
      >
        🗑️
      </button>
    </div>
  );
}
