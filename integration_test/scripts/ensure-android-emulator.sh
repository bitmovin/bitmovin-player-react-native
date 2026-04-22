#!/bin/bash

# Ensure an Android emulator is booted and print its device ID to stdout.

android_emulator_id() {
    adb devices | grep -v List | grep device | grep emulator | head -n 1 | cut -f 1
}

EMULATOR_ID=$(android_emulator_id)

if [ -z "$EMULATOR_ID" ]; then
    echo "No emulator running, starting one..."
    AVD_NAME=$(emulator -list-avds | head -n 1)
    if [ -n "$AVD_NAME" ]; then
        emulator -avd "$AVD_NAME" 1> /dev/null 2> /dev/null &
        adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done;'
        EMULATOR_ID=$(android_emulator_id)
    else
        echo "No AVDs available. Please create an Android Virtual Device first."
        exit 1
    fi
fi

if [ -n "$EMULATOR_ID" ]; then
    echo "$EMULATOR_ID"
else
    echo "Failed to start or find Android emulator"
    exit 1
fi
