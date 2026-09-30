import { describe, expect, it } from "vitest";
import { classifyVital } from "./vitals";

describe("classifyVital", () => {
  it("returns normal inside the range", () => {
    expect(classifyVital(80, 60, 100)).toBe("normal");
  });

  it("returns low below the range and high above it", () => {
    expect(classifyVital(45, 60, 100)).toBe("low");
    expect(classifyVital(130, 60, 100)).toBe("high");
  });

  it("treats the range edges as normal", () => {
    expect(classifyVital(60, 60, 100)).toBe("normal");
    expect(classifyVital(100, 60, 100)).toBe("normal");
  });

  it("rejects an inverted range", () => {
    expect(() => classifyVital(80, 100, 60)).toThrow();
  });
});
