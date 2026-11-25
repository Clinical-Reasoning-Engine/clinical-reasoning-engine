// The Diagnose-mode cases and the pages a student goes through for each one.
// Pure data and helpers, tested in steps.test.ts.

/** Cases that have a Diagnose-mode flow. New cases (pneumonia, ...) get added here. */
export const DIAGNOSE_CASE_IDS = ["sepsis"] as const;
export type DiagnoseCaseId = (typeof DIAGNOSE_CASE_IDS)[number];

export const DIAGNOSE_STEPS = [
  { id: "intro", label: "Patient", segment: "" },
  { id: "workup", label: "Work-up", segment: "/workup" },
  { id: "results", label: "Results", segment: "/results" },
] as const;
export type DiagnoseStepId = (typeof DIAGNOSE_STEPS)[number]["id"];

/** URL of one step, e.g. stepHref("sepsis", "workup") -> "/diagnose/sepsis/workup". */
export function stepHref(caseId: string, step: DiagnoseStepId): string {
  const found = DIAGNOSE_STEPS.find((s) => s.id === step)!;
  return `/diagnose/${caseId}${found.segment}`;
}

/** Index of the step a URL belongs to, or -1 if the URL isn't a step of this case. */
export function stepIndexForPath(pathname: string, caseId: string): number {
  const path = pathname.replace(/\/+$/, "");
  return DIAGNOSE_STEPS.findIndex((s) => path === `/diagnose/${caseId}${s.segment}`);
}
