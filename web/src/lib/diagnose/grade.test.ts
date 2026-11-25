import { describe, expect, it } from "vitest";

import { sepsisDiagnoseCase as c } from "../../demo-case/diagnose-sepsis";

import { emptyAttempt, parseAttempt, type Attempt } from "./attempt";
import { DIFFERENTIAL_POINTS, GRADE_WEIGHTS, gradeAttempt, matchDiagnosis } from "./grade";

function attempt(overrides: Partial<Attempt> & { differentials?: [string, string, string]; findings?: string }): Attempt {
  const { differentials = ["", "", ""], findings = "", ...rest } = overrides;
  return {
    ...emptyAttempt("sepsis"),
    submission: { differentials, supportingFindings: findings, planNote: "", submittedAt: "2026-11-24T00:00:00Z" },
    ...rest,
  };
}

const asked = (...ids: string[]) => ids.map((id) => ({ question: id, reply: "", speaker: "Patient", itemId: id }));
const keyIds = c.history.filter((h) => h.key).map((h) => h.id);
const planIds = c.answerKey.plan.map((p) => p.testId);

describe("matchDiagnosis", () => {
  it.each([
    ["Sepsis / septic shock from pneumonia", "sepsis-pneumonia"],
    ["pneumonia with sepsis", "sepsis-pneumonia"],
    ["Septic shock secondary to pneumonia", "sepsis-pneumonia"],
    ["sepsis from a lung infection", "sepsis-pneumonia"],
    ["pneumonia", "pneumonia"],
    ["CAP", "pneumonia"],
    ["septic shock", "sepsis-unknown"],
    ["Sepsis", "sepsis-unknown"],
    ["sepsis from a UTI", "urosepsis"],
    ["aspiration pneumonia", "aspiration"],
    ["the flu", "influenza"],
    ["PE", "pe"],
    ["Community-acquired pneumonia (no sepsis)", "pneumonia"],
  ])("%s -> %s", (text, id) => {
    expect(matchDiagnosis(c.diagnoses, text)).toBe(id);
  });

  it("returns null for text it can't place", () => {
    expect(matchDiagnosis(c.diagnoses, "something bad")).toBeNull();
    expect(matchDiagnosis(c.diagnoses, "   ")).toBeNull();
  });
});

describe("gradeAttempt", () => {
  it("gives full marks for a complete, correct attempt", async () => {
    const result = await gradeAttempt(
      c,
      attempt({
        asked: asked(...keyIds),
        testsOrdered: planIds,
        differentials: ["sepsis from pneumonia", "urosepsis", "influenza"],
        findings: "Fever, productive cough, new confusion, hypotension with MAP 58, WBC 22.4",
      }),
    );
    expect(result.total).toBe(100);
    expect(result.max).toBe(GRADE_WEIGHTS.history + GRADE_WEIGHTS.differentials + GRADE_WEIGHTS.plan);
    expect(result.history.missed).toEqual([]);
    expect(result.plan.missed).toEqual([]);
    expect(result.chartChecks.every((g) => g.caught)).toBe(true);
  });

  it("scores an empty work-up with a wrong diagnosis as zero", async () => {
    const result = await gradeAttempt(c, attempt({ differentials: ["stroke", "heart attack", "copd"] }));
    expect(result.total).toBe(0);
    expect(result.differentials.slots.map((s) => s.verdict)).toEqual(["off-target", "off-target", "off-target"]);
    expect(result.history.missed.length).toBe(keyIds.length);
    expect(result.history.missed.every((m) => m.why.length > 0)).toBe(true);
    expect(result.chartChecks.some((g) => g.caught)).toBe(false);
  });

  it("gives half credit for a close #1 and credit for the real diagnosis lower down", async () => {
    const result = await gradeAttempt(c, attempt({ differentials: ["pneumonia", "sepsis from pneumonia", "covid"] }));
    expect(result.differentials.slots.map((s) => s.verdict)).toEqual(["partial", "correct-not-first", "alternative"]);
    expect(result.sections.find((s) => s.id === "differentials")!.score).toBe(
      DIFFERENTIAL_POINTS.partial + 2 * DIFFERENTIAL_POINTS.alternative,
    );
  });

  it("gives no alternative credit for a close answer lower down", async () => {
    const result = await gradeAttempt(c, attempt({ differentials: ["sepsis from pneumonia", "pneumonia", "flu"] }));
    expect(result.differentials.slots[1]).toMatchObject({ verdict: "overlap", points: 0 });
  });

  it("counts the same diagnosis twice only once", async () => {
    const result = await gradeAttempt(c, attempt({ differentials: ["sepsis from pneumonia", "pneumosepsis", "flu"] }));
    expect(result.differentials.slots[1].verdict).toBe("duplicate");
    expect(result.differentials.slots[1].points).toBe(0);
  });

  it("marks text it can't match instead of guessing", async () => {
    const result = await gradeAttempt(c, attempt({ differentials: ["sepsis from pneumonia", "something viral?", "flu"] }));
    expect(result.differentials.slots[1]).toMatchObject({ verdict: "unrecognized", matchedLabel: null, points: 0 });
  });

  it("scores history and plan as a share of the key, and extra tests cost nothing", async () => {
    const result = await gradeAttempt(
      c,
      attempt({
        asked: asked(keyIds[0], keyIds[1], "greeting", "vaccines"),
        testsOrdered: ["cbc", "ct-head", "d-dimer"],
        differentials: ["sepsis from pneumonia", "flu", "covid"],
      }),
    );
    const section = (id: string) => result.sections.find((s) => s.id === id)!.score;
    expect(section("history")).toBe(Math.round((2 / keyIds.length) * GRADE_WEIGHTS.history));
    expect(section("plan")).toBe(Math.round((1 / planIds.length) * GRADE_WEIGHTS.plan));
    expect(result.plan.extra.map((t) => t.testId)).toEqual(["ct-head", "d-dimer"]);
  });

  it("credits the chart checks only for the history items that uncover them", async () => {
    const result = await gradeAttempt(c, attempt({ asked: asked("allergies"), differentials: ["flu", "covid", "pe"] }));
    expect(result.chartChecks.map((g) => g.caught)).toEqual([true, false]);
  });

  it("labels each plan test and the diagnosis with where it came from", async () => {
    const result = await gradeAttempt(c, attempt({ differentials: ["flu", "covid", "pe"] }));
    expect(result.differentials.answer.source).toBe("mimic-demo");
    expect(result.plan.missed.find((t) => t.testId === "cbc")!.source).toBe("mimic-demo");
    expect(result.plan.missed.find((t) => t.testId === "cxr")!.source).toBe("team");
  });

  it("notes practice mode without changing the score", async () => {
    const base = attempt({ differentials: ["sepsis from pneumonia", "flu", "covid"] });
    const plain = await gradeAttempt(c, base);
    const practiced = await gradeAttempt(c, { ...base, usedPracticeMode: true });
    expect(practiced.usedPracticeMode).toBe(true);
    expect(practiced.total).toBe(plain.total);
  });

  it("refuses an attempt that wasn't submitted", async () => {
    await expect(gradeAttempt(c, emptyAttempt("sepsis"))).rejects.toThrow();
  });

  it("grades a hand-made attempt safely after parseAttempt cleans it", async () => {
    const raw = JSON.stringify({
      caseId: "sepsis",
      asked: [null, 5, { question: "x", reply: "y", speaker: "Patient", itemId: "onset" }],
      testsOrdered: ["cbc", 3, "cbc"],
      submission: { differentials: ["sepsis", "flu", "covid"], supportingFindings: 42 },
    });
    const parsed = parseAttempt(raw, "sepsis");
    expect(parsed.asked).toHaveLength(1);
    expect(parsed.testsOrdered).toEqual(["cbc"]);
    const result = await gradeAttempt(c, parsed);
    expect(result.history.covered.map((h) => h.id)).toEqual(["onset"]);
  });
});
