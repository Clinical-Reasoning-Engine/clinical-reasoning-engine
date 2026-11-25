// One student's attempt at one case: what they asked, what they ordered and
// what they submitted. Pure data + helpers (tested in attempt.test.ts). The
// React side that stores it lives in components/diagnose/attempt-provider.tsx.

export type AskedQuestion = {
  question: string;
  reply: string;
  speaker: string;
  /** The history item that matched, or null if the question was off-topic. */
  itemId: string | null;
};

export type Submission = {
  /** Ranked differentials, #1 first. Each is the text the student entered. */
  differentials: [string, string, string];
  supportingFindings: string;
  planNote: string;
  submittedAt: string;
};

export type Attempt = {
  caseId: string;
  asked: AskedQuestion[];
  testsOrdered: string[];
  submission: Submission | null;
  /** Practice mode shows the full history checklist (hints). */
  practiceMode: boolean;
  /** True once practice mode was turned on in this attempt, even if turned off again. Results notes it. */
  usedPracticeMode: boolean;
};

export function emptyAttempt(caseId: string): Attempt {
  return { caseId, asked: [], testsOrdered: [], submission: null, practiceMode: false, usedPracticeMode: false };
}

/** Ids of the history items the student has covered so far. */
export function askedItemIds(attempt: Attempt): string[] {
  return [...new Set(attempt.asked.flatMap((q) => (q.itemId ? [q.itemId] : [])))];
}

/** How many questions got an off-topic reply (used to alternate those replies). */
export function offTopicCount(attempt: Attempt): number {
  return attempt.asked.filter((q) => q.itemId === null).length;
}

/** Adds a test once; ordering it again does nothing. */
export function orderTest(attempt: Attempt, testId: string): Attempt {
  if (attempt.testsOrdered.includes(testId)) return attempt;
  return { ...attempt, testsOrdered: [...attempt.testsOrdered, testId] };
}

/** Turns practice mode on or off. Turning it on is remembered for Results. */
export function setPracticeMode(attempt: Attempt, on: boolean): Attempt {
  return { ...attempt, practiceMode: on, usedPracticeMode: attempt.usedPracticeMode || on };
}

/** True when all three differentials are filled in. */
export function canSubmit(differentials: string[]): boolean {
  return differentials.length === 3 && differentials.every((d) => d.trim().length > 0);
}

const isString = (v: unknown): v is string => typeof v === "string";

function parseAsked(value: unknown): AskedQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((q) => {
    if (!q || typeof q !== "object") return [];
    const { question, reply, speaker, itemId } = q as Record<string, unknown>;
    if (!isString(question) || !isString(reply) || !isString(speaker)) return [];
    return [{ question, reply, speaker, itemId: isString(itemId) ? itemId : null }];
  });
}

function parseSubmission(value: unknown): Submission | null {
  if (!value || typeof value !== "object") return null;
  const { differentials, supportingFindings, planNote, submittedAt } = value as Record<string, unknown>;
  if (!Array.isArray(differentials) || differentials.length !== 3 || !differentials.every(isString)) return null;
  return {
    differentials: [differentials[0], differentials[1], differentials[2]],
    supportingFindings: isString(supportingFindings) ? supportingFindings : "",
    planNote: isString(planNote) ? planNote : "",
    submittedAt: isString(submittedAt) ? submittedAt : "",
  };
}

/**
 * Reads a saved attempt (from sessionStorage, or sent to the server for
 * grading) and checks its shape field by field, so a corrupted, outdated or
 * hand-made value can't crash the page or the grader.
 */
export function parseAttempt(raw: string | null, caseId: string): Attempt {
  if (!raw) return emptyAttempt(caseId);
  try {
    const value = JSON.parse(raw) as Record<string, unknown> | null;
    if (!value || value.caseId !== caseId || !Array.isArray(value.asked) || !Array.isArray(value.testsOrdered)) {
      return emptyAttempt(caseId);
    }
    return {
      caseId,
      asked: parseAsked(value.asked),
      testsOrdered: [...new Set(value.testsOrdered.filter(isString))],
      submission: parseSubmission(value.submission),
      practiceMode: value.practiceMode === true,
      usedPracticeMode: value.usedPracticeMode === true,
    };
  } catch {
    return emptyAttempt(caseId);
  }
}
