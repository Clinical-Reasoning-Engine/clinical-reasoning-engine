"use client";

// The patient's chart as a pop-up (MVP-2). A floating "Chart" button stays on
// screen on every step of the case, so the student can check it any time
// without losing their place. Uses the browser's <dialog>, which handles
// focus and closes with Esc.

import { useRef } from "react";

import type { PatientChart } from "@/lib/diagnose/case-types";

import { SourceTag } from "./source-tag";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h3>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1 text-sm text-zinc-100">
      {items.map((i) => (
        <li key={i}>• {i}</li>
      ))}
    </ul>
  );
}

/** The chart without `gaps`: those are part of the answer key and stay on the server. */
export type VisibleChart = Omit<PatientChart, "gaps">;

export function ChartDialog({ chart, patientLine }: { chart: VisibleChart; patientLine: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        onClick={() => dialog.current?.showModal()}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-teal-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-teal-200 shadow-lg shadow-black/50 hover:border-teal-400"
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">📋</span> Chart
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="chart-title"
        onClick={(e) => {
          // A click on the dark backdrop (outside the panel) closes the chart.
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-0 text-zinc-100 backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-5 p-5">
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="chart-title" className="text-xl font-semibold text-zinc-50">
                Patient chart
              </h2>
              <p className="text-sm text-zinc-400">{patientLine}</p>
              <p className="text-xs text-zinc-500">Last updated {chart.lastUpdated}</p>
              <div>
                <SourceTag source={chart.source} />
              </div>
            </div>
            <button
              onClick={() => dialog.current?.close()}
              className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:border-zinc-400"
            >
              Close
            </button>
          </header>

          <Section title="Problem list">
            <List items={chart.problems} />
          </Section>
          <Section title="Medications">
            <List items={chart.medications} />
          </Section>
          <Section title="Allergies">
            <List items={chart.allergies} />
          </Section>
          <Section title="Immunizations">
            <List items={chart.immunizations} />
          </Section>
          <Section title="Recent visits">
            <ul className="flex flex-col gap-3 text-sm">
              {chart.visits.map((v) => (
                <li key={v.when + v.where} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <p className="font-medium text-zinc-100">
                    {v.where} <span className="text-zinc-500">· {v.when}</span>
                  </p>
                  <p className="text-zinc-300">{v.note}</p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Past labs">
            <ul className="flex flex-col gap-1 text-sm text-zinc-100">
              {chart.pastLabs.map((l) => (
                <li key={l.when + l.results}>
                  <span className="text-zinc-500">{l.when}:</span> {l.results}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </dialog>
    </>
  );
}
