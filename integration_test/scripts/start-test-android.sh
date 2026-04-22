#!/bin/bash
# Start Android test by ensuring an emulator is running, then executing cavy.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

"$SCRIPT_DIR/ensure-android-emulator.sh" >/dev/null || exit 1
"$SCRIPT_DIR/run-test-android.sh" "$@"
