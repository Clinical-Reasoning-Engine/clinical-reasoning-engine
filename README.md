# Clinical Reasoning Engine

A training simulator for preclinical medical students: realistic patient cases whose vitals and labs evolve in response to the student's diagnostic and treatment decisions, grounded in real de-identified ICU trajectories (MIMIC-IV).

COMP 490/491 Senior Design, CSUN, 2026–2027.

## Team

| Area | Owner |
| --- | --- |
| Backend/API, Firebase, deployment, CI/CD | Gor Petrosyan |
| Case data (SQLite), medical accuracy | Richie Mondragon |
| Trajectory-matching engine (Python), Jira | Arad Rokni |
| Frontend (chart UI + chat) | Eduardo Pacheco |

## Repo layout

```
web/      Next.js app (deployed on Vercel)
engine/   Python trajectory-matching code
```

## Sepsis proof of concept

Open `/case/sepsis` in the web app: one guided sepsis case whose vitals follow real ICU
trajectories from the open-access MIMIC-IV demo, matched offline by the engine. The patient
story and replies are written by the team. See `engine/README.md` and `web/src/demo-case/README.md`.

## Running the web app

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

### Diagnose mode

`/diagnose/sepsis` is the Diagnose-mode flow: Login → Patient → Work-up (history, tests,
3 ranked differentials and a plan) → Results. The Manage-mode POC at `/case/sepsis` is separate.

**Where things live** (all under `web/src/`):

| What | File |
| --- | --- |
| The case: history answers, tests, chart, answer key | `demo-case/diagnose-sepsis.ts` |
| The shape every case follows | `lib/diagnose/case-types.ts` |
| The patient's replies (keyword matcher) | `lib/diagnose/history.ts` (`askPatient`) |
| One attempt (questions, tests, submission) | `lib/diagnose/attempt.ts` |
| Grading | `lib/diagnose/grade.ts` (`gradeAttempt`) |
| Saved attempts (Firestore) | `lib/attempt-store.ts`, `lib/diagnose/attempt-history.ts` |
| Pages | `app/(diagnose-mode)/` |

#### How grading works

Grading is rule-based for now: no LLM is called. Everything is in `lib/diagnose/grade.ts`, and
the tests in `grade.test.ts` show each rule with an example. The score is out of 100:

| Section | Points | How it's scored |
| --- | --- | --- |
| History | 30 | Share of the case's **key** history topics the student asked about (`key: true` in the case file). |
| Differentials | 40 | #1 is the real diagnosis: 25. #1 is close but incomplete (e.g. pneumonia without the sepsis): 12. Each reasonable alternative in #2 or #3: 5 (the real diagnosis there also gets 5). Supporting findings for #1: up to 5, full marks at 4 named. |
| Work-up plan | 30 | Share of the answer key's tests the student ordered. Extra tests cost nothing, but Results notes them. |

- **Change the weights** in `GRADE_WEIGHTS` and `DIFFERENTIAL_POINTS` at the top of `grade.ts`.
  Everything else (the page, the tests) reads from there.
- **Change what counts as right** in the case file's `answerKey` (the diagnosis, close answers,
  alternatives, findings, plan tests) and the `key` flag on each history item.
- **Matching typed diagnoses:** a student's text matches a diagnosis if it is the label, or if it
  contains every word of one of its synonyms, in any order (`"seps* pneumon*"` matches
  "pneumonia with sepsis"; `*` matches the start of a word). "Not PE" still reads as PE: the
  matcher doesn't understand negation.
- **Why it runs on the server:** Results sends the attempt to a Server Function
  (`app/(diagnose-mode)/diagnose/[caseId]/results/actions.ts`), so the answer key never ships in
  the browser's JavaScript. It still checks every field of what the browser sends.
- **Swapping in an LLM later:** `gradeAttempt` is async and takes plain data (the case and the
  attempt). An LLM grader only has to return the same `GradeResult` shape, and the page won't change.

Results also shows two "chart checks": the chart is deliberately out of date (allergy, aspirin),
and students who ask about allergies and medications get credit for catching it.

#### Google sign-in and saved attempts

Sign-in uses Firebase Auth with Google. It needs four public web-app values, set in Vercel
(Settings → Environment Variables, then redeploy) or in `web/.env.local` on your machine:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Without them, the Login page offers "Continue as guest", so CI and fresh clones still work
(guests' attempts aren't saved). Every domain you sign in from (localhost, the Vercel production
URL, a preview branch URL) must be listed in Firebase → Authentication → Settings → Authorized domains.

After grading, a signed-in student's attempt summary (score, section scores, #1 diagnosis) is
saved to Firestore at `users/{uid}/attempts/{id}` and listed on `/attempts` ("My attempts").
No name or email is stored. The security rules are in `web/firestore.rules`: each student can
read and write only their own attempts. Paste them into Firebase → Firestore Database → Rules
when they change.

Before opening a pull request, run the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## How we work

- `main` is protected. All changes go through a pull request.
- A PR can merge only when CI passes and one teammate approves.
- Every PR gets a Vercel preview link. Merging to `main` deploys to production.
- **Never commit patient data or secrets.** Credentialed MIMIC data is covered by a Data Use Agreement, and this repo is public. The only exception is the small open-access demo extract in `web/src/demo-case/` (ODbL). API keys go in Vercel environment variables.
