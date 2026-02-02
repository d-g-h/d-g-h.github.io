"use client";

import {
  Activity,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import styles from "@/components/Qr/qr.module.css";
import useQRStore, { type DisplayState, type QRLogRow, type QRRow } from "@/components/Qr/store";
import { getNextDisplayState } from "@/lib/utils/displayState";
import { getQRCode } from "@/lib/utils/getQRCode";
import { normalizeDspCode, normalizeRouteCode } from "@/lib/utils/routeKey";
import { svgStringToElement } from "@/lib/utils/svg";
import { WAVE_COLORS } from "@/lib/utils/waveColors";
import { waveToMinutes } from "@/lib/utils/waveToMinutes";

const FALLBACK_WAVE_COLOR = "oklch(0.92 0 0)";
const WAVE_COLOR_SCALE = [WAVE_COLORS[0], WAVE_COLORS[1], WAVE_COLORS[2]];

type ParsedInputRow = Omit<QRRow, "svg" | "id">;
type ParsedInputResult = { row: ParsedInputRow; qrText: string } | { error: string };

const ROUTE_FORMAT = "DSP route staging waveTime";
const DIRECT_FORMAT = "value label";
const WAVE_ALL = "__all__";
const WAVE_NONE = "__none__";
type LogField = "dsp" | "value" | "waveTime" | "label" | "door" | "inTime" | "outTime";
const LOG_FIELD_LABELS: Record<LogField, string> = {
  dsp: "DSP",
  value: "Route",
  waveTime: "Wave",
  label: "Staging",
  door: "Door",
  inTime: "In",
  outTime: "Out",
};

function formatLineError(lineNumber: number, message: string): string {
  return `Line ${lineNumber}: ${message}`;
}

function normalizeStaging(value: string): string {
  return value.replace(/[^A-Za-z0-9.]/g, "").toUpperCase();
}

function normalizeEditableValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

  if (tokens.length === 2) {
    const [value, label] = tokens;
    const missing: string[] = [];
    if (!value) missing.push("value");
    if (!label) missing.push("label");
    if (missing.length) {
      return { error: formatLineError(lineNumber, `Missing ${missing.join(", ")}.`) };
    }
    return {
      row: {
        value,
        label,
      },
      qrText: value,
    };
  }

  if (tokens.length < 3) {
    return { error: formatLineError(lineNumber, `Expected ${ROUTE_FORMAT}.`) };
  }

  const dspCode = normalizeDspCode(tokens[0]);
  const routeCode = normalizeRouteCode(tokens[1]);

  const door = Number(tokens[tokens.length - 1]);

  const timeEndToken = tokens[tokens.length - 2]?.toLowerCase();
  const hasAmPm = timeEndToken === "am" || timeEndToken === "pm";

  const minTokensWithoutStaging = hasAmPm ? 5 : 4;
  const hasStaging = tokens.length > minTokensWithoutStaging;

  let waveTime: string;
  let staging: string;

  if (hasAmPm) {
    waveTime = `${tokens[tokens.length - 3]} ${tokens[tokens.length - 2]}`;
    staging = hasStaging ? normalizeStaging(tokens[2]) : "";
  } else {
    waveTime = tokens[tokens.length - 2];
    staging = hasStaging ? normalizeStaging(tokens[2]) : "";
  }

  const missing: string[] = [];
  if (!dspCode) missing.push("DSP");
  if (!routeCode) missing.push("route");
  if (!waveTime) missing.push("waveTime");
  if (Number.isNaN(door) || door <= 0) missing.push("door");

  if (missing.length) {
    return { error: formatLineError(lineNumber, `Missing ${missing.join(", ")}.`) };
  }

  return {
    row: {
      dsp: dspCode,
      value: routeCode,
      label: staging,
      waveTime,
      door,
    },
    qrText: routeCode,
  };
}

export default function Qr() {
  const {
    input,
    doorsInput,
    doors,
    doorAssignments,
    rows,
    inProgress,
    displayStates,
    loading,
    showTextarea,
    log,
    recentDepartureIds,
    setInput,
    setDoorsInput,
    setDoors,
    assignRowToDoor,
    setRows,
    setInProgress,
    setDisplayStates,
    setLoading,
    setShowTextarea,
    addInLog,
    addOutLog,
    updateLogRow,
    removeLogRow,
    bumpRecentDeparture,
    clearRecentDepartures,
    stagingOrder,
    setStagingOrder,
  } = useQRStore();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeWave, setActiveWave] = useState(WAVE_ALL);
  const [doorFilter, setDoorFilter] = useState<"all" | "empty" | "full">("all");
  const [isCopied, setIsCopied] = useState(false);
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<number | null>(null);

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

  useEffect(
    () => () => {
      if (deleteTimeoutRef.current !== null) {
        window.clearTimeout(deleteTimeoutRef.current);
      }
    },
    [],
  );

  const filteredRows = useMemo(() => filterRowsByWave(rows, activeWave), [rows, activeWave]);
  const sortedRows = useMemo(() => filteredRows, [filteredRows]);
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
      const existingRows = [...rows, ...inProgress];
      const existingByValue = new Map<string, QRRow>();
      const existingLogByValue = new Map<string, QRLogRow>();
      const inProgressIds = new Set(inProgress.map((row) => row.id));
      const logIds = new Set(log.map((row) => row.id));

      for (const row of existingRows) {
        existingByValue.set(row.value, row);
      }

      for (const row of log) {
        if (!existingByValue.has(row.value)) existingLogByValue.set(row.value, row);
      }

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

      const prepared = parsedRows.map(({ row, qrText }) => {
        const existing = existingByValue.get(row.value);
        const fallbackLog = existing ? undefined : existingLogByValue.get(row.value);
        return {
          row,
          qrText,
          id: existing?.id ?? fallbackLog?.id ?? crypto.randomUUID(),
          svg: existing?.svg,
        };
      });

      const rowsNeedingSvg = prepared.filter((entry) => !entry.svg);
      const generatedSvgs = await Promise.all(
        rowsNeedingSvg.map((entry) => getQRCode({ text: entry.qrText, width: 50 })),
      );

      let svgIndex = 0;
      const updatedRows: QRRow[] = prepared.map((entry) => {
        const svg = entry.svg ?? generatedSvgs[svgIndex++];
        return { ...entry.row, id: entry.id, svg };
      });

      const updatedById = new Map(updatedRows.map((row) => [row.id, row]));
      const nextInProgress = inProgress.map((row) => updatedById.get(row.id) ?? row);
      const nextRows = updatedRows.filter((row) => !inProgressIds.has(row.id));
      const nextDisplayStates = new Map(displayStates);
      const activeIds = new Set([...nextRows, ...nextInProgress].map((row) => row.id));

      for (const id of nextDisplayStates.keys()) {
        if (!activeIds.has(id)) nextDisplayStates.delete(id);
      }

      for (const row of [...nextRows, ...nextInProgress]) {
        if (!nextDisplayStates.has(row.id)) nextDisplayStates.set(row.id, "hide");
      }

      for (const row of updatedRows) {
        if (!logIds.has(row.id)) continue;
        updateLogRow(row.id, {
          dsp: row.dsp,
          value: row.value,
          waveTime: row.waveTime,
          label: row.label,
          door: row.door,
        });
      }

      setRows(nextRows);
      setInProgress(nextInProgress);
      setStagingOrder(updatedRows.map((row) => row.id));
      setDisplayStates(nextDisplayStates);
      setLoading(false);
    });
  }, [
    displayStates,
    input,
    inProgress,
    log,
    rows,
    setDisplayStates,
    setInProgress,
    setLoading,
    setRows,
    setStagingOrder,
    updateLogRow,
  ]);

  const handleParseDoors = useCallback(() => {
    const doorNumbers = doorsInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n > 0);
    const uniqueDoorNumbers = new Set(doorNumbers);
    setDoors([...uniqueDoorNumbers]);
  }, [doorsInput, setDoors]);

  const allRowsById = useMemo(() => {
    const map = new Map<string, QRRow>();
    for (const row of [...rows, ...inProgress]) {
      map.set(row.id, row);
    }
    return map;
  }, [rows, inProgress]);

  const filteredDoors = useMemo(() => {
    if (doorFilter === "all") return doors;
    return doors.filter((door) => {
      const hasAssignment = doorAssignments.has(door);
      return doorFilter === "empty" ? !hasAssignment : hasAssignment;
    });
  }, [doors, doorAssignments, doorFilter]);

  const handleDropOnDoor = useCallback(
    (e: React.DragEvent, door: number) => {
      e.preventDefault();
      const rowId = e.dataTransfer.getData("rowId");
      const from = e.dataTransfer.getData("from");
      if (!rowId) return;

      const row = allRowsById.get(rowId);
      if (row) {
        const rowWithDoor = { ...row, door };
        addInLog(rowWithDoor);
      }

      assignRowToDoor(door, rowId);

      if (from === "main" && row) {
        setRows(rows.filter((r) => r.id !== rowId));
        setInProgress([...inProgress, row]);
      }
    },
    [assignRowToDoor, allRowsById, addInLog, rows, inProgress, setRows, setInProgress],
  );

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
      qrContainer.style.cssText = "width: 60px; height: 60px; margin-bottom: 8px;";
      dragPreview.appendChild(qrContainer);
      document.body.appendChild(dragPreview);
      e.dataTransfer.setDragImage(dragPreview, 60, 60);
      setTimeout(() => document.body.removeChild(dragPreview), 0);
    },
    [],
  );

  const getDoorForRow = useCallback(
    (rowId: string): number | undefined => {
      for (const [door, id] of doorAssignments.entries()) {
        if (id === rowId) return door;
      }
      return undefined;
    },
    [doorAssignments],
  );

  const departureFromDoor = useCallback(
    (rowId: string) => {
      const row = allRowsById.get(rowId);
      if (!row) return;

      const door = getDoorForRow(rowId);
      if (door !== undefined) {
        const rowWithDoor = { ...row, door };
        addOutLog(rowWithDoor);
        assignRowToDoor(door, null);
        bumpRecentDeparture(rowId);
      }

      setInProgress(inProgress.filter((r) => r.id !== rowId));
      setRows([...rows, row]);
    },
    [
      allRowsById,
      getDoorForRow,
      addOutLog,
      assignRowToDoor,
      bumpRecentDeparture,
      inProgress,
      rows,
      setInProgress,
      setRows,
    ],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, to: "main") => {
      e.preventDefault();
      const rowId = e.dataTransfer.getData("rowId");
      const from = e.dataTransfer.getData("from") as "main" | "door";
      if (!rowId || from === to) return;

      if (from === "door") {
        departureFromDoor(rowId);
      }
    },
    [departureFromDoor],
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
            padding: "0.75rem 0.5rem",
          }}
        >
          <div className={styles.info}>
            <div className={styles.value} style={{ opacity: textOpacity }}>
              {row.value.toLowerCase().startsWith("c") && " 🚐"} {row.value}
            </div>
            <div className={styles.label} style={{ opacity: textOpacity }}>
              {row.label}
            </div>
            {row.door !== undefined && (
              <div className={styles.door} style={{ opacity: textOpacity }}>
                {row.door}
              </div>
            )}
          </div>
          <div className={styles.qr}>{svgElement}</div>
        </button>
      );
    },
    [displayStates, getQrOpacity, getTextOpacity, getWaveColor, handleDragStart, cycleDisplayState],
  );
  const filteredLog = useMemo(() => {
    const orderIndex = new Map(stagingOrder.map((id, idx) => [id, idx]));
    const sortByOrder = (a: (typeof log)[number], b: (typeof log)[number]) => {
      const aIdx = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIdx = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    };
    if (activeWave === WAVE_ALL) return [...log].sort(sortByOrder);
    if (activeWave === WAVE_NONE) {
      return log.filter((row) => !row.waveTime?.trim()).sort(sortByOrder);
    }
    return log.filter((row) => getWaveKey(row.waveTime ?? "") === activeWave).sort(sortByOrder);
  }, [activeWave, log, stagingOrder]);

  const commitLogUpdate = useCallback(
    (row: QRLogRow, field: LogField, rawValue: string) => {
      const normalized = normalizeEditableValue(rawValue);
      if (field === "door") {
        const parsed = normalized ? Number(normalized) : undefined;
        const nextDoor = Number.isFinite(parsed) ? parsed : undefined;
        if (nextDoor === row.door) return;
        updateLogRow(row.id, { door: nextDoor });
        return;
      }

      const currentValue =
        field === "dsp"
          ? (row.dsp ?? "")
          : field === "waveTime"
            ? (row.waveTime ?? "")
            : field === "inTime"
              ? (row.inTime ?? "")
              : field === "outTime"
                ? (row.outTime ?? "")
                : field === "label"
                  ? row.label
                  : row.value;

      const nextValue =
        field === "label" || field === "value" ? normalized : normalized ? normalized : undefined;

      if ((nextValue ?? "") === currentValue) return;

      updateLogRow(row.id, { [field]: nextValue } as Partial<QRLogRow>);
    },
    [updateLogRow],
  );

  const handleLogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, fallbackValue: string) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.currentTarget.textContent = fallbackValue;
        event.currentTarget.blur();
      }
    },
    [],
  );

  const handleCopy = useCallback(() => {
    const logHeaders = ["DSP", "Route", "Wave", "Staging", "Door", "In", "Out"];
    const logRows = filteredLog.map((route) =>
      [
        route.dsp ?? "",
        route.value,
        route.waveTime ?? "",
        route.label,
        route.door ?? "",
        route.inTime ?? "",
        route.outTime ?? "",
      ].join("\t"),
    );
    const logString = [logHeaders.join("\t"), ...logRows].join("\n");

    navigator.clipboard.writeText(logString).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [filteredLog]);

  const clearDeleteTimer = useCallback(() => {
    if (deleteTimeoutRef.current !== null) {
      window.clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
  }, []);

  const armDelete = useCallback(
    (rowId: string) => {
      clearDeleteTimer();
      setDeleteArmedId(rowId);
      deleteTimeoutRef.current = window.setTimeout(() => {
        setDeleteArmedId((current) => (current === rowId ? null : current));
      }, 2000);
    },
    [clearDeleteTimer],
  );

  const handleDeleteClick = useCallback(
    (rowId: string) => {
      if (deleteArmedId === rowId) {
        clearDeleteTimer();
        removeLogRow(rowId);
        setDeleteArmedId(null);
        return;
      }
      armDelete(rowId);
    },
    [armDelete, clearDeleteTimer, deleteArmedId, removeLogRow],
  );

  const renderEditableCell = useCallback(
    (row: QRLogRow, field: LogField, value: string) => (
      // biome-ignore lint/a11y/useSemanticElements: contentEditable cell is intentional.
      <div
        className={`${styles.logCell} ${styles.logCellEditable}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        tabIndex={0}
        aria-label={`${LOG_FIELD_LABELS[field]} log entry`}
        onBlur={(event) => commitLogUpdate(row, field, event.currentTarget.textContent ?? "")}
        onKeyDown={(event) => handleLogKeyDown(event, value)}
      >
        {value}
      </div>
    ),
    [commitLogUpdate, handleLogKeyDown],
  );

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button type="button" className={styles.button} onClick={() => setShowTextarea((p) => !p)}>
          {showTextarea ? "⊖" : "⊕"}
        </button>

        <Activity mode={showTextarea ? "visible" : "hidden"}>
          <textarea
            className={styles.textarea}
            placeholder={"GALX\tCP39\tC.2\t09:30 AM\t100"}
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
          <textarea
            className={styles.textarea}
            placeholder={"123    122    121    120    119"}
            value={doorsInput}
            onChange={(e) => setDoorsInput(e.target.value)}
            style={{ height: "3rem" }}
          />
          <button className={styles.button} onClick={handleParseDoors} type="button">
            🚪
          </button>
        </Activity>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
      </div>
      {(waveTabs.length > 1 || doors.length > 0) && (
        <fieldset className={styles.waveTabs}>
          <legend className={styles.waveTabsLegend}>Filters</legend>
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
          {doors.length > 0 && (
            <div className={styles.doorFilterGroup}>
              <button
                type="button"
                aria-pressed={doorFilter === "empty"}
                className={`${styles.waveTab} ${doorFilter === "empty" ? styles.waveTabActive : ""}`}
                onClick={() => setDoorFilter(doorFilter === "empty" ? "all" : "empty")}
              >
                🟢
              </button>
              <button
                type="button"
                aria-pressed={doorFilter === "full"}
                className={`${styles.waveTab} ${doorFilter === "full" ? styles.waveTabActive : ""}`}
                onClick={() => setDoorFilter(doorFilter === "full" ? "all" : "full")}
              >
                🔴
              </button>
            </div>
          )}
        </fieldset>
      )}
      {doors.length > 0 && (
        <div className={styles.doorSlots}>
          {filteredDoors.map((door) => {
            const assignedRowId = doorAssignments.get(door);
            const assignedRow = assignedRowId ? allRowsById.get(assignedRowId) : undefined;
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: drop zone for drag-and-drop
              <div
                key={door}
                className={styles.doorSlot}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnDoor(e, door)}
              >
                <div
                  className={styles.doorSlotHeader}
                  style={{ color: assignedRow ? "oklch(0.55 0.2 25)" : "oklch(0.5 0.2 145)" }}
                >
                  {door}
                </div>
                {assignedRow ? (
                  (() => {
                    const state = displayStates.get(assignedRow.id) ?? "show";
                    const qrOpacity = getQrOpacity(state);
                    const textOpacity = getTextOpacity(state);
                    return (
                      <button
                        type="button"
                        className={styles.doorSlotContent}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("rowId", assignedRow.id);
                          e.dataTransfer.setData("from", "door");
                        }}
                        onClick={() => cycleDisplayState(assignedRow)}
                        style={{ backgroundColor: getWaveColor(assignedRow), opacity: qrOpacity }}
                      >
                        <div className={styles.doorSlotLabel} style={{ opacity: textOpacity }}>
                          {assignedRow.label}
                        </div>
                        <div className={styles.doorSlotValue} style={{ opacity: textOpacity }}>
                          {assignedRow.value}
                        </div>
                        <div className={styles.doorSlotValue} style={{ opacity: textOpacity }}>
                          {assignedRow.door}
                        </div>
                        <div className={styles.doorSlotQr}>
                          {svgStringToElement(assignedRow.svg)}
                        </div>
                      </button>
                    );
                  })()
                ) : (
                  <div className={styles.doorSlotEmpty}>🫳</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {recentDepartures.length > 0 && (
        // biome-ignore lint/a11y/noStaticElementInteractions: drop zone for drag-and-drop
        <div
          className={styles.recentDepartures}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const rowId = e.dataTransfer.getData("rowId");
            const from = e.dataTransfer.getData("from");
            if (rowId && from === "door") {
              departureFromDoor(rowId);
            }
          }}
        >
          <button type="button" className={styles.button} onClick={() => clearRecentDepartures()}>
            🛫🧹
          </button>
          <ul className={`${styles.grid} ${styles.recentGrid}`}>
            {recentDepartures.map((row) => (
              <li key={`recent-${row.id}`}>{renderRow(row, "main")}</li>
            ))}
          </ul>
        </div>
      )}

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
        <button type="button" className={styles.button} onClick={handleCopy}>
          {isCopied ? "Copied!" : "⧉ "}
        </button>
        <div className={styles.logTable}>
          <div className={styles.logHeader}>DSP</div>
          <div className={styles.logHeader}>Route</div>
          <div className={styles.logHeader}>Wave</div>
          <div className={styles.logHeader}>Staging</div>
          <div className={styles.logHeader}>Door</div>
          <div className={styles.logHeader}>In</div>
          <div className={styles.logHeader}>Out</div>
          <div className={styles.logHeader}>Del</div>

          {filteredLog.map((route) => (
            <Fragment key={route.id}>
              {renderEditableCell(route, "dsp", route.dsp ?? "")}
              {renderEditableCell(route, "value", route.value)}
              {renderEditableCell(route, "waveTime", route.waveTime ?? "")}
              {renderEditableCell(route, "label", route.label)}
              {renderEditableCell(route, "door", route.door?.toString() ?? "")}
              {renderEditableCell(route, "inTime", route.inTime ?? "")}
              {renderEditableCell(route, "outTime", route.outTime ?? "")}
              <button
                type="button"
                className={`${styles.logDelete} ${
                  deleteArmedId === route.id ? styles.logDeleteArmed : ""
                }`}
                onClick={() => handleDeleteClick(route.id)}
                onDoubleClick={() => {
                  clearDeleteTimer();
                  removeLogRow(route.id);
                  setDeleteArmedId(null);
                }}
                aria-label={`Delete log for ${route.value}`}
                title={deleteArmedId === route.id ? "Click again to delete" : "Click to arm delete"}
              >
                🗑️
              </button>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
