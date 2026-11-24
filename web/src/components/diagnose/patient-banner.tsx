// The strip pinned to the top of every case step, like the patient banner in
// a hospital record: who the patient is, why they're here, and their vitals,
// so the student never has to scroll back to check them.

import type { VitalKey } from "@/lib/diagnose/case-types";
import { VITAL_DISPLAY, formatVital, vitalStatus } from "@/lib/diagnose/vitals-display";

export function PatientBanner({
  patientLine,
  title,
  vitals,
}: {
  patientLine: string;
  title: string;
  vitals: Record<VitalKey, number>;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
      <div className="min-w-0">
        <p className="font-semibold text-zinc-50">{patientLine}</p>
        <p className="text-sm text-zinc-400">{title}</p>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Opening vitals">
        {VITAL_DISPLAY.map((v) => {
          const value = vitals[v.key];
          const status = vitalStatus(v, value);
          return (
            <li
              key={v.key}
              title={`${v.label}: ${formatVital(v.key, value)} ${v.unit} (normal ${v.normal[0]}–${v.normal[1]})`}
              className={
                "flex items-baseline gap-1 rounded-md border px-2 py-0.5 text-sm " +
                (status === "normal" ? "border-zinc-800 text-zinc-200" : "border-orange-900/70 bg-orange-950/30 text-orange-200")
              }
            >
              <span className="text-xs text-zinc-500">{v.short}</span>
              <span className="font-semibold tabular-nums">{formatVital(v.key, value)}</span>
              {status !== "normal" && (
                <span className="text-orange-400" aria-label={status}>
                  {status === "high" ? "↑" : "↓"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
