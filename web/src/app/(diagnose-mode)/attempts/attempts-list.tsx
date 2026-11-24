"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { clearSavedAttempt } from "@/components/diagnose/attempt-provider";
import { listAttemptRecords } from "@/lib/attempt-store";
import type { AttemptRecord } from "@/lib/diagnose/attempt-history";
import type { SlotVerdict } from "@/lib/diagnose/grade";
import { stepHref } from "@/lib/diagnose/steps";

const FIRST_VERDICT: Partial<Record<SlotVerdict, string>> = {
  correct: "#1 right",
  partial: "#1 close",
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

type Loaded = { for: string; records: AttemptRecord[] } | { for: string; error: true };

export function AttemptsList() {
  const { student } = useAuth();
  const uid = student?.uid ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    listAttemptRecords(uid).then(
      (records) => !cancelled && setLoaded({ for: uid, records }),
      (error) => {
        console.error("Couldn't load attempts", error);
        if (!cancelled) setLoaded({ for: uid, error: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uid]);

  if (!uid) {
    return (
      <Note>
        You&apos;re using guest mode, so attempts aren&apos;t saved. Sign in with Google to keep a history of your
        attempts.
      </Note>
    );
  }
  if (!loaded || loaded.for !== uid) return <Note>Loading your attempts…</Note>;
  if ("error" in loaded) return <Note>We couldn&apos;t load your attempts. Refresh the page to try again.</Note>;
  if (loaded.records.length === 0) {
    return (
      <Note>
        No attempts yet. Finish a case and your score will show up here.{" "}
        <Link href={stepHref("sepsis", "intro")} className="text-teal-300 underline">
          Start the sepsis case
        </Link>
      </Note>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {loaded.records.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-1 sm:w-24">
            <span className="text-3xl font-semibold tabular-nums text-zinc-50">{r.total}</span>
            <span className="text-sm text-zinc-500">/ {r.max}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-medium text-zinc-100">{r.caseTitle}</span>
            <span className="text-sm text-zinc-400">
              {formatDate(r.submittedAt)} · Your #1: {r.firstDiagnosis.entered}
              {FIRST_VERDICT[r.firstDiagnosis.verdict] ? ` (${FIRST_VERDICT[r.firstDiagnosis.verdict]})` : ""}
            </span>
            <span className="text-xs text-zinc-500">
              {r.sections.map((s) => `${s.label} ${s.score}/${s.max}`).join(" · ")}
              {r.usedPracticeMode ? " · Practice mode" : ""}
            </span>
          </div>
          <Link
            href={stepHref(r.caseId, "intro")}
            onClick={() => clearSavedAttempt(r.caseId)}
            className="self-start whitespace-nowrap rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-400 sm:self-center"
          >
            Try again
          </Link>
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateFormat.format(date);
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-zinc-300">{children}</p>;
}
