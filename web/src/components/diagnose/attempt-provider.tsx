"use client";

// Keeps the current attempt (questions, tests, submission) while the student
// moves between the Work-up and Results pages.
//
// It is saved in sessionStorage, so a page refresh keeps your progress but
// closing the tab starts fresh. The full attempt stays in this browser; after
// grading, only a summary is saved to the student's account (lib/attempt-store.ts).

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

/** Clears the saved attempt for a case, for starting it fresh from outside the case (My attempts). */
export function clearSavedAttempt(caseId: string) {
  try {
    window.sessionStorage.removeItem(storageKey(caseId));
  } catch {
    // Storage blocked: there was nothing saved anyway.
  }
}

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
