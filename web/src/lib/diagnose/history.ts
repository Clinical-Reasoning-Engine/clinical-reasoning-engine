// Rule-based "AI patient" for now: matches the student's free-text question to
// the case's history items by keywords. An LLM can replace askPatient() later
// without changing the pages (same input, same output shape).

import type { HistoryCategory, HistoryItem } from "./case-types";

export type PatientReply =
  | { matched: true; item: HistoryItem; speaker: HistoryItem["speaker"]; text: string }
  | { matched: false; speaker: "Patient"; text: string };

/** Said when no history item matches, alternating so it doesn't feel canned. */
export const OFF_TOPIC_REPLIES = [
  "Sorry, I didn't understand the question.",
  "I think we should get back to why we're here.",
];

/** Lowercase, keep letters/numbers, collapse spaces: "Any CHEST pain?!" -> "any chest pain". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Does a term appear in already-normalized text? Terms match whole words
 * ("hi" matches "hi there", not "history"). A trailing * matches the start of
 * a word instead: "smok*" matches "smoke", "smoking" and "smoker".
 */
export function termMatches(normalizedText: string, term: string): boolean {
  const prefix = term.endsWith("*");
  const t = normalize(prefix ? term.slice(0, -1) : term);
  if (!t) return false;
  return new RegExp(`\\b${escapeRegex(t)}${prefix ? "" : "\\b"}`).test(normalizedText);
}

/**
 * How well a question matches one item. Each matching term adds its word count,
 * so a specific phrase ("getting worse", 2) beats a single word ("worse", 1).
 */
export function matchScore(question: string, item: HistoryItem): number {
  const q = normalize(question);
  let score = 0;
  for (const term of item.terms) {
    if (termMatches(q, term)) score += normalize(term.replace(/\*$/, "")).split(" ").length;
  }
  return score;
}

/**
 * Answers one question. The best-scoring item wins (ties go to the item listed
 * first). No match gets an off-topic reply; offTopicCount picks which one.
 */
export function askPatient(items: HistoryItem[], question: string, offTopicCount = 0): PatientReply {
  let best: HistoryItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const score = matchScore(question, item);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  if (!best) {
    return { matched: false, speaker: "Patient", text: OFF_TOPIC_REPLIES[offTopicCount % OFF_TOPIC_REPLIES.length] };
  }
  return { matched: true, item: best, speaker: best.speaker, text: best.answer };
}

export const CATEGORY_LABELS: Record<HistoryCategory, string> = {
  hpi: "History of present illness (OPQRST)",
  pmh: "Past medical history, meds, allergies",
  family: "Family history",
  social: "Social history",
  ros: "Review of systems",
};

export const CATEGORY_ORDER: HistoryCategory[] = ["hpi", "pmh", "family", "social", "ros"];

export type CategoryCoverage = {
  category: HistoryCategory;
  items: { id: string; label: string; asked: boolean }[];
};

/**
 * What the tracker shows. Normally only topics already covered, so it can't be
 * used as a cheat sheet; in practice mode every topic, as a checklist.
 */
export function trackerView(items: HistoryItem[], askedIds: Iterable<string>, practiceMode: boolean): CategoryCoverage[] {
  const groups = coverage(items, askedIds);
  if (practiceMode) return groups;
  return groups.map((g) => ({ ...g, items: g.items.filter((i) => i.asked) }));
}

/** For the tracker: every tracked item, grouped by category, and whether it has been asked. */
export function coverage(items: HistoryItem[], askedIds: Iterable<string>): CategoryCoverage[] {
  const asked = new Set(askedIds);
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: items
      .filter((i) => i.category === category)
      .map((i) => ({ id: i.id, label: i.label, asked: asked.has(i.id) })),
  }));
}
