"use client";

import { useState } from "react";
import { useDoorsStore } from "@/components/Doors/store";
import styles from "./routesinput.module.css";

export function RoutesInput() {
  const [text, setText] = useState("");
  const generate = useDoorsStore((s) => s.generateFromText);

  return (
    <div className={styles.wrapper}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={styles.textarea}
      />
      <button type="button" onClick={() => generate(text)} className={styles.button}>
        🖨️
      </button>
    </div>
  );
}
