// Looks up a Diagnose-mode case by the id in the URL (/diagnose/<id>).

import { sepsisDiagnoseCase } from "../../demo-case/diagnose-sepsis";

import type { DiagnoseCase, PatientChart } from "./case-types";
import type { DiagnoseCaseId } from "./steps";

const CASES: Record<DiagnoseCaseId, DiagnoseCase> = {
  sepsis: sepsisDiagnoseCase,
};

/** The case for this id, or null if there is no such case. */
export function getDiagnoseCase(id: string): DiagnoseCase | null {
  return (CASES as Record<string, DiagnoseCase>)[id] ?? null;
}

/**
 * The chart as the student sees it. Copies only the fields that are safe to
 * show; `gaps` is part of the answer key, so it stays on the server.
 */
export function chartForStudent(chart: PatientChart): Omit<PatientChart, "gaps"> {
  const { source, lastUpdated, problems, medications, allergies, immunizations, visits, pastLabs } = chart;
  return { source, lastUpdated, problems, medications, allergies, immunizations, visits, pastLabs };
}
