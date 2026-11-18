# engine/

Python trajectory-matching engine (owner: Arad).

## What it does (sepsis POC)

1. `build_case.py` reads the open-access MIMIC-IV demo, finds the 23 ICU stays with sepsis
   as a top-3 diagnosis, and builds an hourly table per stay: five vitals (smoothed with a
   3-hour rolling median) and what the care team did that hour (`none`, `fluids` = an IV fluid
   bolus, `pressor` = a vasopressor running).
2. `matching.py` turns that into "moments" (this hour → next hour). For a simulated patient in
   state S who gets action A, it finds the k = 8 real moments with action A whose state is
   closest to S (standardized vitals plus last hour's MAP change) and averages their next-hour change.
3. The script picks one textbook septic stay as the case patient (fever, HR > 100, RR > 20,
   MAP < 65), leaves it out of the matching pool, precomputes every action path for 6 hours
   (1,093 states), and writes `web/src/demo-case/sepsis-case.json` for the web app.

The web app never runs Python: it looks up the precomputed state for the student's path.

## Known limits

- 23 stays is small, and only 35 matched moments are fluid boluses, so predictions are coarse.
- This is observational data: sicker patients get more treatment, so matching can make treatment
  look less helpful than it is (confounding by indication). The MAP-trend feature reduces this
  but does not remove it. Full MIMIC-IV and more severity features (lactate, prior pressor dose)
  are the next step.

## Run

```bash
pip install -r requirements.txt ruff pytest
ruff check . && pytest
python build_case.py <path to mimic-iv-clinical-database-demo-2.2> ../web/src/demo-case/sepsis-case.json
```

**Never commit credentialed MIMIC data or anything derived from it.** Only the open-access
demo may be used (see `web/src/demo-case/README.md`).
