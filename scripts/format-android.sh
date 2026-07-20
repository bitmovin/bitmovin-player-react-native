#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT"
./android/gradlew -p android -b ktlint.gradle ktlintFormat

if [ -d "$REPO_ROOT/packages/google-dai/android" ]; then
  ./android/gradlew -p packages/google-dai/android -b ../../../android/ktlint.gradle ktlintFormat
fi
