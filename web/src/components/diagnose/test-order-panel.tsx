"use client";

// Order tests and see results (MVP-5). Results that are in the real record are
// labelled as such; the rest are written by the team.

import { orderTest } from "@/lib/diagnose/attempt";
import type { TestItem } from "@/lib/diagnose/case-types";

import { useAttempt } from "./attempt-provider";
import { SourceTag } from "./source-tag";

export function TestOrderPanel({ tests, locked }: { tests: TestItem[]; locked: boolean }) {
  const { attempt, update } = useAttempt();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">
        Order what you would want for this patient. Everything you order becomes your work-up plan, so choose with
        purpose.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => {
          const ordered = attempt.testsOrdered.includes(t.id);
          return (
            <li
              key={t.id}
              className={
                "flex flex-col gap-2 rounded-2xl border p-4 " +
                (ordered ? "border-teal-800 bg-teal-950/40" : "border-zinc-800 bg-zinc-900")
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-100">{t.label}</p>
                  <p className="text-xs text-zinc-500">{t.detail}</p>
                </div>
                <button
                  onClick={() => update((a) => orderTest(a, t.id))}
                  disabled={ordered || locked}
                  className="shrink-0 rounded-lg border border-zinc-600 px-3 py-1 text-sm text-zinc-100 hover:border-teal-400 disabled:border-teal-800 disabled:text-teal-300"
                >
                  {ordered ? "✓ Ordered" : "Order"}
                </button>
              </div>
              {ordered && (
                <div className="flex flex-col gap-1 rounded-lg bg-black p-2">
                  <p className="font-mono text-sm text-zinc-100">{t.result}</p>
                  <SourceTag source={t.source} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
