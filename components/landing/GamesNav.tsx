"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, User, LogOut } from "lucide-react";
import styles from "./GamesNav.module.css";

/* Complex Playground wrapper nav (Figma "Navigation" / quiz-assets lockup):
   ← COMPLEX.COM on the left, the COMPLEX·PLAY lockup centered, and an
   auth-aware profile control on the right. `dark` inverts it for the quiz
   surfaces (black bar, white lockup).

   Profile control (only rendered when the host passes auth props):
   - signed out → a "Sign in" button that opens the host's auth modal.
   - signed in  → an initials avatar. When the host passes onProfile/onLogout it
     becomes an account menu (Profile · Log out); otherwise it's a status chip. */
export function GamesNav({
  dark = false,
  loggedIn,
  initials = "AK",
  onSignIn,
  onProfile,
  onLogout,
}: {
  dark?: boolean;
  /** Pass to render the profile control. Omit to keep the bare nav. */
  loggedIn?: boolean;
  /** Initials shown in the signed-in avatar. */
  initials?: string;
  /** Opens the host's auth modal (signed-out state). */
  onSignIn?: () => void;
  /** Signed-in account-menu actions. When provided, the avatar opens a
   *  Profile / Log out menu instead of being a static chip. */
  onProfile?: () => void;
  onLogout?: () => void;
} = {}) {
  const showProfile = loggedIn !== undefined || onSignIn !== undefined;
  const hasMenu = !!(onProfile || onLogout);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className={`${styles.bar} ${dark ? styles.barDark : ""}`}>
      <a
        href="https://www.complex.com"
        className={styles.back}
        onClick={(e) => {
          // Plain left-click: exit to Complex.com but REPLACE this history
          // entry instead of stacking on top of it. Otherwise the browser's
          // Back button returns to a torn-down /play (a black "!hydrated"
          // frame); replacing it makes Back land on the quiz home (the entry
          // that preceded /play). Let modified clicks (cmd/ctrl/shift/middle =
          // open in a new tab) pass through untouched.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          window.location.replace("https://www.complex.com");
        }}
      >
        <ArrowLeft size={18} strokeWidth={2.4} />
        <span>COMPLEX.COM</span>
      </a>
      <a href={dark ? "/" : "/home"} className={styles.logo} aria-label="Complex Play">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/complex-play.svg" alt="Complex Play" className={styles.logoDefault} />
        {/* Dark surfaces: the Complex 5-for-5 horizontal lockup (new flat logo). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/editorial/logo-5for5.png" alt="Complex 5 for 5" className={styles.logo5for5} />
      </a>

      {showProfile && (
        <div className={styles.profile} ref={profileRef}>
          {loggedIn ? (
            hasMenu ? (
              <>
                <button
                  type="button"
                  className={styles.avatar}
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  {initials}
                </button>
                {menuOpen && (
                  <div className={styles.menu} role="menu">
                    {onProfile && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={() => { setMenuOpen(false); onProfile(); }}
                      >
                        <User size={16} strokeWidth={2.2} aria-hidden /> Profile
                      </button>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.menuItem}
                        onClick={() => { setMenuOpen(false); onLogout(); }}
                      >
                        <LogOut size={16} strokeWidth={2.2} aria-hidden /> Log out
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className={styles.avatar} aria-label={`Signed in as ${initials}`}>
                {initials}
              </span>
            )
          ) : (
            <button type="button" className={styles.signIn} onClick={onSignIn}>
              <User size={15} strokeWidth={2.4} aria-hidden />
              <span className={styles.signInLabel}>Sign in</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
