"""Tests for matching.py using small made-up stays (no MIMIC data)."""

import sys
from pathlib import Path

import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from matching import ACTIONS, TrajectoryMatcher, build_transitions, simulate_tree  # noqa: E402


def fake_hourly() -> pd.DataFrame:
    """Two stays: on a pressor, MAP rises 5 per hour; with nothing, MAP falls 2 per hour."""
    rows = []
    for stay, action, step in [("A", "pressor", 5.0), ("B", "none", -2.0), ("C", "fluids", 1.0)]:
        for hour in range(6):
            rows.append(
                {
                    "stay": stay,
                    "hour": hour,
                    "action": action,
                    "hr": 110.0 - hour,
                    "map": 55.0 + step * hour,
                    "rr": 24.0,
                    "spo2": 95.0,
                    "temp_f": 101.0,
                }
            )
    return pd.DataFrame(rows)


def test_build_transitions_pairs_consecutive_hours():
    t = build_transitions(fake_hourly())
    assert len(t) == 15  # 5 transitions per stay
    assert set(t[t["stay"] == "A"]["d_map"]) == {5.0}
    assert set(t[t["stay"] == "B"]["d_map"]) == {-2.0}


def test_build_transitions_skips_gaps():
    hourly = fake_hourly()
    hourly = hourly[~((hourly["stay"] == "A") & (hourly["hour"] == 3))]
    t = build_transitions(hourly)
    a_hours = sorted(t[t["stay"] == "A"]["hour"])
    assert a_hours == [0, 1, 4]  # 2->4 and 3->4 are not one hour apart


def test_step_uses_only_moments_with_the_same_action():
    matcher = TrajectoryMatcher(build_transitions(fake_hourly()), k=3)
    state = {"hr": 108.0, "map": 57.0, "rr": 24.0, "spo2": 95.0, "temp_f": 101.0}
    up, matches = matcher.step(state, "pressor")
    down, _ = matcher.step(state, "none")
    assert up["map"] == pytest.approx(62.0)
    assert down["map"] == pytest.approx(55.0)
    assert all(m.stay == "A" for m in matches)


def test_step_clamps_to_monitor_limits():
    matcher = TrajectoryMatcher(build_transitions(fake_hourly()), k=1)
    state = {"hr": 108.0, "map": 128.0, "rr": 24.0, "spo2": 95.0, "temp_f": 101.0}
    up, _ = matcher.step(state, "pressor")
    assert up["map"] == 130


def test_excluded_stay_is_never_matched():
    matcher = TrajectoryMatcher(build_transitions(fake_hourly()), k=3, exclude_stay="A")
    with pytest.raises(ValueError):
        matcher.step({"hr": 100.0, "map": 60.0, "rr": 20.0, "spo2": 95.0, "temp_f": 99.0}, "pressor")


def test_simulate_tree_has_every_path():
    matcher = TrajectoryMatcher(build_transitions(fake_hourly()), k=2)
    start = {"hr": 110.0, "map": 55.0, "rr": 24.0, "spo2": 95.0, "temp_f": 101.0}
    tree = simulate_tree(matcher, start, depth=2)
    assert len(tree) == 1 + len(ACTIONS) + len(ACTIONS) ** 2
    assert "pressor/none" in tree
    assert tree["pressor/pressor"]["state"]["map"] > tree["none/none"]["state"]["map"]
