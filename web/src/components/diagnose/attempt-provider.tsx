"use client";

// Keeps the current attempt (questions, tests, submission) while the student
// moves between Work-up, Feedback and Grade.
//
// It is saved in sessionStorage, so a page refresh keeps your progress but
// closing the tab starts fresh. Nothing is sent to a server yet; saving past
// attempts to your account (Firestore) is MVP-12.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { emptyAttempt, parseAttempt, type Attempt } from "@/lib/diagnose/attempt";

type AttemptContextValue = {
  attempt: Attempt;
  /** Apply a change, e.g. update((a) => orderTest(a, "cbc")). */
  update: (change: (current: Attempt) => Attempt) => void;
  /** Throw the attempt away and start the case again. */
  reset: () => void;
};

const AttemptContext = createContext<AttemptContextValue | null>(null);

const storageKey = (caseId: string) => `cre:attempt:${caseId}`;

function load(caseId: string): Attempt {
  if (typeof window === "undefined") return emptyAttempt(caseId);
  try {
    return parseAttempt(window.sessionStorage.getItem(storageKey(caseId)), caseId);
  } catch {
    // Storage can be blocked (private mode, embedded frames): just start fresh.
    return emptyAttempt(caseId);
  }
}

export function AttemptProvider({ caseId, children }: { caseId: string; children: ReactNode }) {
  const [attempt, setAttempt] = useState<Attempt>(() => load(caseId));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey(caseId), JSON.stringify(attempt));
    } catch {
      // Not saved; the attempt still works for this page view.
    }
  }, [attempt, caseId]);

  const value: AttemptContextValue = {
    attempt,
    update: (change) => setAttempt((current) => change(current)),
    reset: () => setAttempt(emptyAttempt(caseId)),
  };
  return <AttemptContext.Provider value={value}>{children}</AttemptContext.Provider>;
}

export function useAttempt(): AttemptContextValue {
  const value = useContext(AttemptContext);
  if (!value) throw new Error("useAttempt must be used inside <AttemptProvider>");
  return value;
}
