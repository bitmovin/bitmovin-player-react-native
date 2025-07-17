#!/bin/bash
# Stop iOS test by killing packager and terminating the test app on simulators

# Stop the packager first
./scripts/stop-packager.sh

# Get all booted iPhone simulators and terminate the test app
xcrun simctl list devices available -e -j | \
    jq --raw-output '.devices.[].[] | select( .state == "Booted" and (.deviceTypeIdentifier | contains("iPhone"))).udid' | \
    xargs -I UDID xcrun simctl terminate UDID com.bitmovin.player.reactnative.IntegrationTest 2> /dev/null

exit 0