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
  padding: "0.25rem 0.5rem",
  fontSize: "1.1rem",
  cursor: "pointer",
  border: "none",
  background: "none",
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
          } catch (e) {
            console.warn("Failed to clear localStorage", e);
          }
        }}
        style={buttonStyle}
      >
        🗑️
      </button>
    </div>
  );
}
