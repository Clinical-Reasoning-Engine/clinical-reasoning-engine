// How each vital is labelled and what counts as normal (adult reference
// ranges, the same ones the Manage-mode POC uses). Pure data + helpers.

import { classifyVital, type VitalStatus } from "../vitals";

import type { VitalKey } from "./case-types";

export type VitalDisplay = { key: VitalKey; label: string; unit: string; normal: [number, number] };

export const VITAL_DISPLAY: VitalDisplay[] = [
  { key: "hr", label: "Heart rate", unit: "bpm", normal: [60, 100] },
  { key: "map", label: "Mean arterial pressure", unit: "mmHg", normal: [65, 110] },
  { key: "rr", label: "Respiratory rate", unit: "/min", normal: [12, 20] },
  { key: "spo2", label: "SpO₂", unit: "%", normal: [94, 100] },
  { key: "temp_f", label: "Temperature", unit: "°F", normal: [97, 100.4] },
];

/** Value as shown on screen: temperature keeps one decimal, the rest are whole numbers. */
export function formatVital(key: VitalKey, value: number): string {
  return key === "temp_f" ? value.toFixed(1) : String(Math.round(value));
}

export function vitalStatus(display: VitalDisplay, value: number): VitalStatus {
  return classifyVital(value, display.normal[0], display.normal[1]);
}
