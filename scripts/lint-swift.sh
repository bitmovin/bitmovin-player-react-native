#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

TARGETS=("$REPO_ROOT/ios")
if [ -d "$REPO_ROOT/packages/google-dai/ios" ]; then
  TARGETS+=("$REPO_ROOT/packages/google-dai/ios")
fi

swiftlint "${TARGETS[@]}" --strict --quiet
