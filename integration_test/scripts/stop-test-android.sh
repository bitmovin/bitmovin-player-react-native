#!/bin/bash
# Stop Android test by killing packager and force-stopping the test app

# Stop the packager first
./scripts/stop-packager.sh

# Get the first available Android emulator ID
EMULATOR_ID="$(adb devices | grep -v List | grep device | grep emulator | head -n 1 | cut -f 1)"

# Force stop the test app if emulator is available
if [ -n "$EMULATOR_ID" ]; then
    adb -s "$EMULATOR_ID" shell am force-stop com.bitmovin.player.reactnative.integrationtest
fi

exit 0