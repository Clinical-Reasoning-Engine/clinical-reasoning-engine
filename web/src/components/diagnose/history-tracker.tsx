"use client";

// History tracker (MVP-4). By default it works like your notes: a topic shows
// up under its section only after you've asked about it, so it can't be read
// as a list of questions to ask. Practice mode shows the full checklist for
// beginners learning the structure; Results notes that it was used.

import { askedItemIds, setPracticeMode } from "@/lib/diagnose/attempt";
import type { HistoryItem } from "@/lib/diagnose/case-types";
import { CATEGORY_LABELS, trackerView } from "@/lib/diagnose/history";

import { useAttempt } from "./attempt-provider";

export function HistoryTracker({ history }: { history: HistoryItem[] }) {
  const { attempt, update } = useAttempt();
  const practice = attempt.practiceMode;
  const groups = trackerView(history, askedItemIds(attempt), practice);

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-200">{practice ? "History checklist" : "Your history notes"}</h2>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={practice}
            onChange={(e) => update((a) => setPracticeMode(a, e.target.checked))}
            className="mt-0.5 accent-teal-500"
          />
          <span>
            Practice mode: show the full checklist
            {attempt.usedPracticeMode && <span className="block text-zinc-500">Results will note that you used it.</span>}
          </span>
        </label>
      </div>

      {groups.map((g) => {
        const done = g.items.filter((i) => i.asked).length;
        return (
          <section key={g.category} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xs font-medium text-zinc-300">{CATEGORY_LABELS[g.category]}</h3>
              {practice && (
                <span className="text-xs text-zinc-500">
                  {done}/{g.items.length}
                </span>
              )}
            </div>
            {g.items.length === 0 ? (
              <p className="text-xs text-zinc-600">Nothing yet</p>
            ) : (
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
            )}
          </section>
        );
      })}
    </aside>
  );
}
