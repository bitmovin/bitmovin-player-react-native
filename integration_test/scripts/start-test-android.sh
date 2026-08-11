#!/bin/bash
# Start Android test by ensuring an emulator and the packager are running, then executing Cavy.

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/packager-utils.sh"

android_emulator_id() {
    adb devices | grep -v List | grep device | grep emulator | head -n 1 | cut -f 1
}

trap cleanup_owned_packager EXIT

EMULATOR_ID=$(android_emulator_id)

if [ -z "$EMULATOR_ID" ]; then
    echo "No emulator running, starting one..."
    AVD_NAME=$(emulator -list-avds | head -n 1)
    if [ -z "$AVD_NAME" ]; then
        echo "No AVDs available. Please create an Android Virtual Device first."
        exit 1
    fi

    emulator -avd "$AVD_NAME" > /dev/null 2>&1 &
    adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done;'
    EMULATOR_ID=$(android_emulator_id)
fi

if [ -z "$EMULATOR_ID" ]; then
    echo "Failed to start or find Android emulator"
    exit 1
fi

ensure_packager_running || exit 1

echo "Running tests on emulator: $EMULATOR_ID"
ANDROID_SERIAL="$EMULATOR_ID" yarn cavy run-android --no-screenshots --keep-alive-timeout=300 --no-packager --deviceId "$EMULATOR_ID" "$@"
