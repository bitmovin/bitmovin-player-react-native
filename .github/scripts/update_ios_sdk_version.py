#!/usr/bin/env python3
"""Update the iOS Player version shared by the podspec and Expo config plugin."""
import json
import re
import sys
from pathlib import Path


def update_version(manifest: Path, version: str) -> None:
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", version):
        raise ValueError(f"Invalid SDK version: {version}")

    dependencies = json.loads(manifest.read_text())
    if dependencies["player"]["version"] == version:
        raise ValueError(f"Player is already at {version}; no update made")

    dependencies["player"]["version"] = version
    manifest.write_text(json.dumps(dependencies, indent=2) + "\n")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: update_ios_sdk_version.py <version>")

    manifest = Path(__file__).resolve().parents[2] / "ios" / "dependencies.json"
    try:
        update_version(manifest, sys.argv[1])
    except ValueError as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
