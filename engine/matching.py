"""Nearest-neighbor trajectory matching for the sepsis POC.

The idea in one paragraph: every hour of every real ICU stay is a "moment".
A moment has a patient state (five vitals) and an action (what the care team
was doing that hour: nothing, a fluid bolus, or a vasopressor). When the
student picks an action for the simulated patient, we find the k real moments
with the same action whose state is closest to the simulated state, average how
their vitals changed over the next hour, and apply that change.

This file has no MIMIC-specific code, so it can be unit-tested with made-up data.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors

VITALS = ["hr", "map", "rr", "spo2", "temp_f"]
# Matching also looks at how MAP moved over the last hour. Without it, a brief
# dip that bounced back looks the same as sustained shock, and "do nothing"
# wrongly appears to fix low blood pressure.
FEATURES = VITALS + ["map_change"]
ACTIONS = ["none", "fluids", "pressor"]

# Keep simulated vitals inside ranges a monitor could show.
LIMITS = {
    "hr": (30, 180),
    "map": (30, 130),
    "rr": (6, 45),
    "spo2": (70, 100),
    "temp_f": (93, 106),
}


@dataclass
class Match:
    """One real moment used to predict the next hour."""

    stay: str
    hour: int
    distance: float


def build_transitions(hourly: pd.DataFrame) -> pd.DataFrame:
    """Pair each hour with the next hour of the same stay.

    `hourly` needs columns: stay, hour, action, and every name in VITALS.
    Returns one row per moment that has a next hour, with `d_<vital>` deltas.
    """
    hourly = hourly.sort_values(["stay", "hour"]).copy()
    prev = hourly.groupby("stay")[["map", "hour"]].shift(1)
    has_prev = prev["hour"] == hourly["hour"] - 1
    hourly["map_change"] = (hourly["map"] - prev["map"]).where(has_prev, 0.0)
    nxt = hourly.groupby("stay")[VITALS + ["hour"]].shift(-1)
    consecutive = nxt["hour"] == hourly["hour"] + 1
    out = hourly[consecutive].copy()
    for v in VITALS:
        out[f"d_{v}"] = nxt.loc[consecutive, v] - hourly.loc[consecutive, v]
    return out.reset_index(drop=True)


class TrajectoryMatcher:
    """Predicts the next hour of vitals from real moments with the same action."""

    def __init__(self, transitions: pd.DataFrame, k: int = 5, exclude_stay: str | None = None):
        data = transitions
        if exclude_stay is not None:
            data = data[data["stay"] != exclude_stay]
        # Standardize so a 10 bpm change in HR and a 10 mmHg change in MAP
        # count about as much as their usual spread says they should.
        self.mean = data[FEATURES].mean()
        self.std = data[FEATURES].std().replace(0, 1)
        self.k = k
        self._by_action: dict[str, tuple[NearestNeighbors, pd.DataFrame]] = {}
        for action in ACTIONS:
            rows = data[data["action"] == action].reset_index(drop=True)
            if len(rows) == 0:
                continue
            nn = NearestNeighbors(n_neighbors=min(k, len(rows)))
            nn.fit(self._scale(rows[FEATURES]))
            self._by_action[action] = (nn, rows)

    def _scale(self, frame: pd.DataFrame) -> np.ndarray:
        return ((frame - self.mean) / self.std).to_numpy()

    def step(
        self, state: dict[str, float], action: str, map_change: float = 0.0
    ) -> tuple[dict[str, float], list[Match]]:
        """Return the predicted next-hour state and the real moments it came from.

        `map_change` is how much MAP moved in the hour before `state`.
        """
        if action not in self._by_action:
            raise ValueError(f"no real moments for action {action!r}")
        nn, rows = self._by_action[action]
        query = self._scale(pd.DataFrame([{**state, "map_change": map_change}])[FEATURES])
        dist, idx = nn.kneighbors(query)
        picked = rows.iloc[idx[0]]
        new_state = {}
        for v in VITALS:
            lo, hi = LIMITS[v]
            value = state[v] + float(picked[f"d_{v}"].mean())
            new_state[v] = round(min(max(value, lo), hi), 1)
        matches = [
            Match(stay=str(r.stay), hour=int(r.hour), distance=round(float(d), 3))
            for r, d in zip(picked.itertuples(), dist[0], strict=True)
        ]
        return new_state, matches


def simulate_tree(
    matcher: TrajectoryMatcher, start: dict[str, float], depth: int, start_map_change: float = 0.0
) -> dict[str, dict]:
    """Precompute every action path up to `depth` hours.

    Keys are paths like "" (start), "fluids", "fluids/pressor". Each value has
    the state at the end of that path and the matches that produced it.
    """
    tree: dict[str, dict] = {"": {"state": start, "matches": []}}
    frontier = [""]
    for _ in range(depth):
        nxt_frontier = []
        for path in frontier:
            state = tree[path]["state"]
            parent = path.rpartition("/")[0] if "/" in path else ""
            map_change = state["map"] - tree[parent]["state"]["map"] if path else start_map_change
            for action in ACTIONS:
                if action not in matcher._by_action:
                    continue
                new_state, matches = matcher.step(state, action, map_change)
                key = f"{path}/{action}" if path else action
                tree[key] = {"state": new_state, "matches": [[m.stay, m.hour, m.distance] for m in matches]}
                nxt_frontier.append(key)
        frontier = nxt_frontier
    return tree
