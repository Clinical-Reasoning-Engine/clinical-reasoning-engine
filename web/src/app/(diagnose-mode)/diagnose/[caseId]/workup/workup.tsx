"use client";

// The Work-up step: three tabs (History, Tests, Submit) over one shared attempt.

import { useState } from "react";

import { useAttempt } from "@/components/diagnose/attempt-provider";
import { DifferentialForm } from "@/components/diagnose/differential-form";
import { HistoryChat } from "@/components/diagnose/history-chat";
import { HistoryTracker } from "@/components/diagnose/history-tracker";
import { TestOrderPanel } from "@/components/diagnose/test-order-panel";
import type { DiagnosisOption, HistoryItem, TestItem } from "@/lib/diagnose/case-types";

type Tab = "history" | "tests" | "submit";

export function Workup({
  caseId,
  title,
  history,
  tests,
  diagnoses,
}: {
  caseId: string;
  title: string;
  history: HistoryItem[];
  tests: TestItem[];
  diagnoses: DiagnosisOption[];
}) {
  const { attempt, reset } = useAttempt();
  const [tab, setTab] = useState<Tab>("history");
  const locked = attempt.submission !== null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "history", label: "History" },
    { id: "tests", label: attempt.testsOrdered.length ? `Tests (${attempt.testsOrdered.length})` : "Tests" },
    { id: "submit", label: "Diagnosis & plan" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Work-up: {title}</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Work-up steps" className="flex gap-1 rounded-xl bg-zinc-900 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded-lg px-4 py-1.5 text-sm " +
                (tab === t.id ? "bg-zinc-800 font-semibold text-zinc-50" : "text-zinc-400 hover:text-zinc-200")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        {(attempt.asked.length > 0 || attempt.testsOrdered.length > 0 || locked) && (
          <button
            onClick={() => {
              if (window.confirm("Start this case over? Your questions, tests and answers will be cleared.")) reset();
            }}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-400"
          >
            Start over
          </button>
        )}
      </div>

      {locked && (
        <p className="rounded-xl border border-teal-800 bg-teal-950/50 p-3 text-sm text-teal-200">
          You&apos;ve submitted this case. The work-up is read-only now.
        </p>
      )}

      {tab === "history" && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <HistoryChat history={history} locked={locked} />
          <HistoryTracker history={history} />
        </div>
      )}
      {tab === "tests" && <TestOrderPanel tests={tests} locked={locked} />}
      {tab === "submit" && (
        <DifferentialForm caseId={caseId} diagnoses={diagnoses} tests={tests} onGoToTests={() => setTab("tests")} />
      )}
    </div>
  );
}
