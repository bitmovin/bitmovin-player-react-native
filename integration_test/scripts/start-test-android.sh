#!/bin/bash
# Start Android test by ensuring emulator is running and executing cavy

ARGS=$@

# Check if emulator is already running
EMULATOR_ID=$(adb devices | grep -v List | grep device | grep emulator | head -n 1 | cut -f 1)

# If no emulator is running, start one
if [ -z "$EMULATOR_ID" ]; then
    echo "No emulator running, starting one..."
    # Get the first available AVD and start it
    AVD_NAME=$(emulator -list-avds | head -n 1)
    if [ -n "$AVD_NAME" ]; then
        emulator -avd "$AVD_NAME" 1> /dev/null 2> /dev/null &
        # Wait for device to be ready
        adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done;'
        # Get the emulator ID after it's started
        EMULATOR_ID=$(adb devices | grep -v List | grep device | grep emulator | head -n 1 | cut -f 1)
    else
        echo "No AVDs available. Please create an Android Virtual Device first."
        exit 1
    fi
fi

# Run cavy with the emulator
if [ -n "$EMULATOR_ID" ]; then
    echo "Running tests on emulator: $EMULATOR_ID"
    ANDROID_SERIAL="$EMULATOR_ID" yarn cavy run-android --no-screenshots --keep-alive-timeout=300 --terminal="terminal" --deviceId "$EMULATOR_ID" $ARGS
else
    echo "Failed to start or find Android emulator"
    exit 1
fi
