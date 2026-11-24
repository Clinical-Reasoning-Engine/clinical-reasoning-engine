// The shape of one Diagnose-mode case. Every case (sepsis now; pneumonia,
// heart failure, ... later) is plain data in this shape, so the pages never
// need to know which condition they are showing.

/**
 * Where a piece of case information came from. We show this next to the
 * information, so students (and graders) can tell real data from what the
 * team wrote to fill gaps in the record.
 */
export type Source = "mimic-demo" | "team";

export const SOURCE_LABELS: Record<Source, string> = {
  "mimic-demo": "Real record (MIMIC-IV demo)",
  team: "Written by the team",
};

export type VitalKey = "hr" | "map" | "rr" | "spo2" | "temp_f";

export type DiagnoseCase = {
  id: string;
  /** Short title shown on the Patient page, e.g. "Cough, fever and confusion". */
  title: string;
  patient: { age: number; sex: "F" | "M"; source: Source };
  /** What the patient (or family) says brought them in, in their own words. */
  chiefComplaint: { text: string; source: Source };
  /** Where and how the student meets the patient. */
  setting: { text: string; source: Source };
  /** First set of vitals the student sees. */
  openingVitals: { values: Record<VitalKey, number>; note: string; source: Source };
};
