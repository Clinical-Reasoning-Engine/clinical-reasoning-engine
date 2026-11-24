"use client";

// Submit 3 ranked differentials, the findings that support #1, and the work-up
// plan (MVP-6). The plan is the set of tests ordered on the Tests tab.

import { useRouter } from "next/navigation";
import { useState } from "react";

import { canSubmit } from "@/lib/diagnose/attempt";
import type { DiagnosisOption, TestItem } from "@/lib/diagnose/case-types";
import { stepHref } from "@/lib/diagnose/steps";

import { useAttempt } from "./attempt-provider";

const RANK_LABELS = ["#1 Most likely (your diagnosis)", "#2", "#3"];

export function DifferentialForm({
  caseId,
  diagnoses,
  tests,
  onGoToTests,
}: {
  caseId: string;
  diagnoses: DiagnosisOption[];
  tests: TestItem[];
  onGoToTests: () => void;
}) {
  const { attempt, update } = useAttempt();
  const router = useRouter();
  const saved = attempt.submission;
  const [differentials, setDifferentials] = useState<string[]>(saved?.differentials ?? ["", "", ""]);
  const [findings, setFindings] = useState(saved?.supportingFindings ?? "");
  const [planNote, setPlanNote] = useState(saved?.planNote ?? "");
  const ordered = tests.filter((t) => attempt.testsOrdered.includes(t.id));
  const locked = saved !== null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit(differentials) || locked) return;
    update((a) => ({
      ...a,
      submission: {
        differentials: [differentials[0].trim(), differentials[1].trim(), differentials[2].trim()],
        supportingFindings: findings.trim(),
        planNote: planNote.trim(),
        submittedAt: new Date().toISOString(),
      },
    }));
    router.push(stepHref(caseId, "feedback"));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <datalist id="diagnosis-options">
        {diagnoses.map((d) => (
          <option key={d.id} value={d.label} />
        ))}
      </datalist>

      <fieldset disabled={locked} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <legend className="px-1 text-sm font-semibold text-zinc-200">Differential diagnosis (ranked)</legend>
        {RANK_LABELS.map((label, i) => (
          <label key={label} className="flex flex-col gap-1 text-sm text-zinc-300">
            {label}
            <input
              list="diagnosis-options"
              value={differentials[i]}
              onChange={(e) => setDifferentials((d) => d.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder="Start typing or pick from the list"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Findings that support #1
          <textarea
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            rows={3}
            placeholder="History, vitals and results that point to your #1"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none"
          />
        </label>
      </fieldset>

      <fieldset disabled={locked} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <legend className="px-1 text-sm font-semibold text-zinc-200">Work-up plan</legend>
        {ordered.length === 0 ? (
          <p className="text-sm text-orange-300">
            You haven&apos;t ordered any tests yet.{" "}
            <button type="button" onClick={onGoToTests} className="underline">
              Go to Tests
            </button>
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {ordered.map((t) => (
              <li key={t.id} className="rounded-full border border-teal-800 px-3 py-1 text-sm text-teal-200">
                {t.label}
              </li>
            ))}
          </ul>
        )}
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Anything else in your plan? (optional, not scored yet)
          <textarea
            value={planNote}
            onChange={(e) => setPlanNote(e.target.value)}
            rows={2}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-teal-400 focus:outline-none"
          />
        </label>
      </fieldset>

      {locked ? (
        <button
          type="button"
          onClick={() => router.push(stepHref(caseId, "feedback"))}
          className="self-start rounded-xl bg-teal-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-teal-400"
        >
          See feedback
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={!canSubmit(differentials)}
            className="self-start rounded-xl bg-teal-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40"
          >
            Submit for feedback
          </button>
          <p className="text-xs text-zinc-500">Fill in all three differentials to submit. You can&apos;t change answers afterwards.</p>
        </div>
      )}
    </form>
  );
}
