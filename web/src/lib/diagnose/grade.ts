// Rule-based grading for one Diagnose-mode attempt (MVP-7 feedback + grade).
//
// gradeAttempt() is the only thing the Results page calls. It is async and
// takes plain data, so an LLM grader can replace gradeWithRules later without
// changing the page: same input (case + attempt), same output (GradeResult).
//
// It runs on the server (see results/actions.ts) because it reads the answer
// key, which must never be sent to the browser before the student submits.

import type { DiagnoseCase, Source } from "./case-types";
import { CATEGORY_LABELS, normalize, termMatches } from "./history";
import { askedItemIds, type Attempt } from "./attempt";

/** Points per section. Change them here; the page and tests read from this. */
export const GRADE_WEIGHTS = { history: 30, differentials: 40, plan: 30 } as const;

/** How the 40 differential points split up. */
export const DIFFERENTIAL_POINTS = {
  /** The real diagnosis in slot #1. */
  correct: 25,
  /** A close but incomplete answer in slot #1 (e.g. pneumonia without the sepsis). */
  partial: 12,
  /** Each reasonable alternative in slot #2 or #3 (the real diagnosis there counts too). */
  alternative: 5,
  /** Supporting findings for #1, full marks at FINDINGS_FOR_FULL_CREDIT. */
  findings: 5,
} as const;

export const FINDINGS_FOR_FULL_CREDIT = 4;

export type SlotVerdict =
  | "correct" // real diagnosis, slot #1
  | "partial" // close answer, slot #1
  | "correct-not-first" // real diagnosis, but in slot #2 or #3
  | "alternative" // reasonable alternative in slot #2 or #3
  | "overlap" // a close answer in #2 or #3: it overlaps the real diagnosis instead of being a real alternative
  | "off-target" // a known diagnosis that doesn't fit this case
  | "unrecognized" // text we couldn't match to any diagnosis
  | "duplicate"; // same diagnosis as an earlier slot

export type GradeSection = { id: "history" | "differentials" | "plan"; label: string; score: number; max: number };

export type GradeResult = {
  caseId: string;
  /** Which grader produced this, so saved attempts can be compared fairly later. */
  gradedBy: "rules-v1";
  total: number;
  max: number;
  sections: GradeSection[];
  history: {
    covered: { id: string; label: string; category: string }[];
    missed: { id: string; label: string; category: string; why: string }[];
  };
  differentials: {
    slots: { rank: number; entered: string; matchedLabel: string | null; verdict: SlotVerdict; points: number }[];
    answer: { label: string; source: Source };
    findings: { mentioned: string[]; notMentioned: string[]; points: number };
  };
  plan: {
    ordered: { testId: string; label: string; why: string; source: Source }[];
    missed: { testId: string; label: string; why: string; source: Source }[];
    extra: { testId: string; label: string }[];
    note: string;
  };
  chartChecks: { label: string; why: string; caught: boolean }[];
  teachingPoints: string[];
  usedPracticeMode: boolean;
};

export type Grader = (diagnoseCase: DiagnoseCase, attempt: Attempt) => Promise<GradeResult>;

/** Every word of a synonym appears in the text (any order). */
function allWordsMatch(normalizedText: string, synonym: string): boolean {
  const words = synonym.trim().split(/\s+/);
  return words.length > 0 && words.every((w) => termMatches(normalizedText, w));
}

/**
 * Which diagnosis option a student's free text means, or null. An exact label
 * wins; otherwise the synonym with the most words wins (ties go to the option
 * listed first). Negation ("not PE") isn't understood; that's a known limit.
 */
export function matchDiagnosis(diagnoses: DiagnoseCase["diagnoses"], text: string): string | null {
  const t = normalize(text);
  if (!t) return null;
  const exact = diagnoses.find((d) => normalize(d.label) === t);
  if (exact) return exact.id;
  let bestId: string | null = null;
  let bestScore = 0;
  for (const d of diagnoses) {
    for (const s of d.synonyms) {
      const score = s.trim().split(/\s+/).length;
      if (score > bestScore && allWordsMatch(t, s)) {
        bestId = d.id;
        bestScore = score;
      }
    }
  }
  return bestId;
}

/** Points for a fraction of a section, rounded to a whole number. */
function share(got: number, outOf: number, max: number): number {
  return outOf === 0 ? max : Math.round((got / outOf) * max);
}

export async function gradeWithRules(diagnoseCase: DiagnoseCase, attempt: Attempt): Promise<GradeResult> {
  const { history, tests, diagnoses, answerKey, chart } = diagnoseCase;
  const submission = attempt.submission;
  if (!submission) throw new Error("Can't grade an attempt that hasn't been submitted.");

  // History: key items covered, out of all key items.
  const asked = new Set(askedItemIds(attempt));
  const keyItems = history.filter((h) => h.key);
  const category = (c: string) => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c;
  const covered = keyItems.filter((h) => asked.has(h.id));
  const missed = keyItems.filter((h) => !asked.has(h.id));
  const historyScore = share(covered.length, keyItems.length, GRADE_WEIGHTS.history);

  // Differentials: slot by slot, then supporting findings.
  const labelOf = (id: string | null) => diagnoses.find((d) => d.id === id)?.label ?? null;
  const seen = new Set<string>();
  const slots = submission.differentials.map((entered, i) => {
    const id = matchDiagnosis(diagnoses, entered);
    let verdict: SlotVerdict;
    if (id === null) verdict = "unrecognized";
    else if (seen.has(id)) verdict = "duplicate";
    else if (id === answerKey.diagnosisId) verdict = i === 0 ? "correct" : "correct-not-first";
    else if (i === 0 && answerKey.partialIds.includes(id)) verdict = "partial";
    else if (i > 0 && answerKey.alternativeIds.includes(id)) verdict = "alternative";
    else if (i > 0 && answerKey.partialIds.includes(id)) verdict = "overlap";
    else verdict = "off-target";
    if (id) seen.add(id);
    const points =
      verdict === "correct"
        ? DIFFERENTIAL_POINTS.correct
        : verdict === "partial"
          ? DIFFERENTIAL_POINTS.partial
          : verdict === "alternative" || verdict === "correct-not-first"
            ? DIFFERENTIAL_POINTS.alternative
            : 0;
    return { rank: i + 1, entered, matchedLabel: labelOf(id), verdict, points };
  });

  const findingsText = normalize(submission.supportingFindings);
  const mentioned = answerKey.supportingFindings.filter((f) => f.terms.some((term) => termMatches(findingsText, term)));
  const findingsPoints = Math.round(
    (Math.min(mentioned.length, FINDINGS_FOR_FULL_CREDIT) / FINDINGS_FOR_FULL_CREDIT) * DIFFERENTIAL_POINTS.findings,
  );
  const differentialScore = slots.reduce((sum, s) => sum + s.points, 0) + findingsPoints;

  // Plan: key tests ordered, out of the key's plan. Extra tests cost nothing here.
  const testLabel = (id: string) => tests.find((t) => t.id === id)?.label ?? id;
  const ordered = new Set(attempt.testsOrdered);
  const planItems = answerKey.plan.map((p) => ({ testId: p.testId, label: testLabel(p.testId), why: p.why, source: p.source }));
  const planOrdered = planItems.filter((p) => ordered.has(p.testId));
  const planMissed = planItems.filter((p) => !ordered.has(p.testId));
  const inPlan = new Set(answerKey.plan.map((p) => p.testId));
  const extra = attempt.testsOrdered.filter((id) => !inPlan.has(id)).map((id) => ({ testId: id, label: testLabel(id) }));
  const planScore = share(planOrdered.length, planItems.length, GRADE_WEIGHTS.plan);

  const sections: GradeSection[] = [
    { id: "history", label: "History", score: historyScore, max: GRADE_WEIGHTS.history },
    { id: "differentials", label: "Differentials", score: differentialScore, max: GRADE_WEIGHTS.differentials },
    { id: "plan", label: "Work-up plan", score: planScore, max: GRADE_WEIGHTS.plan },
  ];

  return {
    caseId: diagnoseCase.id,
    gradedBy: "rules-v1",
    total: sections.reduce((sum, s) => sum + s.score, 0),
    max: sections.reduce((sum, s) => sum + s.max, 0),
    sections,
    history: {
      covered: covered.map((h) => ({ id: h.id, label: h.label, category: category(h.category) })),
      missed: missed.map((h) => ({ id: h.id, label: h.label, category: category(h.category), why: h.why ?? "" })),
    },
    differentials: {
      slots,
      answer: { label: labelOf(answerKey.diagnosisId) ?? answerKey.diagnosisId, source: answerKey.diagnosisSource },
      findings: {
        mentioned: mentioned.map((f) => f.label),
        notMentioned: answerKey.supportingFindings.filter((f) => !mentioned.includes(f)).map((f) => f.label),
        points: findingsPoints,
      },
    },
    plan: { ordered: planOrdered, missed: planMissed, extra, note: submission.planNote },
    chartChecks: chart.gaps.map((g) => ({ label: g.label, why: g.why, caught: asked.has(g.historyItemId) })),
    teachingPoints: answerKey.teachingPoints,
    usedPracticeMode: attempt.usedPracticeMode,
  };
}

/** The grader the app uses. Swap this line to try a different grader. */
export const gradeAttempt: Grader = gradeWithRules;
