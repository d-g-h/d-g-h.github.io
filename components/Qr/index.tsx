"use client";

import React, { useState } from "react";
import { getQRCode } from "@/lib/utils/getQRCode";
import styles from "@/components/Qr/qr.module.css";

export type QRRow = {
  id: string;
  label: string;
  value: string;
  name: string;
  svg: string;
};

type DisplayState = "show" | "hide" | "qrOnly";

export default function Qr() {
  const [input, setInput] = useState("");
  const [rows, setRows] = useState<QRRow[]>([]);
  const [inProgress, setInProgress] = useState<QRRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTextarea, setShowTextarea] = useState(true);
  const [displayStates, setDisplayStates] = useState<Map<string, DisplayState>>(
    new Map()
  );

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
        })
      )
    ).filter(Boolean) as QRRow[];

    setRows(generatedRows);
    const initialStates = new Map<string, DisplayState>();
    generatedRows.forEach((row) => {
      initialStates.set(row.id, "hide");
    });
    setDisplayStates(initialStates);
    setLoading(false);
  };

  const cycleDisplayState = (row: QRRow) => {
    setDisplayStates((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(row.id) ?? "show";
      const next: DisplayState =
        current === "show" ? "hide" : current === "hide" ? "qrOnly" : "show";
      newMap.set(row.id, next);
      return newMap;
    });
  };

  const handleDragStart = (
    e: React.DragEvent,
    row: QRRow,
    from: "main" | "progress"
  ) => {
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
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      setInProgress((prev) => [...prev, row]);
    } else {
      movedRow = inProgress.find((r) => r.id === rowId);
      if (!movedRow) return;
      const row = movedRow;
      setInProgress((prev) => prev.filter((r) => r.id !== rowId));
      setRows((prev) => [...prev, row]);
    }

    if (movedRow && to === "progress") {
      const id = movedRow.id;
      setDisplayStates((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(id) ?? "show";
        const next: DisplayState =
          current === "show" ? "hide" : current === "hide" ? "show" : "qrOnly";
        newMap.set(id, next);
        return newMap;
      });
    }
  };

  const svgStringToElement = (svgString: string): React.ReactElement | null => {
    if (!svgString) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");
      const svgNode = doc.documentElement;

      const attributeMap: Record<string, string> = {
        class: "className",
        for: "htmlFor",
        "shape-rendering": "shapeRendering",
        "clip-path": "clipPath",
        "fill-opacity": "fillOpacity",
        "stroke-width": "strokeWidth",
        "stroke-linecap": "strokeLinecap",
        "stroke-linejoin": "strokeLinejoin",
        "stroke-opacity": "strokeOpacity",
        "text-anchor": "textAnchor",
      };

      const convert = (node: Element): any => {
        const props: any = {};
        for (const attr of Array.from(node.attributes)) {
          const name = attributeMap[attr.name] || attr.name;
          props[name] = attr.value;
        }
        const children = Array.from(node.childNodes)
          .map((child) => {
            if (child.nodeType === Node.TEXT_NODE) return child.textContent;
            if (child.nodeType === Node.ELEMENT_NODE)
              return convert(child as Element);
            return null;
          })
          .filter(Boolean);
        return React.createElement(node.tagName, props, ...children);
      };
      return convert(svgNode);
    } catch (e) {
      console.error("Failed to parse SVG string", e);
      return null;
    }
  };

  const renderRow = (row: QRRow, section: "main" | "progress") => {
    const state = displayStates.get(row.id) ?? "show";
    const qrOpacity = state === "hide" ? 0.3 : state === "qrOnly" ? 0.1 : 1;
    const textOpacity = state === "qrOnly" ? 0 : state === "hide" ? 0.5 : 1;
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
        <button
          className={styles.button}
          type="button"
          onClick={() => setShowTextarea((p) => !p)}
        >
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
          <li style={{ opacity: 0.3, textAlign: "center", fontSize: "4rem" }}>
            🫳
          </li>
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
