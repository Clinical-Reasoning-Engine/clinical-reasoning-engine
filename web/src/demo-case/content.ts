// Case content for the sepsis POC.
//
// The vitals come from real ICU data (see sepsis-case.json). Everything in this
// file — the story, the answers, the X-ray result, the teaching points — is
// written by the team, loosely based on the real stay's coded diagnoses
// (septic shock, pneumonia, confusion, low sodium). It is an educational
// simulation, not medical advice, and still needs review by a medical student.

export type Speaker = "Patient" | "Daughter" | "Nurse";

export type Question = {
  id: string;
  text: string;
  speaker: Speaker;
  answer: string;
  /** Key questions are scored in the debrief, like an OSCE checklist. */
  key: boolean;
  why?: string;
};

export type OrderId = "cultures" | "lactate" | "antibiotics" | "fluids" | "norepinephrine" | "xray";

export type Order = {
  id: OrderId;
  label: string;
  detail: string;
  /** Shown in the nurse feed when the order is placed. */
  result: string;
};

export const CASE_TITLE = "Fever, cough and confusion";

export const PRESENTATION =
  "An 80-year-old woman is brought in by her daughter after two days of cough and fever. " +
  "This morning she was confused and could not get out of bed. Her blood pressure was low " +
  "in the emergency department, and she has just arrived in the medical ICU.";

export const QUESTIONS: Question[] = [
  {
    id: "onset",
    text: "When did this start?",
    speaker: "Daughter",
    answer: "Two days ago she started coughing and said she felt hot. This morning she didn't know where she was.",
    key: true,
    why: "Timeline: an acute illness over days points to infection.",
  },
  {
    id: "breathing",
    text: "Any cough or trouble breathing?",
    speaker: "Patient",
    answer: "Can't… catch my breath. Coughing up yellow stuff.",
    key: true,
    why: "Finds the likely source: a productive cough suggests pneumonia.",
  },
  {
    id: "baseline",
    text: "Is she normally confused like this?",
    speaker: "Daughter",
    answer: "No. She lives alone and does her own shopping. This is not like her at all.",
    key: true,
    why: "New confusion is a sign of organ dysfunction in sepsis.",
  },
  {
    id: "urine",
    text: "How much urine has she made?",
    speaker: "Nurse",
    answer: "Only about 20 mL in the last hour.",
    key: true,
    why: "Low urine output means the kidneys are not getting enough blood flow.",
  },
  {
    id: "allergies",
    text: "Any allergies?",
    speaker: "Daughter",
    answer: "Penicillin gave her a rash years ago.",
    key: true,
    why: "Changes which antibiotic is safe to start.",
  },
  {
    id: "meds",
    text: "What medications does she take?",
    speaker: "Daughter",
    answer: "A blood pressure pill every morning and a baby aspirin.",
    key: false,
    why: "Blood pressure pills should be held while she is hypotensive.",
  },
  {
    id: "intake",
    text: "Has she been eating and drinking?",
    speaker: "Daughter",
    answer: "Barely anything since yesterday.",
    key: false,
  },
  {
    id: "pain",
    text: "Any burning when you pee, or belly pain?",
    speaker: "Patient",
    answer: "No… no.",
    key: false,
    why: "Helps rule out a urinary or abdominal source.",
  },
];

export const ORDERS: Order[] = [
  {
    id: "cultures",
    label: "Blood cultures ×2",
    detail: "Draw before antibiotics",
    result: "Blood cultures drawn from two sites. Results take 24–48 hours.",
  },
  {
    id: "lactate",
    label: "Lactate",
    detail: "Marker of poor tissue perfusion",
    result: "Lactate is back: 1.6 mmol/L.",
  },
  {
    id: "xray",
    label: "Chest X-ray",
    detail: "Portable",
    result: "Chest X-ray: patchy opacity in the right lower lobe, consistent with pneumonia.",
  },
  {
    id: "antibiotics",
    label: "Broad-spectrum antibiotics",
    detail: "Penicillin-allergy safe",
    result: "IV antibiotics are running.",
  },
  {
    id: "fluids",
    label: "IV fluid bolus",
    detail: "Crystalloid, 30 mL/kg",
    result: "Fluid bolus is running.",
  },
  {
    id: "norepinephrine",
    label: "Start norepinephrine",
    detail: "Vasopressor, target MAP ≥ 65",
    result: "Norepinephrine drip started.",
  },
];

export const DIAGNOSES = [
  { id: "septic-shock-pneumonia", label: "Septic shock from pneumonia", correct: true },
  { id: "hypovolemic", label: "Hypovolemic shock from dehydration", correct: false },
  { id: "cardiogenic", label: "Cardiogenic shock", correct: false },
  { id: "pe", label: "Pulmonary embolism", correct: false },
] as const;

export const TEACHING_POINTS = [
  "Sepsis is a dysregulated response to infection. Inflammation dilates blood vessels and makes them leaky, so blood pressure falls even though the heart is pumping hard.",
  "That is why the heart rate is high and the MAP is low: the heart speeds up to make up for vessels that have lost their tone.",
  "Fluids refill the leaky circulation; a vasopressor like norepinephrine tightens the vessels again when fluids alone do not bring MAP to 65.",
  "Antibiotics treat the cause. Every hour of delay in septic shock is linked to worse outcomes, so cultures first, then antibiotics within the first hour.",
];
