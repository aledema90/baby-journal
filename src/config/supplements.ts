import type { Lang } from "@/lib/i18n";
import raw from "./supplements.json";

/**
 * One daily supplement / "goccia". Add, remove, or reorder entries directly in
 * supplements.json — no code change needed. `id` is the only value persisted to
 * the database, so keep it stable once an item has been ticked in production.
 */
export interface SupplementItem {
  /** Stable key stored in supplement_logs.item_key. Don't change after launch. */
  id: string;
  /** Shown before the name. Any emoji. */
  emoji: string;
  /** Optional dose hint, e.g. "5 gocce". */
  dose?: string;
  /** Localised display name. */
  label: Record<Lang, string>;
}

export const SUPPLEMENTS: SupplementItem[] = raw as SupplementItem[];
