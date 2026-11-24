import { describe, expect, it } from "vitest";

import { sepsisDiagnoseCase } from "../../demo-case/diagnose-sepsis";

import { askPatient, coverage, normalize, OFF_TOPIC_REPLIES, termMatches } from "./history";

const items = sepsisDiagnoseCase.history;
const matchId = (q: string) => {
  const r = askPatient(items, q);
  return r.matched ? r.item.id : null;
};

describe("termMatches", () => {
  it("matches whole words by default", () => {
    expect(termMatches(normalize("Hi there"), "hi")).toBe(true);
    expect(termMatches(normalize("Tell me her history"), "hi")).toBe(false);
  });

  it("matches word starts when the term ends with *", () => {
    expect(termMatches(normalize("Is she a smoker?"), "smok*")).toBe(true);
    expect(termMatches(normalize("Any non-smoking?"), "smok*")).toBe(true);
    expect(termMatches(normalize("Unsmoked"), "smok*")).toBe(false);
  });
});

describe("askPatient on the sepsis case", () => {
  it.each([
    ["When did this start?", "onset"],
    ["How long has she been sick?", "onset"],
    ["Is the cough productive?", "quality"],
    ["Are you coughing anything up?", "quality"],
    ["Any chest pain?", "region"],
    ["Is it getting worse?", "timing"],
    ["Any fevers or chills?", "fever"],
    ["Are you short of breath?", "breathing"],
    ["Is she usually confused like this?", "baseline"],
    ["Does she have any medical problems?", "pmh"],
    ["What medications does she take?", "meds"],
    ["Any allergies?", "allergies"],
    ["Any family history of lung disease?", "family"],
    ["Do you smoke?", "smoking"],
    ["How long have you smoked?", "smoking"],
    ["Does she drink alcohol?", "alcohol"],
    ["Has she been eating and drinking?", "intake"],
    ["Is she drinking fluids?", "intake"],
    ["Where does she live?", "living"],
    ["Has anyone around her been sick?", "living"],
    ["Any burning when you urinate?", "urinary"],
    ["Any nausea or vomiting?", "gi"],
    ["Hello!", "greeting"],
  ])("“%s” → %s", (question, expected) => {
    expect(matchId(question)).toBe(expected);
  });

  it("gives an off-topic reply when nothing matches, alternating between replies", () => {
    const first = askPatient(items, "What's your favourite movie?", 0);
    const second = askPatient(items, "Do you like pizza?", 1);
    expect(first.matched).toBe(false);
    expect(first.text).toBe(OFF_TOPIC_REPLIES[0]);
    expect(second.text).toBe(OFF_TOPIC_REPLIES[1]);
  });
});

describe("sepsis history bank", () => {
  it("has unique ids, and every key item explains why it matters", () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of items.filter((x) => x.key)) expect(i.why).toBeTruthy();
  });

  it("covers every tracked history section", () => {
    for (const group of coverage(items, [])) expect(group.items.length).toBeGreaterThan(0);
  });
});

describe("coverage", () => {
  it("marks asked items and leaves the greeting out of the tracker", () => {
    const groups = coverage(items, ["onset", "allergies", "greeting"]);
    const flat = groups.flatMap((g) => g.items);
    expect(flat.find((i) => i.id === "onset")?.asked).toBe(true);
    expect(flat.find((i) => i.id === "meds")?.asked).toBe(false);
    expect(flat.some((i) => i.id === "greeting")).toBe(false);
  });
});
