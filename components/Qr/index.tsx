"use client";

import React, { useEffect } from "react";
import { create } from "zustand";
import styles from "@/components/Qr/qr.module.css";
import { getNextDisplayState } from "@/lib/utils/displayState";
import { getQRCode } from "@/lib/utils/getQRCode";
import { decodeQRState, encodeQRState } from "@/lib/utils/qrState";
import { svgStringToElement } from "@/lib/utils/svg";

export type QRRow = {
  id: string;
  label: string;
  value: string;
  name: string;
  svg: string;
};

export type DisplayState = "show" | "hide" | "qrOnly";

interface QRStore {
  input: string;
  rows: QRRow[];
  inProgress: QRRow[];
  displayStates: Map<string, DisplayState>;
  loading: boolean;
  showTextarea: boolean;
  setInput: (input: string) => void;
  setRows: (rows: QRRow[]) => void;
  setInProgress: (rows: QRRow[]) => void;
  setDisplayStates: (
    states:
      | Map<string, DisplayState>
      | ((prev: Map<string, DisplayState>) => Map<string, DisplayState>),
  ) => void;
  setLoading: (loading: boolean) => void;
  setShowTextarea: (show: boolean | ((prev: boolean) => boolean)) => void;
}

const useQRStore = create<QRStore>((set) => ({
  input: "",
  rows: [],
  inProgress: [],
  displayStates: new Map(),
  loading: false,
  showTextarea: true,
  setInput: (input) => set({ input }),
  setRows: (rows) => set({ rows }),
  setInProgress: (inProgress) => set({ inProgress }),
  setDisplayStates: (displayStates) =>
    set((state) => ({
      displayStates:
        typeof displayStates === "function" ? displayStates(state.displayStates) : displayStates,
    })),
  setLoading: (loading) => set({ loading }),
  setShowTextarea: (showTextarea) =>
    set((state) => ({
      showTextarea:
        typeof showTextarea === "function" ? showTextarea(state.showTextarea) : showTextarea,
    })),
}));

export default function Qr() {
  const {
    input,
    rows,
    inProgress,
    displayStates,
    loading,
    showTextarea,
    setInput,
    setRows,
    setInProgress,
    setDisplayStates,
    setLoading,
    setShowTextarea,
  } = useQRStore();

  useEffect(() => {
    const loadFromURL = async () => {
      const params = new URLSearchParams(window.location.search);
      const stateParam = params.get("state");
      if (!stateParam) return;

      try {
        const decoded = await decodeQRState(stateParam);
        if (!decoded) return;

        const allRowsFromDecoded = decoded.rows;

        const inProgRows: QRRow[] = allRowsFromDecoded.filter((row) =>
          decoded.inProgressIds.includes(row.id),
        );
        const mainRows: QRRow[] = allRowsFromDecoded.filter(
          (row) => !decoded.inProgressIds.includes(row.id),
        );

        setDisplayStates(decoded.displayStates);
        setRows(mainRows);
        setInProgress(inProgRows);

        const rebuiltInput = [...mainRows, ...inProgRows]
          .map((r) => `${r.label} ${r.value} ${r.name}`)
          .join("\n");
        setInput(rebuiltInput);

        const regenSVGs = async () => {
          setLoading(true);

          const updatedRows = await Promise.all(
            allRowsFromDecoded.map(async (row) => ({
              ...row,
              svg: await getQRCode({ text: row.value }),
            })),
          );

          const updatedMainRows = updatedRows.filter((r) => !decoded.inProgressIds.includes(r.id));
          const updatedInProgRows = updatedRows.filter((r) => decoded.inProgressIds.includes(r.id));

          setRows(updatedMainRows);
          setInProgress(updatedInProgRows);
          setLoading(false);
        };
        regenSVGs();
      } catch (error_) {
        console.error("Failed to decode state from URL", error_);
      }
    };

    loadFromURL();
  }, [setInput, setDisplayStates, setRows, setInProgress, setLoading]);

  useEffect(() => {
    const syncToURL = async () => {
      try {
        const encoded = await encodeQRState(rows, inProgress, displayStates);
        const newURL = `?state=${encoded}`;

        // Only push to history if URL actually changed
        if (window.location.search !== newURL) {
          window.history.pushState(null, "", newURL);
        }
      } catch (_error) {
        console.error("Failed to encode state to URL", _error);
      }
    };

    syncToURL();
  }, [rows, inProgress, displayStates]);

  useEffect(() => {
    const handlePopState = async () => {
      const params = new URLSearchParams(window.location.search);
      const stateParam = params.get("state");

      if (!stateParam) {
        // No state in URL, reset to empty
        setRows([]);
        setInProgress([]);
        setDisplayStates(new Map());
        setInput("");
        return;
      }

      try {
        const decoded = await decodeQRState(stateParam);
        if (!decoded) return;

        const allRowsFromDecoded = decoded.rows;

        const inProgRows: QRRow[] = allRowsFromDecoded.filter((row) =>
          decoded.inProgressIds.includes(row.id),
        );
        const mainRows: QRRow[] = allRowsFromDecoded.filter(
          (row) => !decoded.inProgressIds.includes(row.id),
        );

        setDisplayStates(decoded.displayStates);
        setRows(mainRows);
        setInProgress(inProgRows);

        const rebuiltInput = [...mainRows, ...inProgRows]
          .map((r) => `${r.label} ${r.value} ${r.name}`)
          .join("\n");
        setInput(rebuiltInput);

        setLoading(true);
        const updatedRows = await Promise.all(
          allRowsFromDecoded.map(async (row) => ({
            ...row,
            svg: await getQRCode({ text: row.value }),
          })),
        );

        const updatedMainRows = updatedRows.filter((r) => !decoded.inProgressIds.includes(r.id));
        const updatedInProgRows = updatedRows.filter((r) => decoded.inProgressIds.includes(r.id));

        setRows(updatedMainRows);
        setInProgress(updatedInProgRows);
        setLoading(false);
      } catch (error_) {
        console.error("Failed to decode state from history", error_);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setInput, setDisplayStates, setRows, setInProgress, setLoading]);

  const handleGenerate = async () => {
    setLoading(true);
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const generatedRows = (
      await Promise.all(
        lines.map(async (line) => {
          const [label, value, name = ""] = line.split(/\s+/);
          if (!label || !value) return null;
          const svg = await getQRCode({ text: value });
          return { id: crypto.randomUUID(), label, value, name, svg };
        }),
      )
    ).filter(Boolean) as QRRow[];

    setRows(generatedRows);
    const initialStates = new Map<string, DisplayState>();
    for (const row of generatedRows) {
      initialStates.set(row.id, "hide");
    }

    setDisplayStates(initialStates);
    setLoading(false);
  };

  const cycleDisplayState = (row: QRRow) => {
    setDisplayStates((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(row.id) ?? "show";
      newMap.set(row.id, getNextDisplayState(current));
      return newMap;
    });
  };

  const handleDragStart = (e: React.DragEvent, row: QRRow, from: "main" | "progress") => {
    e.dataTransfer.setData("rowId", row.id);
    e.dataTransfer.setData("from", from);
  };

  const handleDrop = (e: React.DragEvent, to: "main" | "progress") => {
    e.preventDefault();
    const rowId = e.dataTransfer.getData("rowId");
    const from = e.dataTransfer.getData("from") as "main" | "progress";
    if (!rowId || from === to) return;

    let movedRow: QRRow | undefined;
    if (from === "main") {
      movedRow = rows.find((r) => r.id === rowId);
      if (!movedRow) return;
      const row = movedRow;
      setRows(rows.filter((r) => r.id !== rowId));
      setInProgress([...inProgress, row]);
    } else {
      movedRow = inProgress.find((r) => r.id === rowId);
      if (!movedRow) return;
      const row = movedRow;
      setInProgress(inProgress.filter((r) => r.id !== rowId));
      setRows([...rows, row]);
    }

    if (movedRow && to === "progress") {
      const id = movedRow.id;
      setDisplayStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(id) ?? "show";
        newMap.set(id, current === "show" ? "hide" : "show");
        return newMap;
      });
    }
  };

  const getQrOpacity = (state: DisplayState): number => {
    if (state === "hide") return 0.3;
    if (state === "qrOnly") return 0.1;
    return 1;
  };

  const getTextOpacity = (state: DisplayState): number => {
    if (state === "qrOnly") return 0;
    if (state === "hide") return 0.5;
    return 1;
  };

  const renderRow = (row: QRRow, section: "main" | "progress") => {
    const state = displayStates.get(row.id) ?? "show";
    const qrOpacity = getQrOpacity(state);
    const textOpacity = getTextOpacity(state);
    const svgElement = svgStringToElement(row.svg);

    return (
      <button
        key={`${row.id}-${section}`}
        type="button"
        className={styles.item}
        draggable
        onDragStart={(e) => handleDragStart(e, row, section)}
        onClick={() => cycleDisplayState(row)}
        style={{ opacity: qrOpacity, transition: "opacity 0.3s ease" }}
      >
        <div className={styles.label} style={{ opacity: textOpacity }}>
          {row.label}
        </div>
        <div className={styles.name} style={{ opacity: textOpacity }}>
          {row.name}
        </div>
        <div className={styles.qr}>{svgElement}</div>
        <div className={styles.value} style={{ opacity: textOpacity }}>
          {row.value}
        </div>
      </button>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button className={styles.button} type="button" onClick={() => setShowTextarea((p) => !p)}>
          {showTextarea ? "⊖" : "⊕"}
        </button>
        {showTextarea && (
          <>
            <textarea
              name="columns"
              className={styles.textarea}
              placeholder={`XL19 83 F.1\nXL20 84 I.1\nXL21 85 C.2`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className={styles.button}
              type="button"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "🚚" : "🖨️"}
            </button>
          </>
        )}
      </div>

      <ul
        className={`${styles.grid} ${styles.progress}`}
        aria-label="In progress QR items"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "progress")}
        style={{ minHeight: "120px", listStyle: "none", padding: 0, margin: 0 }}
      >
        {inProgress.length === 0 && (
          <li style={{ opacity: 0.3, textAlign: "center", fontSize: "4rem" }}>🫳</li>
        )}
        {inProgress.map((row) => (
          <li key={row.id}>{renderRow(row, "progress")}</li>
        ))}
      </ul>

      <ul
        className={styles.grid}
        aria-label="Available QR items"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "main")}
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        {rows.map((row) => (
          <li key={row.id}>{renderRow(row, "main")}</li>
        ))}
      </ul>
    </div>
  );
}
