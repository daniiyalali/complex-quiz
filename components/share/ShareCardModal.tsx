"use client";

/* Share sheet — a holographic 3D result card over the app's signature LED
   field, plus real share actions. The card: lazy PixelBlast dot-matrix behind
   the content (static CSS dots until idle, same pattern as HomeBackdrop), an
   animated shine border (Magic UI port), and a foil glare that rides the
   tilt's pointer position (--tilt-mx/--tilt-my from tilt-card).

   Share-only — "Challenge a friend" no longer opens this sheet; it instant-
   copies the dare + /c link (see lib/share.ts) and confirms with CopyToast.
   Portal modal, sharp-cornered shell to match AuthModal, dim+blur scrim. */

import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Link2, Share2, MessageCircle, Clock, Zap } from "lucide-react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/tilt-card";
import { BadgeMark, type BadgeIconKind } from "@/components/badges/BadgeIcon";
import { buildShareText, challengeLink, copyText } from "@/lib/share";
import { scoreVerdict, cardBadges } from "@/lib/verdict";
import styles from "./ShareCardModal.module.css";

const PixelBlast = lazy(() =>
  import("@/components/quiz/PixelBlast").then((m) => ({ default: m.PixelBlast })),
);

export type ShareBadge = { icon: BadgeIconKind; name: string; earnRate?: string };

export type ShareData = {
  score: number;
  total: number;
  squares: boolean[];
  rank: number;
  of: number;
  streak: number;
  dateAllCaps: string;
  title: string;
  time?: string;
  /** Seconds (preferred over parsing `time`); drives the PLAYMAKERS speed badge. */
  timeSec?: number;
  /** Show "NEW PERSONAL BEST" under the time stat. */
  personalBest?: boolean;
  /** Badge earned this round — when present it becomes the card's centerpiece. */
  earnedBadge?: ShareBadge | null;
  /** Shown when no new badge was earned ("your badges" row). */
  prevBadges?: ShareBadge[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: ShareData;
  url?: string;
};

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.7-.84-2-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.9 1.13-.17.2-.33.22-.62.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.51-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.37-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.2 2.02 3.08 4.9 4.32.68.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.45-9.43 2.52 0 4.89.98 6.67 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.45 9.43zM20.34 3.66A11.34 11.34 0 0 0 12.05.25C5.79.25.7 5.34.7 11.6c0 2 .52 3.95 1.52 5.67L.6 23.75l6.63-1.74a11.3 11.3 0 0 0 5.41 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff" aria-hidden>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.59-.07-4.74-.07zm0 2.76a5.3 5.3 0 1 0 0 10.6 5.3 5.3 0 0 0 0-10.6zm0 8.74a3.44 3.44 0 1 1 0-6.88 3.44 3.44 0 0 1 0 6.88zm6.74-8.94a1.24 1.24 0 1 1-2.48 0 1.24 1.24 0 0 1 2.48 0z" />
    </svg>
  );
}

export function ShareCardModal({ open, onClose, data, url }: Props) {
  const [copied, setCopied] = useState(false);
  // LED field upgrades from static dots to the live drift once the sheet has
  // settled (HomeBackdrop pattern) — never blocks the pop-in animation.
  const [ledLive, setLedLive] = useState(false);

  const link = url ?? challengeLink();
  const shareText = buildShareText(data);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    let t: number | undefined;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      t = window.setTimeout(() => setLedLive(true), 420);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (t) window.clearTimeout(t);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  if (!open || typeof document === "undefined") return null;

  const copyLink = async () => {
    await copyText(shareText);
    setCopied(true);
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "5 for 5 · Complex", text: shareText, url: link });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    copyLink();
  };

  const openIntent = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const enc = encodeURIComponent(shareText);

  const destinations = [
    { key: "wa", label: "WhatsApp", icon: <WhatsAppIcon />, onClick: () => openIntent(`https://wa.me/?text=${enc}`) },
    { key: "x", label: "X", icon: <XIcon />, onClick: () => openIntent(`https://twitter.com/intent/tweet?text=${enc}`) },
    { key: "ig", label: "Stories", icon: <InstagramIcon />, onClick: copyLink },
    { key: "sms", label: "Messages", icon: <MessageCircle size={22} strokeWidth={1.8} />, onClick: () => openIntent(`sms:?&body=${enc}`) },
  ];

  // ── Verdict (single source of truth) + derived card data ──
  // Dev param `?cardscore=0..5` overrides the score for previewing all states.
  // (Guard on null FIRST — `Number(null)` is 0, which previously forced the
  //  card to 0/5 whenever the param was absent.)
  const cardScoreParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("cardscore")
      : null;
  const devScore = cardScoreParam === null ? NaN : Number(cardScoreParam);
  const score =
    Number.isFinite(devScore) && devScore >= 0 && devScore <= data.total ? devScore : data.score;

  const verdict = scoreVerdict(score, data.total);
  const timeSec = data.timeSec ?? (data.time ? parseInt(data.time, 10) : undefined);
  const badges = cardBadges({ score, total: data.total, streak: data.streak, rank: data.rank, of: data.of, timeSec });
  const personalBest = data.personalBest ?? verdict.grade === "flawless";

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Share your result"
        onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close"><X size={20} /></button>

        <div className={styles.head}>
          <h2 className={styles.title}>Share your result</h2>
          <p className={styles.sub}>Send your score before the board locks.</p>
        </div>

        {/* 3D holographic verdict card */}
        <CardContainer containerClassName={styles.tiltWrap} className={styles.tiltInner}>
          <CardBody
            className={styles.card}
            style={{ ["--card-accent" as string]: verdict.accent }}
          >
            {/* LED dot-matrix field — static dots first, live drift after idle */}
            <div className={styles.cardLed} aria-hidden>
              {ledLive ? (
                <Suspense fallback={<div className={styles.cardLedStatic} />}>
                  <PixelBlast
                    variant="circle"
                    color={verdict.accent}
                    pixelSize={5}
                    patternScale={2.4}
                    patternDensity={0.5}
                    pixelSizeJitter={0.35}
                    speed={0.18}
                    enableRipples={false}
                    edgeFade={0.4}
                    transparent
                    autoPauseOffscreen
                  />
                </Suspense>
              ) : (
                <div className={styles.cardLedStatic} />
              )}
            </div>
            {/* animated shine border (Magic UI port) + foil glare */}
            <div className={styles.cardShine} aria-hidden />
            <div className={styles.holoSheen} aria-hidden />

            {/* Top row: 5FOR5 horizontal lockup left · date+theme right */}
            <CardItem translateZ={24} className={styles.cardTop}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/5for5-horizontal.png" alt="Complex 5 for 5 Sneaker Quiz" className={styles.cardLogo} />
              <span className={styles.cardMeta}>
                <span className={styles.cardMetaDate}>{data.dateAllCaps}</span>
                <span className={styles.cardMetaTheme}>{data.title.toUpperCase()}</span>
              </span>
            </CardItem>

            {/* Verdict headline */}
            <CardItem translateZ={48} className={styles.verdictBlock}>
              <h3 className={styles.cardHeadline}>{verdict.label}</h3>
              <p className={styles.cardSubtitle}>{verdict.subtitle}</p>
            </CardItem>

            <span className={styles.cardRule} aria-hidden />

            {/* LED score */}
            <CardItem translateZ={64} as="span" className={styles.cardScore}>
              <span className={styles.cardScoreNum}>{score}</span>
              <span className={styles.cardScoreSlash}>/</span>
              <span className={styles.cardScoreNum}>{data.total}</span>
            </CardItem>

            {/* Two stat cards */}
            <CardItem translateZ={30} className={styles.statCards}>
              <span className={styles.statCard}>
                <Clock size={18} className={styles.statIcon} aria-hidden />
                <span className={styles.statLabel}>COMPLETED IN</span>
                <span className={styles.statBig}>
                  {timeSec ?? "—"}<i>s</i>
                </span>
                {personalBest && (
                  <span className={styles.statTag}>
                    <Zap size={12} aria-hidden /> NEW PERSONAL BEST
                  </span>
                )}
              </span>
            </CardItem>

            {/* Badges unlocked (none on a shareable card → just omit; no
                re-engagement nudge, per user). */}
            {badges.length > 0 && (
              <CardItem translateZ={20} className={styles.badgesBlock}>
                <span className={styles.badgesRule}>BADGES UNLOCKED</span>
                <span
                  className={styles.badgesRow}
                  style={{ justifyContent: badges.length === 1 ? "center" : "flex-start" }}
                >
                  {badges.map((b) => (
                    <span key={b.name} className={styles.badgeCell}>
                      <BadgeMark icon={b.icon} size={56} tier={b.tier} />
                      <span className={styles.badgeName}>{b.name}</span>
                      <span className={styles.badgeCriteria}>{b.criteria}</span>
                    </span>
                  ))}
                </span>
              </CardItem>
            )}
          </CardBody>
        </CardContainer>

        {/* destinations */}
        <div className={styles.dests}>
          {destinations.map((d) => (
            <button key={d.key} className={styles.dest} onClick={d.onClick} aria-label={d.label}>
              <span className={styles.destIcon}>{d.icon}</span>
              <span className={styles.destLabel}>{d.label}</span>
            </button>
          ))}
        </div>

        {/* primary actions */}
        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={copyLink} data-apple-press>
            {copied ? <><Check size={17} /> Link copied</> : <><Link2 size={17} /> Copy link</>}
          </button>
          <button className={styles.shareBtn} onClick={nativeShare} data-apple-press aria-label="More share options">
            <Share2 size={17} />
          </button>
        </div>

        {/* toast */}
        <div className={`${styles.toast} ${copied ? styles.toastOn : ""}`} role="status" aria-live="polite">
          <Check size={15} /> Link copied to clipboard
        </div>
      </div>
    </div>,
    document.body,
  );
}
