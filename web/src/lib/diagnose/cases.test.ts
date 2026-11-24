import { describe, expect, it } from "vitest";

import caseJson from "../../demo-case/sepsis-case.json";

import { chartForStudent, getDiagnoseCase } from "./cases";
import { DIAGNOSE_CASE_IDS } from "./steps";
import { VITAL_DISPLAY, formatVital, vitalStatus } from "./vitals-display";

describe("getDiagnoseCase", () => {
  it("has a case for every id the routes build", () => {
    for (const id of DIAGNOSE_CASE_IDS) expect(getDiagnoseCase(id)?.id).toBe(id);
  });

  it("returns null for an unknown id", () => {
    expect(getDiagnoseCase("pneumonia")).toBeNull();
  });
});

describe("sepsis Diagnose case", () => {
  const c = getDiagnoseCase("sepsis")!;

  it("uses the real age, sex and first-hour vitals from the demo extract", () => {
    expect(c.patient.age).toBe(caseJson.patient.age);
    expect(c.patient.sex).toBe(caseJson.patient.sex);
    expect(c.openingVitals.values).toEqual(caseJson.start);
    expect(c.patient.source).toBe("mimic-demo");
    expect(c.openingVitals.source).toBe("mimic-demo");
  });

  it("labels the made-up parts as written by the team", () => {
    expect(c.chiefComplaint.source).toBe("team");
    expect(c.setting.source).toBe("team");
  });

  it("doesn't give the diagnosis away on the Patient page", () => {
    const shown = `${c.title} ${c.chiefComplaint.text} ${c.setting.text}`.toLowerCase();
    for (const word of ["sepsis", "septic", "pneumonia", "shock"]) expect(shown).not.toContain(word);
  });
});

describe("vitals display", () => {
  it("formats temperature with one decimal and the rest as whole numbers", () => {
    expect(formatVital("temp_f", 101.73)).toBe("101.7");
    expect(formatVital("hr", 116.6)).toBe("117");
  });

  it("flags vitals outside the normal range", () => {
    const map = VITAL_DISPLAY.find((v) => v.key === "map")!;
    expect(vitalStatus(map, 58)).toBe("low");
    expect(vitalStatus(map, 80)).toBe("normal");
  });
});

describe("patient chart", () => {
  const c = getDiagnoseCase("sepsis")!;
  const historyIds = new Set(c.history.map((h) => h.id));

  it("is labelled as written by the team", () => {
    expect(c.chart.source).toBe("team");
  });

  it("links every deliberate gap to a history item that uncovers it", () => {
    expect(c.chart.gaps.length).toBeGreaterThan(0);
    for (const gap of c.chart.gaps) expect(historyIds.has(gap.historyItemId)).toBe(true);
  });

  it("really disagrees with the history on allergies", () => {
    const allergyAnswer = c.history.find((h) => h.id === "allergies")!.answer.toLowerCase();
    expect(allergyAnswer).toContain("penicillin");
    expect(c.chart.allergies.join(" ").toLowerCase()).not.toContain("penicillin");
  });

  it("never sends the gaps to the browser", () => {
    expect("gaps" in chartForStudent(c.chart)).toBe(false);
  });
});
