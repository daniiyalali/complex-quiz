/* Share + challenge copy — single source of truth for outbound text and the
   clipboard write, shared by ShareCardModal and every "Challenge a friend"
   trigger (Results, LandingPage, EditorialLayout). */

/** The challenge deep link. `/c` carries the "You've been challenged" OG
    framing (title/description/image) so the link unfurl does the talking. */
export function challengeLink(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/c`;
  return "https://complex-receipts.vercel.app/c";
}

/** Wordle-style challenge message: instant to paste, score tease when we
    have one (post-play), neutral dare otherwise. */
export function buildChallengeText(score?: number, total?: number): string {
  const link = challengeLink();
  if (typeof score === "number" && typeof total === "number") {
    return `You've been challenged 👀 Today's Complex 5 for 5. Beat my ${score}/${total}: ${link}`;
  }
  return `You've been challenged 👀 Complex 5 for 5. Five questions, one shot: ${link}`;
}

export function buildShareText(d: {
  score: number;
  total: number;
  rank: number;
  of: number;
}): string {
  const link = challengeLink();
  return `Went ${d.score}/${d.total} on today's 5 for 5, #${d.rank} of ${d.of.toLocaleString()}. Play today's 5 for 5 on Complex:\n${link}`;
}

/** Clipboard write with the legacy textarea fallback (Safari/permission). */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}
