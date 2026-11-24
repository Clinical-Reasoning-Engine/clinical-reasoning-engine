// Saves and lists a student's graded attempts in Firestore (MVP-12).
// Browser only. Data lives at users/{uid}/attempts/{attemptId}; the Firestore
// security rules (web/firestore.rules) let each student read and write only
// their own attempts.
//
// The browser writes the score it was shown, so a student could edit their own
// saved score. For a practice tool that only fools themselves; if scores ever
// count for something, move the save into the server-side grading step.

import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";

import { parseAttemptRecord, type AttemptRecord } from "./diagnose/attempt-history";
import { firebaseDb } from "./firebase";

/** Give up after this long, e.g. when the database hasn't been created yet. */
const TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timed out talking to Firestore.")), TIMEOUT_MS)),
  ]);
}

/** Saves one attempt. Saving the same attempt again overwrites it, so a page refresh doesn't duplicate it. */
export async function saveAttemptRecord(uid: string, record: AttemptRecord): Promise<void> {
  const db = firebaseDb();
  if (!db) throw new Error("Firebase is not set up for this deployment.");
  const { id, ...data } = record;
  await withTimeout(setDoc(doc(db, "users", uid, "attempts", id), { ...data, savedAt: serverTimestamp() }));
}

/** The student's attempts, newest first (up to 50). */
export async function listAttemptRecords(uid: string): Promise<AttemptRecord[]> {
  const db = firebaseDb();
  if (!db) return [];
  const snapshot = await withTimeout(
    getDocs(query(collection(db, "users", uid, "attempts"), orderBy("submittedAt", "desc"), limit(50))),
  );
  return snapshot.docs.flatMap((d) => {
    const record = parseAttemptRecord(d.id, d.data());
    return record ? [record] : [];
  });
}
