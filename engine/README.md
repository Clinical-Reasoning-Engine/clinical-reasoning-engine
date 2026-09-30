# engine/

Python code for the trajectory-matching engine (owner: Arad).

Built and tested offline, then exported into the SQLite case library the web app reads.

When the first code lands here, add:

- `requirements.txt`
- at least one test in `tests/`

and uncomment the `engine` job in `.github/workflows/ci.yml` so CI runs `ruff` and `pytest` on it.

**Never commit MIMIC data or anything derived from it** (see the root `.gitignore`).
