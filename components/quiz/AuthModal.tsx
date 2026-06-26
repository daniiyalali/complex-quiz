"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useUserState } from "@/lib/user-state";
import { ClaimHandleModal } from "./ClaimHandleModal";
import styles from "./AuthModal.module.css";

/* "Join 5 for 5" login-required screen (Figma 306-7054 / 306-6872).
   Shown wherever login is gated. White card on desktop (centered modal),
   bottom sheet on mobile. headline/sub are overridable for the rank-aware
   post-quiz variant; defaults match the Figma. */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M16.36 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.77 2.29-1.61 2.79-.41 6.91 1.15 9.17.76 1.11 1.67 2.35 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.24.87-1.28 1.23-2.53 1.25-2.59-.03-.01-2.4-.92-2.42-3.65zM14.13 5.81c.64-.78 1.07-1.86.95-2.94-.92.04-2.03.61-2.69 1.39-.59.69-1.11 1.79-.97 2.85 1.03.08 2.07-.52 2.71-1.3z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z" />
    </svg>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  headline?: string;
  sub?: string;
  onAuthed?: () => void; // called when a sign-in/create action is taken
};

export function AuthModal({ open, onClose, headline, sub, onAuthed }: Props) {
  const [user, updateUser] = useUserState();
  // A first-time account claims an @handle as the FIRST step after picking a
  // sign-in method — handled HERE (not per call-site) so it fires no matter
  // where the user signs in (we need a handle for every user). onAuthed (the
  // host's post-login flow) runs only AFTER the handle is settled.
  const [claiming, setClaiming] = useState(false);

  useEffect(() => { if (!open) setClaiming(false); }, [open]);

  useEffect(() => {
    if (!open || claiming) return; // while claiming, ClaimHandleModal owns Esc
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, claiming, onClose]);

  if (!open || typeof document === "undefined") return null;

  if (claiming) {
    const finish = (handle?: string) => {
      if (handle) updateUser({ handle });
      setClaiming(false);
      onAuthed?.();
      onClose();
    };
    return (
      <ClaimHandleModal open onClaim={(h) => finish(h)} onDismiss={() => finish()} />
    );
  }

  const authed = () => {
    if (!user.handle) { setClaiming(true); return; } // claim first, then onAuthed
    onAuthed?.();
    onClose();
  };

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Join 5 for 5"
        onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close"><X size={20} /></button>

        <div className={styles.head}>
          <h2 className={styles.title}>{headline ?? "Join 5 for 5"}</h2>
          <p className={styles.sub}>
            {sub ?? "Sign in to track your streak, compete on the leaderboard, and earn badges."}
          </p>
        </div>

        <div className={styles.social}>
          <button className={styles.socialBtn} onClick={authed}><GoogleIcon />Continue with Google</button>
          <button className={styles.socialBtn} onClick={authed}><AppleIcon />Continue with Apple</button>
          <button className={styles.socialBtn} onClick={authed}><FacebookIcon />Continue with Facebook</button>
        </div>

        <div className={styles.divider}><span />OR<span /></div>

        <div className={styles.actions}>
          <button className={styles.btnLight} onClick={authed}>Log In</button>
          <button className={styles.btnDark} onClick={authed}>Create an account</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
