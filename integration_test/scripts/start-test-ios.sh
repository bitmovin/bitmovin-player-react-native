#!/bin/bash
# Start iOS test by finding available iPhone simulator and executing cavy

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/packager-utils.sh"

trap cleanup_owned_packager EXIT
ensure_packager_running || exit 1
# Prefer an already-booted iPhone, otherwise select the first available one.
SIMULATOR=$(xcrun simctl list devices available -e -j | \
    jq --raw-output -s \
        '[.[].devices.[].[] | select(.deviceTypeIdentifier | contains("iPhone"))] | . as $devices | (([$devices[] | select(.state == "Booted")] | first) // ($devices | first)) // empty | [.udid, .name, .state] | @tsv')
IFS=$'\t' read -r SIMULATOR_UDID SIMULATOR_NAME SIMULATOR_STATE <<< "$SIMULATOR"

if [ -n "$SIMULATOR_UDID" ]; then
    if [ "$SIMULATOR_STATE" = "Shutdown" ]; then
        echo "Booting iOS simulator: $SIMULATOR_NAME"
        if ! xcrun simctl boot "$SIMULATOR_UDID"; then
            echo "Failed to boot iOS simulator: $SIMULATOR_NAME"
            exit 1
        fi
    fi

    if [ "$SIMULATOR_STATE" != "Booted" ]; then
        echo "Waiting for iOS simulator to finish booting..."
        if ! xcrun simctl bootstatus "$SIMULATOR_UDID" -b; then
            echo "iOS simulator did not finish booting: $SIMULATOR_NAME"
            exit 1
        fi
    fi

    echo "Running tests on iOS simulator: $SIMULATOR_NAME"
    yarn cavy run-ios --no-screenshots --keep-alive-timeout=300 --no-packager --udid "$SIMULATOR_UDID" "$@"
else
    echo "No iPhone simulator available"
    exit 1
fi
