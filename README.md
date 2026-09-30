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

## Running the web app

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

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
- **Never commit patient data or secrets.** MIMIC data is covered by a Data Use Agreement, and this repo is public. API keys go in Vercel environment variables.
