"use client";

// Free-text history taking. The student types any question; askPatient()
// matches it to the case's history items (rule-based for now, an LLM later).

import { useState } from "react";

import { askedItemIds, offTopicCount } from "@/lib/diagnose/attempt";
import type { HistoryItem } from "@/lib/diagnose/case-types";
import { askPatient } from "@/lib/diagnose/history";

import { useAttempt } from "./attempt-provider";

export function HistoryChat({ history, locked }: { history: HistoryItem[]; locked: boolean }) {
  const { attempt, update } = useAttempt();
  const [question, setQuestion] = useState("");

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    const reply = askPatient(history, text, offTopicCount(attempt));
    update((a) => ({
      ...a,
      asked: [...a.asked, { question: text, reply: reply.text, speaker: reply.speaker, itemId: reply.matched ? reply.item.id : null }],
    }));
    setQuestion("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Take a history</h2>
        <span className="text-xs text-zinc-500">{askedItemIds(attempt).length} topics covered</span>
      </div>
      <div
        ref={(el) => {
          if (el) el.scrollTop = el.scrollHeight;
        }}
        className="flex h-80 flex-col gap-3 overflow-y-auto rounded-xl bg-black p-3 text-sm"
        aria-live="polite"
      >
        {attempt.asked.length === 0 && (
          <p className="text-zinc-500">
            The patient and her daughter are here. Ask anything in your own words, the way you would at the bedside.
          </p>
        )}
        {attempt.asked.map((q, i) => (
          <div key={i} className="flex flex-col gap-1">
            <p className="text-teal-300">
              <span className="font-semibold">You:</span> {q.question}
            </p>
            <p className={q.itemId ? "text-zinc-100" : "text-zinc-400 italic"}>
              <span className="font-semibold not-italic">{q.speaker}:</span> {q.reply}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={ask} className="flex gap-2">
        <label htmlFor="history-question" className="sr-only">
          Your question
        </label>
        <input
          id="history-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={locked}
          autoComplete="off"
          placeholder={locked ? "Submitted: the work-up is locked" : "e.g. When did this start?"}
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={locked || !question.trim()}
          className="rounded-xl bg-teal-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-40"
        >
          Ask
        </button>
      </form>
      <p className="text-xs text-zinc-500">
        Replies come from a keyword matcher, so unusual phrasing may not be understood yet. Try rewording.
      </p>
    </div>
  );
}
