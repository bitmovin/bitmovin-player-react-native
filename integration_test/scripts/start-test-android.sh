#!/bin/bash
# Start Android test by ensuring an emulator and the packager are running, then executing Cavy.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/packager-utils.sh"

trap cleanup_owned_packager EXIT

EMULATOR_ID=$("$SCRIPT_DIR/ensure-android-emulator.sh") || exit 1
ensure_packager_running || exit 1

echo "Running tests on emulator: $EMULATOR_ID"
ANDROID_SERIAL="$EMULATOR_ID" yarn cavy run-android --no-screenshots --keep-alive-timeout=300 --no-packager --deviceId "$EMULATOR_ID" "$@"
