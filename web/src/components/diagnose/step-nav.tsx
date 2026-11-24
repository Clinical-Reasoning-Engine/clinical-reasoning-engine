"use client";

// Progress bar across the top of the Diagnose flow. It only shows where you
// are; it isn't a set of links, so a student can't skip ahead to Feedback.

import { usePathname } from "next/navigation";

import { DIAGNOSE_STEPS, stepIndexForPath } from "@/lib/diagnose/steps";

export function StepNav({ caseId }: { caseId: string }) {
  const current = stepIndexForPath(usePathname(), caseId);

  return (
    <ol className="flex gap-2 text-xs">
      {DIAGNOSE_STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={
              "flex-1 rounded-full border px-3 py-1 text-center " +
              (state === "current"
                ? "border-teal-400 bg-teal-950 font-semibold text-teal-200"
                : state === "done"
                  ? "border-teal-800 text-teal-400"
                  : "border-zinc-800 text-zinc-500")
            }
          >
            {i + 1}. {step.label}
          </li>
        );
      })}
    </ol>
  );
}
