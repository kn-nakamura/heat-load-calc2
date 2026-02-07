from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


REQUIRED_FILES = [
    "design_outdoor_conditions.json",
    "execution_temperature_difference.json",
    "standard_solar_gain.json",
    "aluminum_sash_infiltration.json",
    "others_tables.json",
]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save(path: Path, payload: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def _copy_if_requested(source_dir: Path | None, out_dir: Path) -> None:
    if source_dir is None:
        return
    if not source_dir.exists():
        raise FileNotFoundError(f"source_dir not found: {source_dir}")
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in REQUIRED_FILES:
        src = source_dir / name
        if not src.exists():
            raise FileNotFoundError(f"required reference file missing in source_dir: {src}")
        shutil.copy2(src, out_dir / name)


def _normalize_metadata(out_dir: Path, version: str) -> None:
    for name in REQUIRED_FILES:
        path = out_dir / name
        if not path.exists():
            raise FileNotFoundError(f"required reference file missing: {path}")
        payload = _load(path)
        metadata = payload.get("metadata", {})
        metadata.update(
            {
                "version": version,
                "source_file": "bundled_reference_data",
                "source_sheet": "n/a",
                "generated_at": _timestamp(),
            }
        )
        payload["metadata"] = metadata
        _save(path, payload)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Normalize bundled reference_data JSON metadata. "
            "No Excel workbook is required."
        )
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "backend" / "reference_data",
        help="Output directory for normalized reference JSON files.",
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=None,
        help="Optional source directory to copy reference JSON files from before normalization.",
    )
    parser.add_argument(
        "--version",
        default="mvp-0.2",
        help="Metadata version string to write into each JSON file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    out_dir: Path = args.out_dir
    source_dir: Path | None = args.source_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    _copy_if_requested(source_dir, out_dir)
    _normalize_metadata(out_dir, version=args.version)

    print(f"Reference data normalized in: {out_dir}")
    if source_dir is None:
        print("Mode: in-place metadata normalization (no Excel used).")
    else:
        print(f"Mode: copied from {source_dir} and normalized.")


if __name__ == "__main__":
    main()
