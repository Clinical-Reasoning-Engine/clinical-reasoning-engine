"use client";

// Step 3 of the case: the score, then feedback that teaches. The attempt lives
// in this browser (sessionStorage), so we send it to the server to be graded
// (actions.ts) and show what comes back.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { useAttempt } from "@/components/diagnose/attempt-provider";
import { SOURCE_LABELS, type Source } from "@/lib/diagnose/case-types";
import type { GradeResult, SlotVerdict } from "@/lib/diagnose/grade";
import { stepHref } from "@/lib/diagnose/steps";

import { gradeMyAttempt, type GradeResponse } from "./actions";

const VERDICT_TEXT: Record<SlotVerdict, string> = {
  correct: "Right. This is the diagnosis.",
  partial: "Close, but not the whole picture. Half credit.",
  "correct-not-first": "This is the diagnosis. It belonged at #1.",
  alternative: "A reasonable alternative to rule out.",
  overlap: "This overlaps with the diagnosis. A distinct alternative would teach you more.",
  "off-target": "Doesn't fit this case well.",
  unrecognized: "We couldn't match this to a diagnosis. Pick from the suggestions as you type.",
  duplicate: "Same as an earlier pick, so it only counts once.",
};

const GOOD: SlotVerdict[] = ["correct", "correct-not-first", "alternative"];

// True only in the browser, after hydration. The attempt comes from
// sessionStorage, which the server can't see, so we wait for it.
const subscribeNothing = () => () => {};
function useInBrowser() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

export function ResultsView({ caseId }: { caseId: string }) {
  const { attempt, reset } = useAttempt();
  const router = useRouter();
  const inBrowser = useInBrowser();
  const [response, setResponse] = useState<{ for: string; value: GradeResponse } | null>(null);
  const submittedAt = attempt.submission?.submittedAt ?? null;

  useEffect(() => {
    if (!inBrowser || !submittedAt) return;
    let cancelled = false;
    gradeMyAttempt(caseId, JSON.stringify(attempt)).then((value) => {
      if (!cancelled) setResponse({ for: submittedAt, value });
    });
    return () => {
      cancelled = true;
    };
  }, [inBrowser, caseId, attempt, submittedAt]);

  function tryAgain() {
    if (!window.confirm("Start this case again? These results will be cleared.")) return;
    reset();
    router.push(stepHref(caseId, "intro"));
  }

  if (!inBrowser) return <Status>Grading your work-up…</Status>;
  if (!submittedAt) {
    return (
      <Status>
        You haven&apos;t submitted this case yet.{" "}
        <Link href={stepHref(caseId, "workup")} className="text-teal-300 underline">
          Go to the work-up
        </Link>
      </Status>
    );
  }
  if (!response || response.for !== submittedAt) return <Status>Grading your work-up…</Status>;
  if (!response.value.ok) return <Status>We couldn&apos;t grade this attempt. Try the case again.</Status>;

  return <Results result={response.value.result} caseId={caseId} onTryAgain={tryAgain} />;
}

function Status({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-zinc-300">
      {children}
    </p>
  );
}

function Results({ result, caseId, onTryAgain }: { result: GradeResult; caseId: string; onTryAgain: () => void }) {
  const { differentials, history, plan, chartChecks } = result;
  const first = differentials.slots[0];
  const headline =
    first.verdict === "correct"
      ? "Your #1 diagnosis was right."
      : first.verdict === "partial"
        ? "Your #1 diagnosis was close."
        : "Your #1 diagnosis missed this time.";

  return (
    <div className="flex flex-col gap-6">
      <section className="grid items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-semibold tabular-nums text-zinc-50">{result.total}</span>
          <span className="text-lg text-zinc-500">/ {result.max}</span>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">{headline}</h1>
          <dl className="grid gap-2 sm:grid-cols-3">
            {result.sections.map((s) => (
              <div key={s.id} className="flex flex-col gap-1">
                <dt className="flex justify-between text-sm text-zinc-400">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-zinc-200">
                    {s.score}/{s.max}
                  </span>
                </dt>
                <dd className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-teal-400" style={{ width: `${(s.score / s.max) * 100}%` }} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col">
          <button
            onClick={onTryAgain}
            className="whitespace-nowrap rounded-xl bg-teal-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-teal-400"
          >
            Try this case again
          </button>
          <Link
            href={stepHref(caseId, "workup")}
            className="whitespace-nowrap rounded-xl border border-zinc-700 px-4 py-2 text-center text-sm text-zinc-300 hover:border-zinc-400"
          >
            Review your work-up
          </Link>
        </div>
      </section>

      {result.usedPracticeMode && (
        <p className="rounded-xl border border-amber-800/70 bg-amber-950/40 p-3 text-sm text-amber-200">
          You used practice mode, so the history checklist was visible. Try the case again without it to test yourself.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card title="Diagnosis">
          <p className="text-zinc-300">
            The diagnosis: <span className="font-semibold text-zinc-50">{differentials.answer.label}</span>
          </p>
          <SourceNote source={differentials.answer.source} />
          <ol className="flex flex-col gap-3">
            {differentials.slots.map((s) => (
              <li key={s.rank} className="flex gap-3">
                <Mark good={GOOD.includes(s.verdict)} partial={s.verdict === "partial"} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-zinc-100">
                    #{s.rank} {s.entered}
                  </span>
                  {s.matchedLabel && s.matchedLabel.toLowerCase() !== s.entered.toLowerCase() && (
                    <span className="text-xs text-zinc-500">Read as: {s.matchedLabel}</span>
                  )}
                  <span className="text-sm text-zinc-400">{VERDICT_TEXT[s.verdict]}</span>
                </div>
                <span className="ml-auto shrink-0 text-sm tabular-nums text-zinc-400">+{s.points}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
            <h3 className="flex justify-between text-sm font-medium text-zinc-200">
              Findings that support it <span className="tabular-nums text-zinc-400">+{differentials.findings.points}</span>
            </h3>
            {differentials.findings.mentioned.length > 0 && (
              <p className="text-sm text-zinc-300">You named: {differentials.findings.mentioned.join(", ")}.</p>
            )}
            {differentials.findings.notMentioned.length > 0 && (
              <p className="text-sm text-zinc-400">Also supports it: {differentials.findings.notMentioned.join(", ")}.</p>
            )}
          </div>
        </Card>

        <Card title={`History (${history.covered.length} of ${history.covered.length + history.missed.length} key topics)`}>
          {history.missed.length === 0 ? (
            <p className="text-zinc-300">You covered every key topic.</p>
          ) : (
            <>
              <p className="text-sm text-zinc-400">What you didn&apos;t ask about, and why it matters:</p>
              <ul className="flex flex-col gap-3">
                {history.missed.map((m) => (
                  <li key={m.id} className="flex gap-3">
                    <Mark good={false} />
                    <div className="flex flex-col">
                      <span className="text-zinc-100">
                        {m.label} <span className="text-xs text-zinc-500">{m.category}</span>
                      </span>
                      <span className="text-sm text-zinc-400">{m.why}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {history.covered.length > 0 && (
            <p className="border-t border-zinc-800 pt-3 text-sm text-zinc-400">
              Covered: {history.covered.map((h) => h.label).join(", ")}.
            </p>
          )}
        </Card>

        <Card title="Work-up plan">
          <ul className="flex flex-col gap-3">
            {[...plan.ordered.map((t) => ({ ...t, done: true })), ...plan.missed.map((t) => ({ ...t, done: false }))].map(
              (t) => (
                <li key={t.testId} className="flex gap-3">
                  <Mark good={t.done} />
                  <div className="flex flex-col">
                    <span className="text-zinc-100">
                      {t.label}
                      {!t.done && <span className="text-sm text-zinc-500"> (not ordered)</span>}
                    </span>
                    <span className="text-sm text-zinc-400">{t.why}</span>
                    <SourceNote source={t.source} />
                  </div>
                </li>
              ),
            )}
          </ul>
          {plan.extra.length > 0 && (
            <p className="border-t border-zinc-800 pt-3 text-sm text-zinc-400">
              You also ordered {plan.extra.map((t) => t.label).join(", ")}. Extra tests don&apos;t cost points here, but
              in practice each one adds cost, time and the chance of a misleading result.
            </p>
          )}
          {plan.note && <p className="text-sm text-zinc-400">Your plan note: {plan.note}</p>}
        </Card>

        <Card title="Chart checks">
          <p className="text-sm text-zinc-400">
            The chart was wrong in {chartChecks.length === 1 ? "one place" : `${chartChecks.length} places`}. Asking
            the patient is how you catch it.
          </p>
          <ul className="flex flex-col gap-3">
            {chartChecks.map((g) => (
              <li key={g.label} className="flex gap-3">
                <Mark good={g.caught} />
                <div className="flex flex-col">
                  <span className="text-zinc-100">{g.label}</span>
                  <span className="text-sm text-zinc-400">
                    {g.caught ? "You caught this by asking. " : "Missed. "}
                    {g.why}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Key teaching points">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-zinc-300 marker:text-teal-500">
          {result.teachingPoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

/** A check, half-circle or cross in a circle; the text beside it says the same in words. */
function Mark({ good, partial = false }: { good: boolean; partial?: boolean }) {
  const [symbol, style] = good
    ? ["✓", "border-teal-500 text-teal-300"]
    : partial
      ? ["½", "border-amber-500 text-amber-300"]
      : ["✕", "border-zinc-600 text-zinc-500"];
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${style}`}
    >
      {symbol}
    </span>
  );
}

function SourceNote({ source }: { source: Source }) {
  return <span className="text-xs text-zinc-500">Source: {SOURCE_LABELS[source]}</span>;
}
