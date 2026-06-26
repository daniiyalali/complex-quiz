"use client";

/* Shared streak hero — used in the drawer summary view AND inside
   ProfilePanel so both surfaces tell the streak story the same way:
   big pixel flame, huge Doto number, pink DAY STREAK kicker, PB sub-line. */

import type { UserState } from "@/lib/user-state";
import styles from "./StreakHero.module.css";

type Props = {
  user: UserState;
};

export function StreakHero({ user }: Props) {
  return (
    <div className={styles.hero}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/editorial/flame.svg"
        alt=""
        aria-hidden
        className={styles.flame}
      />
      <div className={styles.num}>{user.userStreak}</div>
      <div className={styles.label}>DAY STREAK</div>
      <div className={styles.best}>PERSONAL BEST · {user.userBestStreak}</div>
    </div>
  );
}
