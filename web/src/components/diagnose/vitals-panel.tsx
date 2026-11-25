// Vital signs with LOW / HIGH flags against adult normal ranges.

import type { VitalKey } from "@/lib/diagnose/case-types";
import { VITAL_DISPLAY, formatVital, vitalStatus } from "@/lib/diagnose/vitals-display";

export function VitalsPanel({ values }: { values: Record<VitalKey, number> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
      {VITAL_DISPLAY.map((v) => {
        const value = values[v.key];
        const status = vitalStatus(v, value);
        return (
          <div key={v.key} className="flex flex-col">
            <dt className="text-xs text-zinc-400">{v.label}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums text-zinc-50">{formatVital(v.key, value)}</span>
              <span className="text-xs text-zinc-500">{v.unit}</span>
              {status !== "normal" && (
                <span className="text-xs font-semibold text-orange-400">{status === "low" ? "Low" : "High"}</span>
              )}
            </dd>
            <dd className="text-[11px] text-zinc-600">
              Normal {v.normal[0]}–{v.normal[1]}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
