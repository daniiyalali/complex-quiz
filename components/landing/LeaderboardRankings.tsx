"use client";

import { motion } from "framer-motion";
import styles from "./LeaderboardRankings.module.css";

type Row = { rank: number; name: string; correct: number; time: string };

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function medalClass(rank: number) {
  if (rank === 1) return styles.gold;
  if (rank === 2) return styles.silver;
  if (rank === 3) return styles.bronze;
  return "";
}

function RankRow({
  row,
  index,
  isYou = false,
}: {
  row: Row;
  index: number;
  isYou?: boolean;
}) {
  const medal = medalClass(row.rank);
  return (
    <motion.div
      className={`${styles.row} ${medal} ${isYou ? styles.youRow : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: isYou ? 0 : Math.min(index * 0.035, 0.6),
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <span className={`${styles.rank} mono`}>{row.rank}</span>
      <span className={`${styles.avatar} ${medal}`} aria-hidden="true">
        {initials(row.name)}
      </span>
      <span className={styles.name}>{row.name}</span>
      <span className={`${styles.score} mono`}>
        {row.correct}
        <span className={styles.scoreDenom}>/5</span>
      </span>
      <span className={`${styles.time} mono`}>{row.time}</span>
    </motion.div>
  );
}

export function LeaderboardRankings({
  rows,
  you,
}: {
  rows: Row[];
  you?: Row;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.headRow}>
        <span className={styles.headRank}>#</span>
        <span className={styles.headSpacer} />
        <span className={styles.headName}>Player</span>
        <span className={styles.headScore}>Score</span>
        <span className={styles.headTime}>Time</span>
      </div>

      <div className={styles.list}>
        {rows.map((row, i) => (
          <RankRow key={`${row.rank}-${row.name}`} row={row} index={i} />
        ))}
      </div>

      {you && (
        <div className={styles.youDock}>
          <RankRow row={you} index={0} isYou />
        </div>
      )}
    </div>
  );
}
