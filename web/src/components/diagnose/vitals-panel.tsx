// A row of vital signs with LOW / HIGH flags against adult normal ranges.

import type { VitalKey } from "@/lib/diagnose/case-types";
import { VITAL_DISPLAY, formatVital, vitalStatus } from "@/lib/diagnose/vitals-display";

export function VitalsPanel({ values }: { values: Record<VitalKey, number> }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {VITAL_DISPLAY.map((v) => {
        const value = values[v.key];
        const status = vitalStatus(v, value);
        return (
          <div key={v.key} className="flex flex-col gap-1">
            <dt className="text-xs text-zinc-500">{v.label}</dt>
            <dd className="font-mono text-3xl font-semibold text-zinc-50">{formatVital(v.key, value)}</dd>
            <dd className="text-xs text-zinc-500">
              {v.unit}
              {status !== "normal" && (
                <span className="ml-2 font-semibold text-orange-400">{status === "low" ? "LOW" : "HIGH"}</span>
              )}
              <span className="ml-2 text-zinc-600">
                normal {v.normal[0]}–{v.normal[1]}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
