import { describe, expect, it } from "vitest";

import { stepHref, stepIndexForPath } from "./steps";

describe("stepHref", () => {
  it("builds the URL for each step", () => {
    expect(stepHref("sepsis", "intro")).toBe("/diagnose/sepsis");
    expect(stepHref("sepsis", "results")).toBe("/diagnose/sepsis/results");
  });
});

describe("stepIndexForPath", () => {
  it("finds the current step, ignoring a trailing slash", () => {
    expect(stepIndexForPath("/diagnose/sepsis", "sepsis")).toBe(0);
    expect(stepIndexForPath("/diagnose/sepsis/results/", "sepsis")).toBe(2);
  });

  it("returns -1 for other pages", () => {
    expect(stepIndexForPath("/diagnose/sepsis/unknown", "sepsis")).toBe(-1);
    expect(stepIndexForPath("/login", "sepsis")).toBe(-1);
  });
});
