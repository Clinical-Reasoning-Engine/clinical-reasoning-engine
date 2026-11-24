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

/** History sections tracked on the Work-up page (MVP-4). */
export type HistoryCategory = "hpi" | "pmh" | "family" | "social" | "ros";

/** One thing the patient (or family) can tell the student. */
export type HistoryItem = {
  id: string;
  /** "intro" items (greetings) are answered but not tracked or graded. */
  category: HistoryCategory | "intro";
  /** Short label for the tracker, e.g. "Onset" or "Allergies". */
  label: string;
  /**
   * Words or phrases that mean the student asked about this. Terms match whole
   * words; a trailing * matches the start of a word ("smok*" matches "smoker").
   */
  terms: string[];
  answer: string;
  speaker: "Patient" | "Daughter";
  /** Key items count toward the history score, like an OSCE checklist. */
  key: boolean;
  /** Why it matters, shown in Feedback if the student missed it. */
  why?: string;
};

/** A test the student can order. */
export type TestItem = {
  id: string;
  label: string;
  detail: string;
  /** What comes back, shown when the test is ordered. */
  result: string;
  source: Source;
};

/** A diagnosis the student can choose for the differential. */
export type DiagnosisOption = { id: string; label: string; synonyms: string[] };

/** What the rule-based grader compares the student's submission against. */
export type AnswerKey = {
  /** The real diagnosis (#1 in the key). */
  diagnosisId: string;
  diagnosisSource: Source;
  /** Close but incomplete answers for #1 (e.g. "pneumonia" without the sepsis). Half credit. */
  partialIds: string[];
  /** Reasonable alternatives that earn credit in slots #2 and #3. */
  alternativeIds: string[];
  /** Findings that support #1; each one mentioned earns credit. */
  supportingFindings: { label: string; terms: string[] }[];
  /** Tests in the key's work-up plan, each with where it came from. */
  plan: { testId: string; source: Source; why: string }[];
  teachingPoints: string[];
};

/**
 * The patient's chart, as the student would see it before walking in (MVP-2).
 * Like real charts it can be incomplete or out of date; `gaps` lists what it
 * gets wrong, so Results can credit students who checked with the patient.
 */
export type PatientChart = {
  source: Source;
  lastUpdated: string;
  problems: string[];
  medications: string[];
  allergies: string[];
  immunizations: string[];
  visits: { when: string; where: string; note: string }[];
  pastLabs: { when: string; results: string }[];
  gaps: {
    id: string;
    /** What the chart says vs. what is true. */
    label: string;
    /** Asking about this history item uncovers the gap. */
    historyItemId: string;
    why: string;
  }[];
};

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
  chart: PatientChart;
  history: HistoryItem[];
  tests: TestItem[];
  diagnoses: DiagnosisOption[];
  answerKey: AnswerKey;
};
