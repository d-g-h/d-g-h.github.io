"use client";

import type { PointerEvent } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import styles from "@/components/RouteCard/routecard.module.css";
import type { Route } from "@/lib/utils/generateFloorDoors";

type RouteCardProps = {
  card: Route;
};

export function RouteCard({ card }: RouteCardProps) {
  const overrideRouteId = useDoorsStore((s) => s.overrideRouteId);
  const enableOverride = useDoorsStore((s) => s.enableOverride);
  const moveRouteToDoor = useDoorsStore((s) => s.moveRouteToDoor);
  const clearOverride = useDoorsStore((s) => s.clearOverride);

  const isOverride = overrideRouteId === card.id;

  let startX = 0;
  let startY = 0;
  let dragging = false;
  let el: HTMLDivElement | null = null;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!isOverride) return;
    el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    el.style.position = "absolute";
    el.style.zIndex = "9999";
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging || !el) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragging || !el) return;
    dragging = false;
    el.releasePointerCapture(e.pointerId);
    el.style.transform = "";
    el.style.position = "";
    el.style.zIndex = "";

    const target = document.elementFromPoint(e.clientX, e.clientY);
    const door = target?.closest("[data-door]") as HTMLElement | null;
    const doorId = door?.dataset.door;
    if (doorId) moveRouteToDoor(card, doorId);

    clearOverride();
    el = null;
  }

  return (
    <div
      className={styles.card}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className={styles.header}>
        <span>{card.route}</span>
        <button
          type="button"
          className={styles.override}
          onClick={() => enableOverride(card.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              enableOverride(card.id);
            }
          }}
        >
          override
        </button>
      </div>
      <div className={styles.wave}>{card.waveTime}</div>
    </div>
  );
}
