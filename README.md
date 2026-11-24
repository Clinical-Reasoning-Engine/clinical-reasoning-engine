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

### Diagnose mode and Google sign-in

`/diagnose/sepsis` is the Diagnose-mode flow (Login → Patient → Work-up → Feedback → Grade).
Sign-in uses Firebase Auth with Google. It needs four public web-app values, set in Vercel
(Settings → Environment Variables, then redeploy) or in `web/.env.local` on your machine:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Without them, the Login page offers "Continue as guest", so CI and fresh clones still work.
Every domain you sign in from (localhost, the Vercel production URL, a preview branch URL)
must be listed in Firebase → Authentication → Settings → Authorized domains.

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
