// What we save to a student's account after each graded attempt (MVP-12), and
// how we read it back. Pure data + helpers (tested in attempt-history.test.ts);
// the Firestore reads and writes live in lib/attempt-store.ts.
//
// We save a summary, not the whole attempt: the score, the section scores, the
// #1 diagnosis and the practice-mode flag. That's enough for a "My attempts"
// list and keeps the stored data small. No name or email is stored.

import type { Attempt } from "./attempt";
import type { GradeResult, SlotVerdict } from "./grade";

export type AttemptRecord = {
  /** Firestore document id; one per submitted attempt, so saving twice overwrites. */
  id: string;
  caseId: string;
  caseTitle: string;
  total: number;
  max: number;
  sections: { id: string; label: string; score: number; max: number }[];
  firstDiagnosis: { entered: string; verdict: SlotVerdict };
  usedPracticeMode: boolean;
  gradedBy: string;
  /** ISO time the student submitted; also the sort order on My attempts. */
  submittedAt: string;
};

/** "sepsis-20261124185812345" from the case id and submit time. Same attempt, same id. */
export function attemptRecordId(caseId: string, submittedAt: string): string {
  return `${caseId}-${submittedAt.replace(/\D/g, "") || "unknown"}`;
}

export function buildAttemptRecord(result: GradeResult, attempt: Attempt, caseTitle: string): AttemptRecord {
  const submittedAt = attempt.submission?.submittedAt ?? "";
  const first = result.differentials.slots[0];
  return {
    id: attemptRecordId(result.caseId, submittedAt),
    caseId: result.caseId,
    caseTitle,
    total: result.total,
    max: result.max,
    sections: result.sections.map(({ id, label, score, max }) => ({ id, label, score, max })),
    firstDiagnosis: { entered: first.entered, verdict: first.verdict },
    usedPracticeMode: result.usedPracticeMode,
    gradedBy: result.gradedBy,
    submittedAt,
  };
}

const VERDICTS: SlotVerdict[] = [
  "correct",
  "partial",
  "correct-not-first",
  "alternative",
  "overlap",
  "off-target",
  "unrecognized",
  "duplicate",
];

/**
 * Reads one saved record back. Returns null if it doesn't look like a record
 * (an older format, or hand-edited data), so the list skips it instead of
 * crashing.
 */
export function parseAttemptRecord(id: string, data: unknown): AttemptRecord | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const str = (v: unknown) => typeof v === "string";
  const first = d.firstDiagnosis as Record<string, unknown> | undefined;
  if (!str(d.caseId) || !str(d.caseTitle) || !num(d.total) || !num(d.max) || !str(d.submittedAt)) return null;
  if (!first || !str(first.entered) || !VERDICTS.includes(first.verdict as SlotVerdict)) return null;
  const sections = Array.isArray(d.sections)
    ? d.sections.flatMap((s) => {
        const x = s as Record<string, unknown>;
        return x && str(x.id) && str(x.label) && num(x.score) && num(x.max)
          ? [{ id: x.id as string, label: x.label as string, score: x.score as number, max: x.max as number }]
          : [];
      })
    : [];
  return {
    id,
    caseId: d.caseId as string,
    caseTitle: d.caseTitle as string,
    total: d.total as number,
    max: d.max as number,
    sections,
    firstDiagnosis: { entered: first.entered as string, verdict: first.verdict as SlotVerdict },
    usedPracticeMode: d.usedPracticeMode === true,
    gradedBy: str(d.gradedBy) ? (d.gradedBy as string) : "unknown",
    submittedAt: d.submittedAt as string,
  };
}
