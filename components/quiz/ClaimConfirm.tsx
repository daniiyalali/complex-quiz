"use client";

import { useEffect } from "react";
import styles from "./ClaimConfirm.module.css";

export function ClaimConfirm({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={styles.overlay}>
      <span className={styles.kicker}>Account created</span>
      <div className={styles.headline}>You&apos;re in.</div>
      <span className={styles.sub}>Result saved · Streak started</span>
    </div>
  );
}
