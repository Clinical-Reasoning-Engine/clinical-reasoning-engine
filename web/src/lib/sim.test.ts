import { describe, expect, it } from "vitest";

import caseJson from "../demo-case/sepsis-case.json";

import { actionForHour, firstHour, pathKey, scoreDecisions, trajectory, type CaseData, type Vitals } from "./sim";

const data = caseJson as unknown as CaseData;
const v = (map: number): Vitals => ({ hr: 110, map, rr: 24, spo2: 95, temp_f: 101 });

describe("actionForHour", () => {
  it("lets a running pressor win over a bolus", () => {
    expect(actionForHour(true, true)).toBe("pressor");
    expect(actionForHour(false, true)).toBe("fluids");
    expect(actionForHour(false, false)).toBe("none");
  });
});

describe("precomputed case tree", () => {
  it("has a state for every path up to six hours", () => {
    const actions = ["none", "fluids", "pressor"] as const;
    let paths: string[][] = [[]];
    for (let h = 0; h < 6; h++) {
      paths = paths.flatMap((p) => actions.map((a) => [...p, a]));
      for (const p of paths) expect(data.tree[pathKey(p as never)]).toBeDefined();
    }
  });

  it("returns one vitals row per hour, starting at the real start", () => {
    const path = trajectory(data, ["fluids", "pressor"]);
    expect(path).toHaveLength(3);
    expect(path[0]).toEqual(data.start);
  });
});

describe("scoreDecisions", () => {
  it("passes a textbook first hour", () => {
    const log = [
      { hour: 0, orders: ["cultures", "antibiotics", "fluids", "norepinephrine"], action: "pressor" as const },
    ];
    const checks = scoreDecisions(log, [v(58), v(66)]);
    expect(checks.every((c) => c.passed)).toBe(true);
  });

  it("flags cultures drawn after antibiotics and a MAP that never recovers", () => {
    const log = [
      { hour: 0, orders: ["antibiotics"], action: "none" as const },
      { hour: 1, orders: ["cultures"], action: "none" as const },
    ];
    const checks = scoreDecisions(log, [v(58), v(57), v(56)]);
    const byLabel = Object.fromEntries(checks.map((c) => [c.label, c.passed]));
    expect(byLabel["Blood cultures before antibiotics"]).toBe(false);
    expect(byLabel["MAP reached 65 mmHg"]).toBe(false);
    expect(byLabel["Vasopressor for persistent low MAP"]).toBe(false);
  });

  it("finds the first hour an order was placed", () => {
    const log = [
      { hour: 0, orders: [], action: "none" as const },
      { hour: 1, orders: ["fluids"], action: "fluids" as const },
      { hour: 2, orders: ["fluids"], action: "fluids" as const },
    ];
    expect(firstHour(log, "fluids")).toBe(1);
    expect(firstHour(log, "antibiotics")).toBeNull();
  });
});
