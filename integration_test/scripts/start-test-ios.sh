#!/bin/bash
# Start iOS test by finding available iPhone simulator and executing cavy

ARGS=$@
PACKAGER_PID=""

cleanup_packager() {
    if [ -n "$PACKAGER_PID" ] && kill -0 "$PACKAGER_PID" 2>/dev/null; then
        echo "Stopping Metro packager (pid: $PACKAGER_PID)"
        kill "$PACKAGER_PID" 2>/dev/null || true
    fi
}

ensure_packager_running() {
    if lsof -ti:8081 >/dev/null 2>&1; then
        echo "Using existing Metro packager on port 8081"
        return
    fi

    echo "Starting Metro packager on port 8081..."
    npx react-native start --port 8081 > /tmp/bitmovin-integration-test-metro.log 2>&1 &
    PACKAGER_PID=$!

    for _ in {1..30}; do
        if lsof -ti:8081 >/dev/null 2>&1; then
            echo "Metro packager is ready"
            return
        fi
        sleep 1
    done

    echo "Failed to start Metro packager. Check /tmp/bitmovin-integration-test-metro.log"
    exit 1
}

trap cleanup_packager EXIT
ensure_packager_running

# Get the first available iPhone simulator name
SIMULATOR_NAME=$(xcrun simctl list devices available -e -j | \
    jq --raw-output -s '[.[].devices.[].[] | select( .deviceTypeIdentifier | contains("iPhone") )|.name] | first')

if [ -n "$SIMULATOR_NAME" ] && [ "$SIMULATOR_NAME" != "null" ]; then
    echo "Running tests on iOS simulator: $SIMULATOR_NAME"
    yarn cavy run-ios --no-screenshots --keep-alive-timeout=300 --no-packager --simulator "$SIMULATOR_NAME" $ARGS
else
    echo "No iPhone simulator available"
    exit 1
fi
