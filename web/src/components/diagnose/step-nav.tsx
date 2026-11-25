"use client";

// Where you are in the case: Patient → Work-up → Results. It shows progress
// only; it isn't a set of links, so a student can't skip ahead to Results.

import { usePathname } from "next/navigation";

import { DIAGNOSE_STEPS, stepIndexForPath } from "@/lib/diagnose/steps";

export function StepNav({ caseId }: { caseId: string }) {
  const current = stepIndexForPath(usePathname(), caseId);

  return (
    <ol className="flex items-center gap-1 text-sm" aria-label="Case progress">
      {DIAGNOSE_STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={step.id} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true" className="px-1 text-zinc-700">›</span>}
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 " +
                (state === "current"
                  ? "bg-teal-500/15 font-semibold text-teal-200 ring-1 ring-teal-500/50"
                  : state === "done"
                    ? "text-teal-400"
                    : "text-zinc-500")
              }
            >
              <span
                className={
                  "grid size-5 place-items-center rounded-full text-[11px] " +
                  (state === "todo" ? "border border-zinc-700" : "bg-teal-500 text-zinc-950")
                }
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
