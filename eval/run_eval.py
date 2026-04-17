"""
Evaluation harness.

You supply a folder of (jd.txt, resume.pdf, human_score.json) triples.
This script runs the scorer and reports Spearman correlation and MAE
between model scores and your own scores.

Usage:
    python eval/run_eval.py --data-dir eval/data

Folder structure:
    eval/data/
        case_001/
            jd.txt
            resume.pdf
            human_score.json    (contains {"score": 7.5})
        case_002/
            ...

This is how you defensibly say "validated on N pairs" on your resume.
Do not skip this step. Start with 10 cases. Grow to 30-50.
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.parsing import parse_upload
from backend.app.scoring import score_resume


async def run_case(case_dir: Path) -> dict | None:
    jd_path = case_dir / "jd.txt"
    human_path = case_dir / "human_score.json"

    resume_path = next(
        (p for p in case_dir.iterdir() if p.name.startswith("resume")), None
    )
    if not (jd_path.exists() and resume_path and human_path.exists()):
        print(f"SKIP {case_dir.name}: missing files")
        return None

    jd_text = jd_path.read_text(encoding="utf-8")
    resume_text = parse_upload(resume_path.name, resume_path.read_bytes())
    human = json.loads(human_path.read_text())

    result = await score_resume(jd_text, resume_text)
    return {
        "case": case_dir.name,
        "human": float(human["score"]),
        "model": result["final_score"],
        "verdict": result["verdict"],
        "time_s": result["processing_time_seconds"],
    }


def spearman(xs: list[float], ys: list[float]) -> float:
    """Simple Spearman rank correlation. No scipy dependency."""
    def rank(v):
        s = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        for rank_idx, orig_idx in enumerate(s):
            r[orig_idx] = rank_idx + 1
        return r

    rx, ry = rank(xs), rank(ys)
    n = len(xs)
    d2 = sum((a - b) ** 2 for a, b in zip(rx, ry))
    return 1 - (6 * d2) / (n * (n * n - 1)) if n > 1 else 0.0


def mae(xs: list[float], ys: list[float]) -> float:
    return sum(abs(a - b) for a, b in zip(xs, ys)) / len(xs)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="eval/data")
    args = parser.parse_args()

    root = Path(args.data_dir)
    if not root.exists():
        print(f"No such folder: {root}")
        return

    cases = sorted(d for d in root.iterdir() if d.is_dir())
    print(f"Found {len(cases)} cases\n")

    results = []
    for c in cases:
        print(f"Running {c.name}...", flush=True)
        try:
            r = await run_case(c)
            if r:
                results.append(r)
                print(f"  human={r['human']:.1f}  model={r['model']:.1f}  ({r['time_s']}s)")
        except Exception as e:
            print(f"  ERROR: {e}")

    if not results:
        print("\nNo successful cases.")
        return

    humans = [r["human"] for r in results]
    models = [r["model"] for r in results]
    rho = spearman(humans, models)
    err = mae(humans, models)

    print("\n" + "=" * 50)
    print(f"N = {len(results)}")
    print(f"Spearman rank correlation: {rho:.3f}")
    print(f"Mean absolute error: {err:.2f} / 10")
    print("=" * 50)

    out = Path(args.data_dir) / "results.json"
    out.write_text(json.dumps({"cases": results, "spearman": rho, "mae": err}, indent=2))
    print(f"\nSaved to {out}")


if __name__ == "__main__":
    asyncio.run(main())
