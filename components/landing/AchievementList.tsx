"use client";

import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { BADGES } from "@/lib/quiz-data";
import { BadgeMark } from "@/components/badges/BadgeIcon";
import styles from "./AchievementList.module.css";

export function AchievementList({
  earnedIds = [],
}: {
  earnedIds?: string[];
}) {
  const earned = new Set(earnedIds);
  const unlockedCount = BADGES.filter((b) => earned.has(b.id)).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.title}>Achievements</span>
        <span className={styles.count}>
          <span className={`${styles.countNum} mono`}>{unlockedCount}</span>
          <span className={styles.countOf}>of</span>
          <span className={`${styles.countNum} mono`}>{BADGES.length}</span>
          <span className={styles.countLbl}>unlocked</span>
        </span>
      </div>

      <div className={styles.grid}>
        {BADGES.map((badge, i) => {
          const isEarned = earned.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              className={`${styles.card} ${isEarned ? "" : styles.locked}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: Math.min(i * 0.04, 0.5),
                ease: [0.34, 1.56, 0.64, 1],
              }}
              whileHover={{ y: -4 }}
            >
              <div className={styles.artWrap}>
                <div className={styles.art}>
                  <BadgeMark icon={badge.icon} size={48} />
                </div>
                <span
                  className={`${styles.stateBadge} ${
                    isEarned ? styles.stateEarned : styles.stateLocked
                  }`}
                  aria-hidden="true"
                >
                  {isEarned ? (
                    <Check size={11} strokeWidth={3.2} />
                  ) : (
                    <Lock size={10} strokeWidth={2.6} />
                  )}
                </span>
              </div>
              <div className={styles.text}>
                <span className={styles.name}>{badge.name}</span>
                <span className={styles.criteria}>{badge.criteria}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
