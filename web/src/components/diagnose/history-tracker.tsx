"use client";

// Checklist of history sections (MVP-4): lights up each topic once asked, so
// the student can see gaps in HPI/OPQRST, PMH, family, social and ROS.

import { askedItemIds } from "@/lib/diagnose/attempt";
import type { HistoryItem } from "@/lib/diagnose/case-types";
import { CATEGORY_LABELS, coverage } from "@/lib/diagnose/history";

import { useAttempt } from "./attempt-provider";

export function HistoryTracker({ history }: { history: HistoryItem[] }) {
  const { attempt } = useAttempt();
  const groups = coverage(history, askedItemIds(attempt));

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">History tracker</h2>
      {groups.map((g) => {
        const done = g.items.filter((i) => i.asked).length;
        return (
          <section key={g.category} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xs font-medium text-zinc-300">{CATEGORY_LABELS[g.category]}</h3>
              <span className="text-xs text-zinc-500">
                {done}/{g.items.length}
              </span>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {g.items.map((i) => (
                <li
                  key={i.id}
                  className={
                    "rounded-full border px-2 py-0.5 text-[11px] " +
                    (i.asked ? "border-teal-700 bg-teal-950 text-teal-200" : "border-zinc-700 text-zinc-500")
                  }
                >
                  {i.asked ? "✓ " : ""}
                  {i.label}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </aside>
  );
}
