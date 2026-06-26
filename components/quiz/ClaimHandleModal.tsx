"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./ClaimHandleModal.module.css";

/* "Claim your @" — shown right after a FIRST login (Complex.com registration →
   redirected back to the quiz to pick a handle, NOT Complex onboarding; Zack,
   2026-06-17). Quiz-native dark shell matching AuthModal/ShareCardModal.
   Live validation: available → "all yours", taken → red error + disabled CTA.
   Reuses the Verzuz "Claim Your @" pattern, restyled to CQ Apple Dark v3. */

// Demo "taken" set — stands in for a real availability check.
const TAKEN = new Set([
  "complex", "admin", "staff", "mod", "sneakerhead", "kicksforlife",
  "hypebeast", "sneakergoblin", "jordan", "nike", "support",
]);

/** Normalize to a legal handle: drop leading @, lowercase, [a-z0-9_], max 15. */
function normalize(raw: string): string {
  return raw.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15);
}

type Status = "idle" | "short" | "taken" | "ok";

type Props = {
  open: boolean;
  /** Handle accepted — value is the normalized handle (no leading @). */
  onClaim: (handle: string) => void;
  /** Skipped for now — close without setting a handle. */
  onDismiss: () => void;
};

export function ClaimHandleModal({ open, onClaim, onDismiss }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue("");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onDismiss]);

  const status: Status = useMemo(() => {
    if (!value) return "idle";
    if (value.length < 3) return "short";
    if (TAKEN.has(value)) return "taken";
    return "ok";
  }, [value]);

  if (!open || typeof document === "undefined") return null;

  const helper =
    status === "short" ? "Handles are at least 3 characters."
    : status === "taken" ? "This username is already taken."
    : status === "ok" ? `Nice pick! @${value} is all yours.`
    : "Letters, numbers, and underscores — this is how you’ll show up.";

  const submit = () => { if (status === "ok") onClaim(value); };

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onDismiss}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Claim your handle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Claim your @</h2>
          <p className={styles.sub}>
            This is your name on the leaderboard and your shared results. Choose
            your handle to continue.
          </p>
        </div>

        <label className={styles.field} data-status={status}>
          <span className={styles.fieldLabel}>Handle</span>
          <div className={styles.inputRow}>
            <span className={styles.at} aria-hidden>@</span>
            <input
              className={styles.input}
              value={value}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourhandle"
              maxLength={15}
              onChange={(e) => setValue(normalize(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              aria-invalid={status === "taken"}
            />
            {value && (
              <button type="button" className={styles.clear} aria-label="Clear handle" onClick={() => setValue("")}>
                <X size={15} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </label>

        <p className={styles.helper} data-status={status} aria-live="polite">{helper}</p>

        <button type="button" className={styles.continue} disabled={status !== "ok"} onClick={submit}>
          CONTINUE
        </button>
        <button type="button" className={styles.dismiss} onClick={onDismiss}>DISMISS</button>
      </div>
    </div>,
    document.body,
  );
}
