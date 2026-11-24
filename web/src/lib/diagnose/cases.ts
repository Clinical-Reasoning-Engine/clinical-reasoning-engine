// Looks up a Diagnose-mode case by the id in the URL (/diagnose/<id>).

import { sepsisDiagnoseCase } from "../../demo-case/diagnose-sepsis";

import type { DiagnoseCase } from "./case-types";
import type { DiagnoseCaseId } from "./steps";

const CASES: Record<DiagnoseCaseId, DiagnoseCase> = {
  sepsis: sepsisDiagnoseCase,
};

/** The case for this id, or null if there is no such case. */
export function getDiagnoseCase(id: string): DiagnoseCase | null {
  return (CASES as Record<string, DiagnoseCase>)[id] ?? null;
}
