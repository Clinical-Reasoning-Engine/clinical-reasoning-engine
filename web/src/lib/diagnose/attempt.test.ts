import { describe, expect, it } from "vitest";

import { askedItemIds, canSubmit, emptyAttempt, offTopicCount, orderTest, parseAttempt, setPracticeMode } from "./attempt";

describe("attempt helpers", () => {
  const a = {
    ...emptyAttempt("sepsis"),
    asked: [
      { question: "When did it start?", reply: "…", speaker: "Daughter", itemId: "onset" },
      { question: "Favourite movie?", reply: "…", speaker: "Patient", itemId: null },
      { question: "How long has she been sick?", reply: "…", speaker: "Daughter", itemId: "onset" },
    ],
  };

  it("lists covered history items once each and counts off-topic questions", () => {
    expect(askedItemIds(a)).toEqual(["onset"]);
    expect(offTopicCount(a)).toBe(1);
  });

  it("orders a test only once", () => {
    const once = orderTest(a, "cbc");
    expect(orderTest(once, "cbc").testsOrdered).toEqual(["cbc"]);
  });

  it("needs all three differentials to submit", () => {
    expect(canSubmit(["Sepsis", "UTI", ""])).toBe(false);
    expect(canSubmit(["Sepsis", "UTI", "Flu"])).toBe(true);
  });
});

describe("parseAttempt", () => {
  it("starts fresh for missing, broken, or other-case data", () => {
    expect(parseAttempt(null, "sepsis")).toEqual(emptyAttempt("sepsis"));
    expect(parseAttempt("{not json", "sepsis")).toEqual(emptyAttempt("sepsis"));
    expect(parseAttempt(JSON.stringify(emptyAttempt("pneumonia")), "sepsis")).toEqual(emptyAttempt("sepsis"));
  });

  it("restores a saved attempt", () => {
    const saved = { ...emptyAttempt("sepsis"), testsOrdered: ["cbc"] };
    expect(parseAttempt(JSON.stringify(saved), "sepsis").testsOrdered).toEqual(["cbc"]);
  });
});

describe("practice mode", () => {
  it("is off by default and remembers that it was used, even after turning it off", () => {
    const start = emptyAttempt("sepsis");
    expect(start.practiceMode).toBe(false);
    const off = setPracticeMode(setPracticeMode(start, true), false);
    expect(off.practiceMode).toBe(false);
    expect(off.usedPracticeMode).toBe(true);
  });

  it("restores old saved attempts without the flags as practice mode off", () => {
    const old = JSON.stringify({ caseId: "sepsis", asked: [], testsOrdered: [], submission: null });
    expect(parseAttempt(old, "sepsis").usedPracticeMode).toBe(false);
  });
});
