"use client";

import { Activity, useCallback, useMemo, useTransition } from "react";
import styles from "@/components/Qr/qr.module.css";
import useQRStore, { type DisplayState, type QRLogRow, type QRRow } from "@/components/Qr/store";
import { getNextDisplayState } from "@/lib/utils/displayState";
import { getQRCode } from "@/lib/utils/getQRCode";
import { svgStringToElement } from "@/lib/utils/svg";

export default function Qr() {
  const {
    input,
    rows,
    inProgress,
    displayStates,
    loading,
    showTextarea,
    log,
    setInput,
    setRows,
    setInProgress,
    setDisplayStates,
    setLoading,
    setShowTextarea,
    addInLog,
    addOutLog,
  } = useQRStore();

  const [isPending, startTransition] = useTransition();

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.door - a.door), [rows]);
  const sortedInProgress = useMemo(
    () => [...inProgress].sort((a, b) => b.door - a.door),
    [inProgress],
  );

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      const lines = input
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const generatedRows: QRRow[] = (
        await Promise.all(
          lines.map(async (line) => {
            const [value, label, doorStr] = line.split(/\s+/);
            const door = Number(doorStr);
            if (!value || !label || !doorStr || Number.isNaN(door)) return null;
            const svg = await getQRCode({ text: value });
            return { id: crypto.randomUUID(), value, label, door, svg };
          }),
        )
      ).filter((r): r is QRRow => r !== null);

      setRows(generatedRows);

      const initialStates = new Map<string, DisplayState>();
      for (const row of generatedRows) initialStates.set(row.id, "hide");
      setDisplayStates(initialStates);
      setLoading(false);
    });
  }, [input, setRows, setDisplayStates, setLoading]);

  const cycleDisplayState = useCallback(
    (row: QRRow) => {
      setDisplayStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(row.id) ?? "show";
        newMap.set(row.id, getNextDisplayState(current));
        return newMap;
      });
    },
    [setDisplayStates],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, row: QRRow, from: "main" | "progress") => {
      e.dataTransfer.setData("rowId", row.id);
      e.dataTransfer.setData("from", from);
      const dragPreview = document.createElement("div");
      dragPreview.style.cssText = "position: absolute; top: -1000px;";
      const qrContainer = document.createElement("div");
      qrContainer.innerHTML = row.svg;
      qrContainer.style.cssText = "width: 120px; height: 120px; margin-bottom: 8px;";
      dragPreview.appendChild(qrContainer);
      document.body.appendChild(dragPreview);
      e.dataTransfer.setDragImage(dragPreview, 60, 60);
      setTimeout(() => document.body.removeChild(dragPreview), 0);
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, to: "main" | "progress") => {
      e.preventDefault();
      const rowId = e.dataTransfer.getData("rowId");
      const from = e.dataTransfer.getData("from") as "main" | "progress";
      if (!rowId || from === to) return;

      let movedRow: QRRow | undefined;

      if (from === "main") {
        movedRow = rows.find((r) => r.id === rowId);
        if (!movedRow) return;
        setRows(rows.filter((r) => r.id !== rowId));
        setInProgress([...inProgress, movedRow]);
        addInLog(movedRow);
      } else {
        movedRow = inProgress.find((r) => r.id === rowId);
        if (!movedRow) return;
        setInProgress(inProgress.filter((r) => r.id !== rowId));
        setRows([...rows, movedRow]);
        addOutLog(movedRow);
      }

      if (movedRow && to === "progress") {
        setDisplayStates((prev) => {
          const newMap = new Map(prev);
          const current = newMap.get(movedRow.id) ?? "show";
          newMap.set(movedRow.id, current === "show" ? "hide" : "show");
          return newMap;
        });
      }
    },
    [rows, inProgress, setRows, setInProgress, setDisplayStates, addInLog, addOutLog],
  );

  const getQrOpacity = useCallback(
    (state: DisplayState) => (state === "hide" ? 0.3 : state === "qrOnly" ? 0.1 : 1),
    [],
  );
  const getTextOpacity = useCallback(
    (state: DisplayState) => (state === "qrOnly" ? 0 : state === "hide" ? 0.5 : 1),
    [],
  );

  const renderRow = useCallback(
    (row: QRRow, section: "main" | "progress") => {
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
          <div className={styles.door} style={{ opacity: textOpacity }}>
            {row.door}
          </div>
          <div className={styles.qr}>{svgElement}</div>
          <div className={styles.label} style={{ opacity: textOpacity }}>
            {row.label}
          </div>
          <div className={styles.value} style={{ opacity: textOpacity }}>
            {(row.value.startsWith("c") || row.value.startsWith("C")) && " 🚐"} {row.value}
          </div>
        </button>
      );
    },
    [displayStates, getQrOpacity, getTextOpacity, handleDragStart, cycleDisplayState],
  );
  const logOutput = useMemo(() => {
    return [
      "💰\t🏷️\t🚪\t🛬  \t🛫",
      ...[...log]
        .sort((a: QRLogRow, b: QRLogRow): number => b.door - a.door)
        .map((route) => {
          const inTime = route.inTime || "";
          const outTime = route.outTime || "";
          return `${route.value}\t${route.label}\t${route.door}\t${inTime}\t${outTime}`;
        }),
    ].join("\n");
  }, [log]);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button type="button" className={styles.button} onClick={() => setShowTextarea((p) => !p)}>
          {showTextarea ? "⊖" : "⊕"}
        </button>

        <Activity mode={showTextarea ? "visible" : "hidden"}>
          <textarea
            className={styles.textarea}
            placeholder={`XL19 F.1 83\nXL20 I.1 84\nXL21 C.2 85`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className={styles.button}
            onClick={handleGenerate}
            disabled={loading || isPending}
            type="button"
          >
            {loading || isPending ? "🚚" : "🖨️"}
          </button>
        </Activity>
      </div>

      <ul
        className={`${styles.grid} ${styles.progress}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "progress")}
      >
        {sortedInProgress.length === 0 && (
          <li style={{ opacity: 0.3, textAlign: "center", fontSize: "4rem" }}>🫳</li>
        )}
        {sortedInProgress.map((row) => (
          <li key={row.id}>{renderRow(row, "progress")}</li>
        ))}
      </ul>

      <ul
        className={styles.grid}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, "main")}
      >
        {sortedRows.map((row) => (
          <li key={row.id}>{renderRow(row, "main")}</li>
        ))}
      </ul>

      <div className={styles.log}>
        <textarea
          name="log"
          style={{ width: "100%", minHeight: "200px", fontFamily: "monospace" }}
          value={logOutput}
          readOnly
        />
      </div>
    </div>
  );
}
