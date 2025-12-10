"use client";

import { Activity, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import styles from "@/components/Qr/qr.module.css";
import useQRStore, { type DisplayState, type QRLogRow, type QRRow } from "@/components/Qr/store";
import { getNextDisplayState } from "@/lib/utils/displayState";
import { getQRCode } from "@/lib/utils/getQRCode";
import { parseRoutes } from "@/lib/utils/parseRoutes";
import { normalizeDspCode, normalizeRouteCode } from "@/lib/utils/routeKey";
import { svgStringToElement } from "@/lib/utils/svg";
import { WAVE_COLORS } from "@/lib/utils/waveColors";
import { waveToMinutes } from "@/lib/utils/waveToMinutes";

const FALLBACK_WAVE_COLOR = "oklch(0.92 0 0)";
const WAVE_COLOR_SCALE = [WAVE_COLORS[0], WAVE_COLORS[1], WAVE_COLORS[2]];

type ParsedInputRow = Omit<QRRow, "svg">;
type ParsedInputResult = { row: ParsedInputRow; qrText: string } | { error: string };

const ROUTE_FORMAT = "DSP route staging waveTime door";
const DIRECT_FORMAT = "value label door";
const WAVE_ALL = "__all__";
const WAVE_NONE = "__none__";

function formatLineError(lineNumber: number, message: string): string {
  return `Line ${lineNumber}: ${message}`;
}

function normalizeStaging(value: string): string {
  return value.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

function getWaveKey(rawWave: string): string {
  const trimmed = rawWave.trim();
  if (!trimmed) return WAVE_NONE;
  const minute = waveToMinutes(trimmed);
  if (Number.isFinite(minute)) return `min:${minute}`;
  return `raw:${trimmed.toLowerCase()}`;
}

function getRowWaveKey(row: QRRow): string {
  if (!row.waveTime?.trim()) return WAVE_NONE;
  return getWaveKey(row.waveTime);
}

function filterRowsByWave(rows: QRRow[], activeWave: string): QRRow[] {
  if (activeWave === WAVE_ALL) return rows;
  return rows.filter((row) => getRowWaveKey(row) === activeWave);
}

function parseQrInputLine(line: string, lineNumber: number): ParsedInputResult {
  const tokens = line.trim().split(/\s+/);
  if (!tokens.length) {
    return { error: formatLineError(lineNumber, `Expected ${DIRECT_FORMAT} or ${ROUTE_FORMAT}.`) };
  }

  if (tokens.length === 3) {
    const [value, label, doorToken] = tokens;
    const door = Number(doorToken);
    const missing: string[] = [];
    if (!value) missing.push("value");
    if (!label) missing.push("label");
    if (!doorToken || Number.isNaN(door)) missing.push("door");
    if (missing.length) {
      return { error: formatLineError(lineNumber, `Missing ${missing.join(", ")}.`) };
    }
    return {
      row: {
        id: crypto.randomUUID(),
        value,
        label,
        door,
      },
      qrText: value,
    };
  }

  if (tokens.length < 5) {
    return { error: formatLineError(lineNumber, `Expected ${ROUTE_FORMAT}.`) };
  }

  const doorToken = tokens[tokens.length - 1] ?? "";
  const door = Number(doorToken);
  const routeText = tokens.slice(0, -1).join(" ");
  const [parsed] = parseRoutes(routeText);
  if (!parsed) {
    return { error: formatLineError(lineNumber, `Expected ${ROUTE_FORMAT}.`) };
  }

  const routeCode = normalizeRouteCode(parsed.route);
  const dspCode = normalizeDspCode(parsed.dsp);
  const staging = normalizeStaging(parsed.staging);
  const waveTime = parsed.waveTime.trim();

  const missing: string[] = [];
  if (!dspCode) missing.push("DSP");
  if (!routeCode) missing.push("route");
  if (!staging) missing.push("staging");
  if (!waveTime) missing.push("waveTime");
  if (!doorToken || Number.isNaN(door)) missing.push("door");

  if (missing.length) {
    return { error: formatLineError(lineNumber, `Missing ${missing.join(", ")}.`) };
  }

  return {
    row: {
      id: crypto.randomUUID(),
      value: routeCode,
      label: staging,
      door,
      waveTime,
    },
    qrText: routeCode,
  };
}

export default function Qr() {
  const {
    input,
    rows,
    inProgress,
    displayStates,
    loading,
    showTextarea,
    log,
    recentDepartureIds,
    setInput,
    setRows,
    setInProgress,
    setDisplayStates,
    setLoading,
    setShowTextarea,
    addInLog,
    addOutLog,
    bumpRecentDeparture,
    removeRecentDeparture,
    clearRecentDepartures,
  } = useQRStore();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeWave, setActiveWave] = useState(WAVE_ALL);

  const waveTabs = useMemo(() => {
    const waves = new Map<
      string,
      {
        label: string;
        count: number;
        minute: number | null;
      }
    >();
    let noWaveCount = 0;

    const addWave = (waveTime?: string) => {
      const trimmed = waveTime?.trim() ?? "";
      if (!trimmed) {
        noWaveCount += 1;
        return;
      }
      const minute = waveToMinutes(trimmed);
      const key = getWaveKey(trimmed);
      const existing = waves.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }
      waves.set(key, {
        label: trimmed,
        count: 1,
        minute: Number.isFinite(minute) ? minute : null,
      });
    };

    for (const row of rows) {
      addWave(row.waveTime);
    }

    const sortedWaves = Array.from(waves.entries()).sort(([, a], [, b]) => {
      if (a.minute !== null && b.minute !== null) return a.minute - b.minute;
      if (a.minute !== null) return -1;
      if (b.minute !== null) return 1;
      return a.label.localeCompare(b.label);
    });

    const tabs = [
      { key: WAVE_ALL, label: "All", count: rows.length },
      ...sortedWaves.map(([key, value]) => ({
        key,
        label: value.label,
        count: value.count,
      })),
    ];

    if (noWaveCount > 0) {
      tabs.push({ key: WAVE_NONE, label: "No wave", count: noWaveCount });
    }

    return tabs;
  }, [rows]);

  useEffect(() => {
    if (waveTabs.some((tab) => tab.key === activeWave)) return;
    setActiveWave(WAVE_ALL);
  }, [activeWave, waveTabs]);

  const filteredRows = useMemo(() => filterRowsByWave(rows, activeWave), [rows, activeWave]);
  const sortedRows = useMemo(
    () => [...filteredRows].sort((a, b) => b.door - a.door),
    [filteredRows],
  );
  const sortedInProgress = useMemo(
    () => [...inProgress].sort((a, b) => b.door - a.door),
    [inProgress],
  );
  const recentDepartures = useMemo(() => {
    if (!recentDepartureIds.length) return [];
    const byId = new Map([...rows, ...inProgress].map((row) => [row.id, row]));
    return recentDepartureIds
      .map((rowId) => byId.get(rowId))
      .filter((row): row is QRRow => Boolean(row));
  }, [rows, inProgress, recentDepartureIds]);

  const waveGroupByMinute = useMemo(() => {
    const minutes = new Set<number>();
    for (const row of [...rows, ...inProgress]) {
      if (!row.waveTime) continue;
      const minute = waveToMinutes(row.waveTime);
      if (Number.isFinite(minute)) minutes.add(minute);
    }
    const sorted = Array.from(minutes).sort((a, b) => a - b);
    return new Map(sorted.map((minute, index) => [minute, index]));
  }, [rows, inProgress]);

  const getWaveTabStyle = useCallback(
    (tabKey: string): React.CSSProperties => {
      if (tabKey === WAVE_ALL) return {};
      let color = FALLBACK_WAVE_COLOR;
      if (tabKey.startsWith("min:")) {
        const minute = Number(tabKey.slice(4));
        const index = Number.isFinite(minute) ? waveGroupByMinute.get(minute) : undefined;
        if (index !== undefined) color = WAVE_COLOR_SCALE[index] ?? FALLBACK_WAVE_COLOR;
      }
      return { "--wave-tab-color": color } as React.CSSProperties;
    },
    [waveGroupByMinute],
  );

  const getWaveColor = useCallback(
    (row: QRRow) => {
      if (!row.waveTime) return FALLBACK_WAVE_COLOR;
      const minute = waveToMinutes(row.waveTime);
      if (!Number.isFinite(minute)) return FALLBACK_WAVE_COLOR;
      const index = waveGroupByMinute.get(minute);
      if (index === undefined) return FALLBACK_WAVE_COLOR;
      return WAVE_COLOR_SCALE[index] ?? FALLBACK_WAVE_COLOR;
    },
    [waveGroupByMinute],
  );

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      setError(null);
      const lines = input
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const errors: string[] = [];
      const parsedRows: Array<{ row: ParsedInputRow; qrText: string }> = [];

      lines.forEach((line, index) => {
        const result = parseQrInputLine(line, index + 1);
        if ("error" in result) {
          errors.push(result.error);
          return;
        }
        parsedRows.push(result);
      });

      if (errors.length) {
        setError(errors.join("\n"));
        setLoading(false);
        return;
      }

      const generatedRows: QRRow[] = await Promise.all(
        parsedRows.map(async ({ row, qrText }) => {
          const svg = await getQRCode({ text: qrText });
          return { ...row, svg };
        }),
      );

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
        removeRecentDeparture(movedRow.id);
      } else {
        movedRow = inProgress.find((r) => r.id === rowId);
        if (!movedRow) return;
        setInProgress(inProgress.filter((r) => r.id !== rowId));
        setRows([...rows, movedRow]);
        addOutLog(movedRow);
        bumpRecentDeparture(movedRow.id);
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
    [
      rows,
      inProgress,
      setRows,
      setInProgress,
      setDisplayStates,
      addInLog,
      addOutLog,
      bumpRecentDeparture,
      removeRecentDeparture,
    ],
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
      const backgroundColor = getWaveColor(row);

      return (
        <button
          key={`${row.id}-${section}`}
          type="button"
          className={styles.item}
          draggable
          onDragStart={(e) => handleDragStart(e, row, section)}
          onClick={() => cycleDisplayState(row)}
          style={{
            opacity: qrOpacity,
            transition: "opacity 0.3s ease, background-color 0.2s ease",
            backgroundColor,
            borderRadius: "0.75rem",
            padding: "0.75rem 0.5rem",
          }}
        >
          <div className={styles.info}>
            <div className={styles.label} style={{ opacity: textOpacity }}>
              {row.label}
            </div>
            <div className={styles.door} style={{ opacity: textOpacity }}>
              {row.door}
            </div>
            <div className={styles.value} style={{ opacity: textOpacity }}>
              {(row.value.startsWith("c") || row.value.startsWith("C")) && " 🚐"} {row.value}
            </div>
          </div>
          <div className={styles.qr}>{svgElement}</div>
        </button>
      );
    },
    [displayStates, getQrOpacity, getTextOpacity, getWaveColor, handleDragStart, cycleDisplayState],
  );
  const filteredLog = useMemo(() => {
    if (activeWave === WAVE_ALL) return log;
    if (activeWave === WAVE_NONE) {
      return log.filter((row) => !row.waveTime?.trim());
    }
    return log.filter((row) => getWaveKey(row.waveTime ?? "") === activeWave);
  }, [activeWave, log]);

  const logOutput = useMemo(() => {
    return [
      "💰\t🏷️\t🚪\t🛬  \t🛫",
      ...[...filteredLog]
        .sort((a: QRLogRow, b: QRLogRow): number => b.door - a.door)
        .map((route) => {
          const inTime = route.inTime || "";
          const outTime = route.outTime || "";
          return `${route.value}\t${route.label}\t${route.door}\t${inTime}\t${outTime}`;
        }),
    ].join("\n");
  }, [filteredLog]);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button type="button" className={styles.button} onClick={() => setShowTextarea((p) => !p)}>
          {showTextarea ? "⊖" : "⊕"}
        </button>

        <Activity mode={showTextarea ? "visible" : "hidden"}>
          <textarea
            className={styles.textarea}
            placeholder={"GALX\tCP39\tC.2\t09:30 AM\t88"}
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
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
      </div>
      {waveTabs.length > 1 && (
        <fieldset className={styles.waveTabs}>
          <legend className={styles.waveTabsLegend}>Wave filter</legend>
          {waveTabs.map((tab) => {
            const isActive = tab.key === activeWave;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={isActive}
                className={`${styles.waveTab} ${isActive ? styles.waveTabActive : ""}`}
                onClick={() => setActiveWave(tab.key)}
                style={getWaveTabStyle(tab.key)}
              >
                <span className={styles.waveTabLabel}>{tab.label}</span>
                <span className={styles.waveTabCount}>{tab.count}</span>
              </button>
            );
          })}
        </fieldset>
      )}
      {recentDepartures.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>🛫</div>
            <button
              type="button"
              className={styles.sectionAction}
              onClick={() => clearRecentDepartures()}
            >
              🧹
            </button>
          </div>
          <ul className={`${styles.grid} ${styles.recentGrid}`}>
            {recentDepartures.map((row) => (
              <li key={`recent-${row.id}`}>{renderRow(row, "main")}</li>
            ))}
          </ul>
        </div>
      )}

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
