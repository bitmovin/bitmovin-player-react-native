#!/bin/bash

# Run Android integration tests against an already-booted emulator or device.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/packager-utils.sh"

android_emulator_id() {
    adb devices | grep -v List | grep device | grep emulator | head -n 1 | cut -f 1
}

ARGS=$@
trap cleanup_owned_packager EXIT
ensure_packager_running || exit 1

EMULATOR_ID=$(android_emulator_id)

if [ -n "$EMULATOR_ID" ]; then
    echo "Running tests on emulator: $EMULATOR_ID"
    ANDROID_SERIAL="$EMULATOR_ID" yarn cavy run-android --no-screenshots --keep-alive-timeout=300 --no-packager --deviceId "$EMULATOR_ID" $ARGS
else
    echo "No Android emulator is running. Start one first or use ./scripts/start-test-android.sh for local workflows."
    exit 1
fi
