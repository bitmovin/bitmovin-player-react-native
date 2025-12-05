#!/bin/bash
# Start iOS test by finding available iPhone simulator and executing cavy

ARGS=$@

# Get the first available iPhone simulator name
SIMULATOR_NAME=$(xcrun simctl list devices available -e -j | \
    jq --raw-output -s '[.[].devices.[].[] | select( .deviceTypeIdentifier | contains("iPhone") )|.name] | first')

if [ -n "$SIMULATOR_NAME" ] && [ "$SIMULATOR_NAME" != "null" ]; then
    echo "Running tests on iOS simulator: $SIMULATOR_NAME"
    yarn cavy run-ios --no-screenshots --keep-alive-timeout=300 --terminal="terminal" --simulator "$SIMULATOR_NAME" $ARGS
else
    echo "No iPhone simulator available"
    exit 1
fi
