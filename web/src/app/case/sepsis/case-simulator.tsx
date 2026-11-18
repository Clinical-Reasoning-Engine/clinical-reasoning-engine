"use client";

import { useState } from "react";

import caseJson from "@/demo-case/sepsis-case.json";
import {
  CASE_TITLE,
  DIAGNOSES,
  ORDERS,
  PRESENTATION,
  QUESTIONS,
  TEACHING_POINTS,
  type OrderId,
  type Speaker,
} from "@/demo-case/content";
import { actionForHour, nodeFor, scoreDecisions, trajectory, type Action, type CaseData, type HourLog } from "@/lib/sim";
import { classifyVital } from "@/lib/vitals";

import { TrendChart } from "./trend-chart";

const data = caseJson as unknown as CaseData;
const MAX_HOUR = 6;
const ONE_TIME: OrderId[] = ["cultures", "lactate", "xray", "antibiotics", "norepinephrine"];

type FeedItem = { who: Speaker | "You" | "Monitor"; text: string };

const VITAL_ROWS = [
  { key: "hr", label: "HR", unit: "bpm", range: [60, 100], color: "text-emerald-400" },
  { key: "map", label: "MAP", unit: "mmHg", range: [65, 110], color: "text-rose-400" },
  { key: "rr", label: "RR", unit: "/min", range: [12, 20], color: "text-amber-300" },
  { key: "spo2", label: "SpO₂", unit: "%", range: [94, 100], color: "text-sky-400" },
  { key: "temp_f", label: "Temp", unit: "°F", range: [97, 100.4], color: "text-zinc-200" },
] as const;

function orderResult(id: OrderId): string {
  if (id === "lactate" && data.labs.lactate) {
    return `Lactate is back: ${data.labs.lactate.value} ${data.labs.lactate.unit}.`;
  }
  return ORDERS.find((o) => o.id === id)!.result;
}

export function CaseSimulator() {
  const [actions, setActions] = useState<Action[]>([]);
  const [log, setLog] = useState<HourLog[]>([]);
  const [thisHour, setThisHour] = useState<OrderId[]>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([{ who: "Nurse", text: "She just arrived from the ED. Vitals are on the monitor." }]);
  const [phase, setPhase] = useState<"case" | "commit" | "debrief">("case");
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  const hour = actions.length;
  const placed = new Set([...log.flatMap((h) => h.orders), ...thisHour]);
  const pressorRunning = placed.has("norepinephrine");
  const vitalsPath = trajectory(data, actions);
  const now = vitalsPath[vitalsPath.length - 1];
  const lastMatches = hour > 0 ? nodeFor(data, actions).matches : [];

  function ask(id: string) {
    const q = QUESTIONS.find((x) => x.id === id)!;
    setAsked((a) => [...a, id]);
    setFeed((f) => [...f, { who: "You", text: q.text }, { who: q.speaker, text: q.answer }]);
  }

  function order(id: OrderId) {
    setThisHour((o) => [...o, id]);
    setFeed((f) => [...f, { who: "Nurse", text: orderResult(id) }]);
  }

  function advance() {
    const action = actionForHour(pressorRunning, thisHour.includes("fluids"));
    const next = [...actions, action];
    const state = nodeFor(data, next).state;
    setLog((l) => [...l, { hour, orders: thisHour, action }]);
    setActions(next);
    setThisHour([]);
    setFeed((f) => [
      ...f,
      {
        who: "Monitor",
        text: `Hour ${next.length}: HR ${Math.round(state.hr)}, MAP ${Math.round(state.map)}, RR ${Math.round(state.rr)}, SpO₂ ${Math.round(state.spo2)}%, ${state.temp_f.toFixed(1)}°F`,
      },
    ]);
  }

  if (phase === "debrief") {
    return <Debrief actions={actions} log={log} asked={asked} diagnosis={diagnosis} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[3fr_2fr]">
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-teal-300">Sepsis case · ICU hour {hour}</p>
          <h1 className="text-3xl font-semibold text-zinc-50">{CASE_TITLE}</h1>
          <p className="text-zinc-300">{PRESENTATION}</p>
          <p className="text-sm text-zinc-400">
            {data.patient.age}-year-old {data.patient.sex === "F" ? "woman" : "man"} · Medical ICU
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="grid grid-cols-5 gap-2">
            {VITAL_ROWS.map((v) => {
              const value = now[v.key];
              const status = classifyVital(value, v.range[0], v.range[1]);
              return (
                <div key={v.key} className="flex flex-col">
                  <span className="text-xs text-zinc-500">{v.label}</span>
                  <span className={`font-mono text-3xl font-semibold ${v.color}`}>
                    {v.key === "temp_f" ? value.toFixed(1) : Math.round(value)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {v.unit}
                    {status !== "normal" && <span className="ml-1 font-semibold text-orange-400">{status === "low" ? "LOW" : "HIGH"}</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <TrendChart metric="map" series={[{ label: "You", values: vitalsPath, color: "#fb7185" }]} />
            <TrendChart metric="hr" series={[{ label: "You", values: vitalsPath, color: "#34d399" }]} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-200">Admission labs (real values)</h2>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-300">
            {Object.entries(data.labs)
              .filter(([name]) => name !== "lactate" || placed.has("lactate"))
              .map(([name, lab]) => (
                <span key={name}>
                  <span className="text-zinc-500">{name.toUpperCase()}</span> {lab.value} {lab.unit}
                </span>
              ))}
          </div>
        </div>

        {hour > 0 && (
          <details className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            <summary className="cursor-pointer text-zinc-200">
              How hour {hour} was predicted: matched to {lastMatches.length} real ICU moments
            </summary>
            <p className="mt-2 text-zinc-400">
              We found the {data.matching.k} moments from {data.matching.sepsis_stays - 1} other real sepsis ICU stays whose vitals were
              closest to this patient&apos;s and where the care team did the same thing ({actions[hour - 1]}), then averaged
              how their vitals changed over the next hour.
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-zinc-400">
              {lastMatches.map(([stay, h, d]) => (
                <li key={`${stay}-${h}`}>
                  {stay}, hour {h} · distance {d}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-200">Conversation</h2>
          <div
            ref={(el) => {
              if (el) el.scrollTop = el.scrollHeight;
            }}
            className="flex max-h-72 flex-col gap-2 overflow-y-auto text-sm"
          >
            {feed.map((item, i) => (
              <p key={i} className={item.who === "You" ? "text-teal-300" : item.who === "Monitor" ? "font-mono text-xs text-zinc-500" : "text-zinc-200"}>
                <span className="font-semibold">{item.who}:</span> {item.text}
              </p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTIONS.filter((q) => !asked.includes(q.id)).map((q) => (
              <button
                key={q.id}
                onClick={() => ask(q.id)}
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-teal-400 hover:text-teal-300"
              >
                {q.text}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-200">Orders</h2>
          <div className="grid grid-cols-2 gap-2">
            {ORDERS.map((o) => {
              const done = ONE_TIME.includes(o.id) ? placed.has(o.id) : thisHour.includes(o.id);
              return (
                <button
                  key={o.id}
                  disabled={done || phase !== "case"}
                  onClick={() => order(o.id)}
                  className="rounded-xl border border-zinc-700 p-2 text-left text-sm text-zinc-100 hover:border-teal-400 disabled:border-teal-800 disabled:bg-teal-950 disabled:text-teal-300"
                >
                  <span className="block font-medium">
                    {done ? "✓ " : ""}
                    {o.label}
                  </span>
                  <span className="block text-xs text-zinc-400">{o.detail}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={advance}
              disabled={hour >= MAX_HOUR || phase !== "case"}
              className="flex-1 rounded-xl bg-teal-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40"
            >
              Advance 1 hour
            </button>
            <button
              onClick={() => setPhase("commit")}
              className="flex-1 rounded-xl border border-zinc-600 px-4 py-2 font-semibold text-zinc-100 hover:border-zinc-400"
            >
              Commit to diagnosis
            </button>
          </div>
        </div>

        {phase === "commit" && (
          <div className="rounded-2xl border border-teal-700 bg-zinc-900 p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-200">What is your diagnosis?</h2>
            <div className="flex flex-col gap-2">
              {DIAGNOSES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    if (thisHour.length) setLog((l) => [...l, { hour, orders: thisHour, action: "none" }]);
                    setDiagnosis(d.id);
                    setPhase("debrief");
                  }}
                  className="rounded-xl border border-zinc-700 p-2 text-left text-sm text-zinc-100 hover:border-teal-400"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Debrief({ actions, log, asked, diagnosis }: { actions: Action[]; log: HourLog[]; asked: string[]; diagnosis: string | null }) {
  const vitalsPath = trajectory(data, actions);
  const checks = scoreDecisions(log, vitalsPath);
  const chosen = DIAGNOSES.find((d) => d.id === diagnosis);
  const keyQs = QUESTIONS.filter((q) => q.key);
  const missed = keyQs.filter((q) => !asked.includes(q.id));
  // The real course has one row per charted hour; carry values over any gap.
  const real = Array.from({ length: MAX_HOUR + 1 }, (_, h) => {
    const rows = data.real_course.filter((r) => r.hour <= h);
    return (rows.length ? rows[rows.length - 1] : data.real_course[0]).state;
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-teal-300">Debrief</p>
        <h1 className="text-3xl font-semibold text-zinc-50">{chosen?.correct ? "Correct: septic shock from pneumonia" : `You chose: ${chosen?.label ?? "no diagnosis"}`}</h1>
        {!chosen?.correct && <p className="text-zinc-300">The answer was septic shock from pneumonia: fever, productive cough, new confusion, low MAP and a high white count.</p>}
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">Your decisions</h2>
        <ul className="flex flex-col gap-2">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-3 text-sm">
              <span className={c.passed ? "font-semibold text-emerald-400" : "font-semibold text-orange-400"}>{c.passed ? "Done" : "Missed"}</span>
              <span className="text-zinc-200">
                {c.label} <span className="text-zinc-400">· {c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">
          Key questions: {keyQs.length - missed.length} of {keyQs.length} asked
        </h2>
        {missed.length === 0 ? (
          <p className="text-sm text-zinc-300">You covered every key question.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {missed.map((q) => (
              <li key={q.id} className="text-zinc-300">
                <span className="text-orange-400">Missed:</span> “{q.text}” <span className="text-zinc-400">· {q.why}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-black p-4">
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">Your patient vs. the real patient</h2>
        <p className="mb-2 text-sm text-zinc-400">Teal: your simulated course. Grey dashed: what actually happened to the real ICU patient this case is based on.</p>
        <div className="grid grid-cols-2 gap-4">
          {(["map", "hr"] as const).map((metric) => (
            <TrendChart
              key={metric}
              metric={metric}
              series={[
                { label: "Real patient", values: real, color: "#9ca3af", dashed: true },
                { label: "You", values: vitalsPath, color: "#2dd4bf" },
              ]}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-zinc-100">Why the body did this</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-zinc-300">
          {TEACHING_POINTS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <button
        onClick={() => window.location.reload()}
        className="self-start rounded-xl bg-teal-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-teal-400"
      >
        Try the case again
      </button>
    </div>
  );
}
