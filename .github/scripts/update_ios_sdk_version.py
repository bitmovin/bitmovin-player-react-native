#!/usr/bin/env python3
"""Update the version consumed by both the podspec and Expo config plugin."""
import json
import re
import sys
from pathlib import Path

version = sys.argv[1]
if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", version):
    raise SystemExit(f"Invalid SDK version: {version}")
manifest = Path(__file__).resolve().parents[2] / "ios" / "dependencies.json"
dependencies = json.loads(manifest.read_text())
if dependencies["player"]["version"] == version:
    raise SystemExit(f"Player is already at {version}; no update made")
dependencies["player"]["version"] = version
manifest.write_text(json.dumps(dependencies, indent=2) + "\n")
