"""Build the sepsis POC case from the open-access MIMIC-IV demo.

Usage:
    python build_case.py <path to mimic-iv-clinical-database-demo-2.2> <output.json>

Only the open-access demo (ODbL) may be used here. Never point this at
credentialed MIMIC-IV: its output is committed to a public repo.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

from matching import ACTIONS, VITALS, TrajectoryMatcher, build_transitions, simulate_tree

SEPSIS_ICD9 = ("038", "99591", "99592", "78552")
SEPSIS_ICD10 = ("A40", "A41", "R6520", "R6521")

# icu/d_items item ids
VITAL_ITEMS = {
    220045: "hr",
    220052: "map_art",
    220181: "map_nibp",
    220210: "rr",
    220277: "spo2",
    223761: "temp_f",
    223762: "temp_c",
}
PRESSOR_ITEMS = {221906, 222315, 221749, 221289, 221662}  # norepi, vasopressin, phenylephrine, epi, dopamine
FLUID_BOLUS_CATEGORY = "03-IV Fluid Bolus"  # inputevents.ordercategoryname

# hosp/d_labitems item ids for the chart's lab panel
LAB_ITEMS = {50813: "lactate", 51301: "wbc", 50912: "creatinine", 50983: "sodium", 50971: "potassium"}

MAX_HOURS = 72  # only the first three ICU days are used for matching
TREE_DEPTH = 6
K = 8  # neighbors averaged per step


def sepsis_stays(demo: Path) -> pd.DataFrame:
    dx = pd.read_csv(demo / "hosp/diagnoses_icd.csv.gz", dtype={"icd_code": str})
    code = dx["icd_code"].str.strip()
    is_sepsis = ((dx["icd_version"] == 9) & code.str.startswith(SEPSIS_ICD9)) | (
        (dx["icd_version"] == 10) & code.str.startswith(SEPSIS_ICD10)
    )
    hadms = set(dx[is_sepsis & (dx["seq_num"] <= 3)]["hadm_id"])
    icu = pd.read_csv(demo / "icu/icustays.csv.gz", parse_dates=["intime", "outtime"])
    return icu[icu["hadm_id"].isin(hadms)].reset_index(drop=True)


def hourly_vitals(demo: Path, stays: pd.DataFrame) -> pd.DataFrame:
    ce = pd.read_csv(
        demo / "icu/chartevents.csv.gz",
        usecols=["stay_id", "charttime", "itemid", "valuenum"],
        parse_dates=["charttime"],
    )
    ce = ce[ce["stay_id"].isin(stays["stay_id"]) & ce["itemid"].isin(VITAL_ITEMS)].dropna(subset=["valuenum"])
    ce = ce.merge(stays[["stay_id", "intime"]], on="stay_id")
    ce["hour"] = ((ce["charttime"] - ce["intime"]).dt.total_seconds() // 3600).astype(int)
    ce = ce[(ce["hour"] >= 0) & (ce["hour"] < MAX_HOURS)]
    ce["name"] = ce["itemid"].map(VITAL_ITEMS)
    wide = ce.pivot_table(index=["stay_id", "hour"], columns="name", values="valuenum", aggfunc="median")
    wide["map"] = wide.get("map_art").combine_first(wide.get("map_nibp"))
    temp_from_c = wide.get("temp_c") * 9 / 5 + 32
    wide["temp_f"] = wide.get("temp_f").combine_first(temp_from_c)
    # Vitals are charted every 1-4 hours; carry the last value forward up to 4 hours.
    filled = []
    for stay_id, g in wide[VITALS].groupby(level="stay_id"):
        g = g.droplevel("stay_id")
        g = g.reindex(range(int(g.index.max()) + 1)).ffill(limit=4)
        # A 3-hour rolling median removes one-off charting spikes and dips.
        g = g.rolling(3, center=True, min_periods=1).median()
        filled.append(g.rename_axis("hour").reset_index().assign(stay_id=stay_id))
    wide = pd.concat(filled, ignore_index=True)
    # Drop physiologically impossible charting errors.
    wide = wide[wide["map"].between(20, 200) & wide["hr"].between(20, 250) & wide["temp_f"].between(85, 110)]
    return wide.dropna(subset=VITALS)


def hourly_actions(demo: Path, stays: pd.DataFrame) -> pd.DataFrame:
    """Label each stay-hour as none / fluids / pressor, and note antibiotic hours."""
    items = pd.read_csv(demo / "icu/d_items.csv.gz")
    abx_items = set(items[items["category"] == "Antibiotics"]["itemid"])
    ie = pd.read_csv(
        demo / "icu/inputevents.csv.gz",
        usecols=["stay_id", "starttime", "endtime", "itemid", "ordercategoryname"],
        parse_dates=["starttime", "endtime"],
    )
    ie = ie[ie["stay_id"].isin(stays["stay_id"])].merge(stays[["stay_id", "intime"]], on="stay_id")
    ie["h0"] = ((ie["starttime"] - ie["intime"]).dt.total_seconds() // 3600).astype(int)
    ie["h1"] = ((ie["endtime"] - ie["intime"]).dt.total_seconds() // 3600).astype(int)
    rows = []
    for r in ie.itertuples():
        for h in range(max(r.h0, 0), min(r.h1, MAX_HOURS - 1) + 1):
            rows.append(
                {
                    "stay_id": r.stay_id,
                    "hour": h,
                    "pressor": r.itemid in PRESSOR_ITEMS,
                    "abx": r.itemid in abx_items and h == r.h0,
                    "bolus": r.ordercategoryname == FLUID_BOLUS_CATEGORY and h == r.h0,
                }
            )
    per_hour = (
        pd.DataFrame(rows)
        .groupby(["stay_id", "hour"])
        .agg(pressor=("pressor", "any"), abx=("abx", "any"), bolus=("bolus", "any"))
    )
    per_hour["action"] = "none"
    per_hour.loc[per_hour["bolus"], "action"] = "fluids"
    per_hour.loc[per_hour["pressor"], "action"] = "pressor"
    return per_hour.reset_index()


def pick_index_stay(hourly: pd.DataFrame) -> tuple[int, int]:
    """Choose the case patient: a textbook septic picture in the first 12 ICU hours.

    Fever (>= 100.4 F), HR > 100, RR > 20 and MAP < 65 in the same hour, so the
    student sees the classic signs. Among those hours, the lowest MAP wins.
    Returns (stay_id, start hour).
    """
    early = hourly[hourly["hour"] < 12]
    candidates = early[(early["temp_f"] >= 100.4) & (early["hr"] > 100) & (early["rr"] > 20) & (early["map"] < 65)]
    if candidates.empty:
        raise SystemExit("no stay matches the index-case rule; relax it")
    best = candidates.sort_values(["map", "hour"]).iloc[0]
    return int(best["stay_id"]), int(best["hour"])


def real_course(hourly: pd.DataFrame, actions: pd.DataFrame, stay_id: int, start: int) -> list[dict]:
    """What actually happened to the case patient over the same hours."""
    h = hourly[(hourly["stay_id"] == stay_id) & hourly["hour"].between(start, start + TREE_DEPTH)]
    a = actions[actions["stay_id"] == stay_id].set_index("hour")
    out = []
    for r in h.itertuples():
        act = a.loc[r.hour] if r.hour in a.index else None
        out.append(
            {
                "hour": int(r.hour - start),
                "state": {v: round(float(getattr(r, v)), 1) for v in VITALS},
                "action": act["action"] if act is not None else "none",
                "antibiotic_started": bool(act["abx"]) if act is not None else False,
            }
        )
    return out


def admission_labs(demo: Path, stays: pd.DataFrame, stay_id: int) -> dict:
    stay = stays[stays["stay_id"] == stay_id].iloc[0]
    labs = pd.read_csv(
        demo / "hosp/labevents.csv.gz",
        usecols=["hadm_id", "itemid", "charttime", "valuenum", "valueuom"],
        parse_dates=["charttime"],
    )
    labs = labs[(labs["hadm_id"] == stay["hadm_id"]) & labs["itemid"].isin(LAB_ITEMS)].dropna(subset=["valuenum"])
    # Closest result to ICU admission, within 24 hours either side.
    labs["gap"] = (labs["charttime"] - stay["intime"]).abs()
    labs = labs[labs["gap"] <= pd.Timedelta(hours=24)].sort_values("gap")
    first = labs.groupby("itemid").first()
    return {LAB_ITEMS[i]: {"value": round(float(r.valuenum), 1), "unit": r.valueuom} for i, r in first.iterrows()}


def main(demo_dir: str, out_path: str) -> None:
    demo = Path(demo_dir)
    stays = sepsis_stays(demo)
    hourly = hourly_vitals(demo, stays)
    actions = hourly_actions(demo, stays)
    labeled = hourly.merge(actions[["stay_id", "hour", "action"]], on=["stay_id", "hour"], how="left")
    labeled["action"] = labeled["action"].fillna("none")

    # Anonymous labels for the matched stays, so the UI never shows MIMIC ids.
    alias = {sid: f"ICU stay {i + 1}" for i, sid in enumerate(sorted(stays["stay_id"]))}
    labeled["stay"] = labeled["stay_id"].map(alias)

    transitions = build_transitions(labeled)
    index_stay, start_hour = pick_index_stay(hourly)
    matcher = TrajectoryMatcher(transitions, k=K, exclude_stay=alias[index_stay])

    start_row = hourly[(hourly["stay_id"] == index_stay) & (hourly["hour"] == start_hour)].iloc[0]
    start = {v: round(float(start_row[v]), 1) for v in VITALS}
    prev_row = hourly[(hourly["stay_id"] == index_stay) & (hourly["hour"] == start_hour - 1)]
    start_map_change = float(start_row["map"] - prev_row.iloc[0]["map"]) if len(prev_row) else 0.0
    tree = simulate_tree(matcher, start, TREE_DEPTH, start_map_change)

    patients = pd.read_csv(demo / "hosp/patients.csv.gz")
    subject = stays[stays["stay_id"] == index_stay].iloc[0]["subject_id"]
    person = patients[patients["subject_id"] == subject].iloc[0]

    counts = transitions["action"].value_counts().to_dict()
    output = {
        "source": {
            "dataset": "MIMIC-IV Clinical Database Demo v2.2",
            "url": "https://physionet.org/content/mimic-iv-demo/2.2/",
            "license": "Open Data Commons Open Database License v1.0 (ODbL)",
            "citation": "Johnson, A., Bulgarelli, L., Pollard, T., Horng, S., Celi, L. A., & Mark, R. (2023). "
            "MIMIC-IV Clinical Database Demo (version 2.2). PhysioNet.",
        },
        "matching": {
            "method": "k-nearest neighbors on standardized vitals, same action, averaged next-hour change",
            "k": matcher.k,
            "sepsis_stays": int(len(stays)),
            "moments_by_action": {a: int(counts.get(a, 0)) for a in ACTIONS},
            "index_stay_excluded": True,
        },
        "patient": {"age": int(person["anchor_age"]), "sex": person["gender"], "case_stay": alias[index_stay]},
        "labs": admission_labs(demo, stays, index_stay),
        "start": start,
        "tree": tree,
        "real_course": real_course(hourly, actions, index_stay, start_hour),
    }
    Path(out_path).write_text(json.dumps(output, separators=(",", ":")) + "\n")
    print(f"index stay {alias[index_stay]} start hour {start_hour}: {start}")
    print(f"moments by action: {output['matching']['moments_by_action']}, tree nodes: {len(tree)}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
