// Pure logic for the sepsis walkthrough: which branch of the precomputed
// trajectory tree the student is on, and how the debrief scores their choices.
// No React here, so it is easy to unit-test.

export type Vitals = { hr: number; map: number; rr: number; spo2: number; temp_f: number };
export type Action = "none" | "fluids" | "pressor";

/** [anonymous stay label, hour, distance] for one matched real moment. */
export type MatchRecord = [string, number, number];

export type TreeNode = { state: Vitals; matches: MatchRecord[] };

export type CaseData = {
  source: { dataset: string; url: string; license: string; citation: string };
  matching: {
    method: string;
    k: number;
    sepsis_stays: number;
    moments_by_action: Record<Action, number>;
    index_stay_excluded: boolean;
  };
  patient: { age: number; sex: string; case_stay: string };
  labs: Record<string, { value: number; unit: string }>;
  start: Vitals;
  tree: Record<string, TreeNode>;
  real_course: { hour: number; state: Vitals; action: Action; antibiotic_started: boolean }[];
};

/** One hour the student has lived through: what they ordered and when. */
export type HourLog = { hour: number; orders: string[]; action: Action };

/**
 * The matching action for an hour. A running vasopressor wins (matched real
 * hours on a pressor usually include fluids too); otherwise a new fluid bolus;
 * otherwise nothing.
 */
export function actionForHour(pressorRunning: boolean, bolusThisHour: boolean): Action {
  if (pressorRunning) return "pressor";
  if (bolusThisHour) return "fluids";
  return "none";
}

/** Tree key for a list of actions, e.g. ["fluids", "pressor"] -> "fluids/pressor". */
export function pathKey(actions: Action[]): string {
  return actions.join("/");
}

export function nodeFor(data: CaseData, actions: Action[]): TreeNode {
  const node = data.tree[pathKey(actions)];
  if (!node) throw new Error(`no precomputed state for path "${pathKey(actions)}"`);
  return node;
}

/** Vitals at every hour along the student's path, starting at hour 0. */
export function trajectory(data: CaseData, actions: Action[]): Vitals[] {
  return [data.start, ...actions.map((_, i) => nodeFor(data, actions.slice(0, i + 1)).state)];
}

export type Check = { label: string; passed: boolean; detail: string };

/** First hour (0-based) an order was placed, or null. */
export function firstHour(log: HourLog[], order: string): number | null {
  const entry = log.find((h) => h.orders.includes(order));
  return entry ? entry.hour : null;
}

export function scoreDecisions(log: HourLog[], vitals: Vitals[]): Check[] {
  const abx = firstHour(log, "antibiotics");
  const cultures = firstHour(log, "cultures");
  const fluids = firstHour(log, "fluids");
  const pressor = firstHour(log, "norepinephrine");
  const mapGoal = vitals.findIndex((v) => v.map >= 65);
  const lowAtStart = vitals[0].map < 65;

  return [
    {
      label: "Antibiotics in the first hour",
      passed: abx !== null && abx === 0,
      detail: abx === null ? "Antibiotics were never started." : `Started at hour ${abx}.`,
    },
    {
      label: "Blood cultures before antibiotics",
      passed: cultures !== null && (abx === null || cultures <= abx),
      detail:
        cultures === null
          ? "No blood cultures were drawn."
          : abx !== null && cultures > abx
            ? "Cultures were drawn after antibiotics, which can hide the organism."
            : "Cultures were drawn first.",
    },
    {
      label: "Fluids within the first 3 hours",
      passed: fluids !== null && fluids <= 2,
      detail: fluids === null ? "No fluid bolus was given." : `First bolus at hour ${fluids}.`,
    },
    {
      label: "Vasopressor for persistent low MAP",
      passed: !lowAtStart || pressor !== null,
      detail: pressor === null ? "Norepinephrine was not started." : `Norepinephrine started at hour ${pressor}.`,
    },
    {
      label: "MAP reached 65 mmHg",
      passed: mapGoal >= 0,
      detail: mapGoal >= 0 ? `MAP reached 65 at hour ${mapGoal}.` : "MAP stayed below 65 for the whole case.",
    },
  ];
}
