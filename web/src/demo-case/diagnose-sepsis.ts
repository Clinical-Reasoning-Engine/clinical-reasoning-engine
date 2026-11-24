// Diagnose-mode version of the sepsis case.
//
// Real (from sepsis-case.json, built from the open-access MIMIC-IV demo):
// age, sex and the first hour of vitals.
// Written by the team: the chief complaint and the setting. The demo has no
// clinical notes, so these are made up to fit the real stay's coded diagnoses
// (septic shock, pneumonia, confusion). Educational simulation, not medical advice.

import type { DiagnoseCase } from "@/lib/diagnose/case-types";
import type { CaseData } from "@/lib/sim";

import caseJson from "./sepsis-case.json";

const data = caseJson as unknown as CaseData;

export const sepsisDiagnoseCase: DiagnoseCase = {
  id: "sepsis",
  title: "Cough, fever and confusion",
  patient: { age: data.patient.age, sex: data.patient.sex === "F" ? "F" : "M", source: "mimic-demo" },
  chiefComplaint: {
    text: "“She's been coughing and feverish for two days, and this morning she didn't know where she was.” (her daughter)",
    source: "team",
  },
  setting: {
    text: "Her daughter brought her to the emergency department. You are the first student to see her.",
    source: "team",
  },
  openingVitals: {
    values: { ...data.start },
    note: "First charted hour of the real ICU stay. The extract has mean arterial pressure, not systolic/diastolic.",
    source: "mimic-demo",
  },
};
