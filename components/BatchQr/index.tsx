"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/BatchQr/batchQr.module.css";
import { MAX_TBA_COUNT, parseBatchTbas } from "@/lib/utils/batchTbas";
import { getQRCode } from "@/lib/utils/getQRCode";
import { svgStringToElement } from "@/lib/utils/svg";

const STORAGE_KEY = "batch-tba-qr-state";
const INPUT_ID = "batch-tba-input";
const ERROR_ID = "batch-tba-error";

type BatchQrItem = {
  id: string;
  tba: string;
  svg: string;
  completed: boolean;
};

type ProgressFilter = "all" | "open" | "completed";

type StoredBatchState = {
  input: string;
  items: BatchQrItem[];
  filter: ProgressFilter;
  showTextarea: boolean;
};

const createId = (value: string) =>
  `${value.toUpperCase()}::${Date.now().toString(36)}::${crypto.randomUUID()}`;

function readStoredState(): StoredBatchState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBatchState;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch (error) {
    console.warn("Failed to read batch QR state", error);
    return null;
  }
}

export default function BatchQr() {
  const gridRef = useRef<HTMLElement | null>(null);
  const [input, setInput] = useState("");
  const [items, setItems] = useState<BatchQrItem[]>([]);
  const [filter, setFilter] = useState<ProgressFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTextarea, setShowTextarea] = useState(true);

  useEffect(() => {
    const stored = readStoredState();
    if (stored) {
      setInput(stored.input ?? "");
      setItems(stored.items);
      setFilter(
        stored.filter === "open" || stored.filter === "completed" || stored.filter === "all"
          ? stored.filter
          : "all",
      );
      setShowTextarea(stored.showTextarea ?? true);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          items,
          filter,
          showTextarea,
        } satisfies StoredBatchState),
      );
    } catch (error) {
      console.warn("Failed to persist batch QR state", error);
    }
  }, [filter, input, isHydrated, items, showTextarea]);

  const completedCount = items.filter((item) => item.completed).length;
  const openCount = items.filter((item) => !item.completed).length;

  const filteredItems = items.filter((item) => {
    if (filter === "open") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const parsed = parseBatchTbas(input);
      if (parsed.errors.length) {
        setError(parsed.errors.join("\n"));
        return;
      }

      setError(null);
      const existingByValue = new Map(items.map((item) => [item.tba.toUpperCase(), item]));
      const generated = await Promise.all(
        parsed.values.map(async (tba) => {
          const existing = existingByValue.get(tba.toUpperCase());
          if (existing) return { ...existing, tba };

          return {
            id: createId(tba),
            tba,
            svg: await getQRCode({ text: tba, width: 108, margin: 1 }),
            completed: false,
          };
        }),
      );

      setItems(generated);
      setFilter("all");
    } catch (error) {
      console.error("Failed to generate batch QR codes", error);
      setError("Failed to generate QR codes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetProgress = () => {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        completed: false,
      })),
    );
  };

  const getViewportRowIds = (itemId: string) => {
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>("[data-batch-id]") ?? [],
    );
    const selected = buttons.find((button) => button.dataset.batchId === itemId);
    if (!selected) return [itemId];

    const selectedTop = selected.getBoundingClientRect().top;
    return buttons
      .filter((button) => Math.abs(button.getBoundingClientRect().top - selectedTop) < 4)
      .map((button) => button.dataset.batchId)
      .filter((id): id is string => Boolean(id));
  };

  const toggleViewportRow = (item: BatchQrItem) => {
    const next = { completed: !item.completed };
    const rowIds = new Set(getViewportRowIds(item.id));

    setItems((current) =>
      current.map((currentItem) =>
        rowIds.has(currentItem.id) ? { ...currentItem, ...next } : currentItem,
      ),
    );
  };

  return (
    <main className={styles.shell}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>📦📱✅</p>
          <h1 className={styles.title}>▦</h1>
          <p className={styles.hint}>≤ {MAX_TBA_COUNT} • 📱 → ✅</p>
        </header>

        <section className={styles.controls} aria-label="Generate batch TBA QR codes">
          <button
            type="button"
            className={styles.button}
            onClick={() => setShowTextarea((current) => !current)}
            aria-label={showTextarea ? "Hide TBA input" : "Show TBA input"}
          >
            {showTextarea ? "⊖" : "⊕"}
          </button>

          {showTextarea && (
            <>
              <label className={styles.visuallyHidden} htmlFor={INPUT_ID}>
                TBA list
              </label>
              <textarea
                id={INPUT_ID}
                className={styles.textarea}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={"TBA123456789000\nTBA123456789001\nTBA123456789002"}
                spellCheck={false}
                aria-describedby={error ? ERROR_ID : undefined}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  aria-label="Generate QR batch"
                >
                  {isGenerating ? "⏳" : "🖨️"}
                </button>
                <span className={styles.counter}>
                  {input.split(/\r?\n/).filter((line) => line.trim()).length}/{MAX_TBA_COUNT}
                </span>
              </div>
              {error && (
                <div id={ERROR_ID} className={styles.error} role="alert">
                  {error}
                </div>
              )}
            </>
          )}
        </section>

        {items.length > 0 && (
          <>
            <section className={styles.summary} aria-label="Batch progress">
              <strong>{completedCount}</strong>
              <span>✅</span>
              <strong>{openCount}</strong>
              <span>⭕</span>
              <strong>{items.length}</strong>
              <span>∑</span>
            </section>

            <section className={styles.filters} aria-label="Progress filters">
              {(
                [
                  ["all", "∑"],
                  ["open", "⭕"],
                  ["completed", "✅"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Show ${value}`}
                  className={`${styles.filterButton} ${
                    filter === value ? styles.filterButtonActive : ""
                  }`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={styles.smallButton}
                onClick={resetProgress}
                aria-label="Reset progress"
              >
                ↺
              </button>
            </section>
          </>
        )}

        {items.length === 0 ? (
          <div className={styles.empty}>∅</div>
        ) : (
          <section ref={gridRef} className={styles.grid} aria-label="Generated TBA QR codes">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                data-batch-id={item.id}
                className={`${styles.card} ${item.completed ? styles.cardDone : ""}`}
                onClick={() => toggleViewportRow(item)}
                aria-label={`Toggle ${item.tba}`}
              >
                <div className={styles.qr}>{svgStringToElement(item.svg)}</div>
                <div className={styles.tba}>{item.tba}</div>
                <div className={styles.state}>{item.completed ? "✅" : "⭕"}</div>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
