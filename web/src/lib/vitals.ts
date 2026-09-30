// Starter helper so CI has a real unit test from day one.
// Replace or extend once the case/vitals data model is designed.

export type VitalStatus = "low" | "normal" | "high";

/** Classify a numeric vital against an inclusive normal range. */
export function classifyVital(value: number, min: number, max: number): VitalStatus {
  if (min > max) throw new Error("min must be <= max");
  if (value < min) return "low";
  if (value > max) return "high";
  return "normal";
}
