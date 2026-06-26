/**
 * Lightweight className helper.
 * Not using Tailwind in this project — so no need for tailwind-merge.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
