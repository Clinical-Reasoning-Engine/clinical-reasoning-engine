import { describe, expect, it } from "vitest";

import { sepsisDiagnoseCase as c } from "../../demo-case/diagnose-sepsis";

import { emptyAttempt, type Attempt } from "./attempt";
import { attemptRecordId, buildAttemptRecord, parseAttemptRecord } from "./attempt-history";
import { gradeAttempt } from "./grade";

const attempt: Attempt = {
  ...emptyAttempt("sepsis"),
  asked: [{ question: "allergies?", reply: "", speaker: "Daughter", itemId: "allergies" }],
  testsOrdered: ["cbc"],
  usedPracticeMode: true,
  submission: {
    differentials: ["sepsis from pneumonia", "flu", "covid"],
    supportingFindings: "fever",
    planNote: "",
    submittedAt: "2026-11-24T18:58:12.345Z",
  },
};

describe("attempt history", () => {
  it("makes one stable id per submitted attempt", () => {
    expect(attemptRecordId("sepsis", "2026-11-24T18:58:12.345Z")).toBe("sepsis-20261124185812345");
    expect(attemptRecordId("sepsis", "")).toBe("sepsis-unknown");
  });

  it("builds a small summary record from a graded attempt", async () => {
    const result = await gradeAttempt(c, attempt);
    const record = buildAttemptRecord(result, attempt, c.title);
    expect(record).toMatchObject({
      id: "sepsis-20261124185812345",
      caseId: "sepsis",
      caseTitle: c.title,
      total: result.total,
      max: 100,
      firstDiagnosis: { entered: "sepsis from pneumonia", verdict: "correct" },
      usedPracticeMode: true,
      gradedBy: "rules-v1",
    });
    expect(record.sections.map((s) => s.id)).toEqual(["history", "differentials", "plan"]);
    // Only the summary: no transcript, tests or free text beyond the #1 diagnosis.
    expect(Object.keys(record).sort()).toEqual(
      ["caseId", "caseTitle", "firstDiagnosis", "gradedBy", "id", "max", "sections", "submittedAt", "total", "usedPracticeMode"].sort(),
    );
  });

  it("reads a saved record back unchanged", async () => {
    const record = buildAttemptRecord(await gradeAttempt(c, attempt), attempt, c.title);
    const { id, ...stored } = record;
    expect(parseAttemptRecord(id, { ...stored, savedAt: { seconds: 1 } })).toEqual(record);
  });

  it("skips data that doesn't look like a record", () => {
    expect(parseAttemptRecord("x", null)).toBeNull();
    expect(parseAttemptRecord("x", { caseId: "sepsis" })).toBeNull();
    expect(
      parseAttemptRecord("x", {
        caseId: "sepsis",
        caseTitle: "t",
        total: 50,
        max: 100,
        submittedAt: "2026-11-24",
        firstDiagnosis: { entered: "flu", verdict: "made-up" },
      }),
    ).toBeNull();
  });
});
