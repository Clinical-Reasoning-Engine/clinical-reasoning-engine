"use server";

// Grades an attempt on the server. The browser sends its attempt (kept in
// sessionStorage) and gets back the graded result. The answer key stays here,
// so it isn't in the JavaScript sent to students before they submit.
//
// Anyone can call a Server Function directly, so the input is treated as
// untrusted: parseAttempt() checks every field, and an attempt with no
// submission is refused. (A student could still fake a submission to see the
// answer early; for a practice tool that's acceptable.)

import { parseAttempt } from "@/lib/diagnose/attempt";
import { getDiagnoseCase } from "@/lib/diagnose/cases";
import { gradeAttempt, type GradeResult } from "@/lib/diagnose/grade";

export type GradeResponse = { ok: true; result: GradeResult } | { ok: false; reason: "unknown-case" | "not-submitted" };

const MAX_ATTEMPT_BYTES = 200_000;

export async function gradeMyAttempt(caseId: string, attemptJson: string): Promise<GradeResponse> {
  const diagnoseCase = getDiagnoseCase(caseId);
  if (!diagnoseCase) return { ok: false, reason: "unknown-case" };
  const tooBig = typeof attemptJson !== "string" || attemptJson.length > MAX_ATTEMPT_BYTES;
  const attempt = parseAttempt(tooBig ? null : attemptJson, caseId);
  if (!attempt.submission) return { ok: false, reason: "not-submitted" };
  return { ok: true, result: await gradeAttempt(diagnoseCase, attempt) };
}
