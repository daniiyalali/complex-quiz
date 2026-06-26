"use client";

/* Shared bottom-center confirmation pill (portal). Same visual as the
   ShareCardModal toast, extracted so the instant "Challenge a friend"
   copy action can confirm from any surface without a modal. */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import styles from "./CopyToast.module.css";

export function CopyToast({
  show,
  onDone,
  children,
}: {
  show: boolean;
  /** Called after the auto-hide delay so the owner can reset its state. */
  onDone: () => void;
  children: React.ReactNode;
}) {
  // Mounted gate — first client render must match SSR (no portal), same
  // hydration fix as StreakDrawer (HANDOFF item 8).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`${styles.toast} ${show ? styles.toastOn : ""}`}
      role="status"
      aria-live="polite"
    >
      <Check size={15} /> {children}
    </div>,
    document.body,
  );
}
