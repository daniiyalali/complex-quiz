"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SheetModal.module.css";

/* SheetModal — the shared overlay shell used by Streak & Badges: a centered
   pop-up on desktop (≥1024px) and a drag-dismissable bottom sheet on mobile.
   The child renders its own header/title; this only provides the scrim,
   panel, close affordance, and mobile drag handle. */

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
};

export function SheetModal({ open, onClose, children, ariaLabel }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, velY: 0 });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Body scroll lock + Esc + focus restore while open.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [open, onClose]);

  // Drag-to-dismiss — mobile only, bound to the handle.
  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    dragRef.current = { active: true, startY: e.clientY, lastY: e.clientY, lastT: Date.now(), velY: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panelRef.current) panelRef.current.style.transition = "none";
  };
  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    const now = Date.now();
    const dt = now - dragRef.current.lastT;
    if (dt > 0) dragRef.current.velY = (e.clientY - dragRef.current.lastY) / dt;
    dragRef.current.lastY = e.clientY;
    dragRef.current.lastT = now;
    if (panelRef.current) panelRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    const vel = dragRef.current.velY;
    dragRef.current.active = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (panelRef.current) {
      panelRef.current.style.transform = "";
      panelRef.current.style.transition = "";
    }
    const panelHeight = panelRef.current?.offsetHeight ?? window.innerHeight * 0.68;
    if (dy > panelHeight * 0.4 || vel > 0.7) onClose();
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={`${styles.root} ${open ? styles.rootOpen : ""}`} aria-hidden={!open}>
      <div className={styles.overlay} onClick={onClose} />
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <div
          className={styles.handleHit}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div className={styles.handle} aria-hidden />
        </div>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
