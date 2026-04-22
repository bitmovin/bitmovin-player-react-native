#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
INTEGRATION_TEST_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
PACKAGER_PORT=8081
PACKAGER_PID_FILE="${TMPDIR:-/tmp}/bitmovin-integration-test-packager.pid"
PACKAGER_LOG_FILE="${TMPDIR:-/tmp}/bitmovin-integration-test-metro.log"
PACKAGER_STARTED_BY_SCRIPT=0

packager_pid_on_port() {
    lsof -ti:"$PACKAGER_PORT" 2>/dev/null | head -n 1
}

packager_process_command() {
    local pid="$1"
    ps -o command= -p "$pid" 2>/dev/null
}

packager_process_cwd() {
    local pid="$1"
    lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

packager_process_matches_project() {
    local pid="$1"
    local command
    local cwd

    command=$(packager_process_command "$pid")
    if [ -z "$command" ]; then
        return 1
    fi

    case "$command" in
        *"expo start"*|*"expo/bin/cli start"*|*"@expo/cli"*)
            ;;
        *)
            return 1
            ;;
    esac

    if printf '%s' "$command" | grep -F "$INTEGRATION_TEST_DIR" >/dev/null 2>&1; then
        return 0
    fi

    cwd=$(packager_process_cwd "$pid")
    [ "$cwd" = "$INTEGRATION_TEST_DIR" ]
}

kill_packager_pid() {
    local pid="$1"

    if ! kill -0 "$pid" 2>/dev/null; then
        return 0
    fi

    echo "Stopping integration_test packager (pid: $pid)"
    kill "$pid" 2>/dev/null || true
    sleep 1

    if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
    fi
}

cleanup_owned_packager() {
    local pid

    if [ "$PACKAGER_STARTED_BY_SCRIPT" != "1" ]; then
        return
    fi

    pid=$(cat "$PACKAGER_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && packager_process_matches_project "$pid"; then
        kill_packager_pid "$pid"
    fi

    rm -f "$PACKAGER_PID_FILE"
}

ensure_packager_running() {
    local pid

    pid=$(packager_pid_on_port)
    if [ -n "$pid" ]; then
        if packager_process_matches_project "$pid"; then
            echo "Using existing integration_test Expo packager on port $PACKAGER_PORT (pid: $pid)"
            return 0
        fi

        echo "Port $PACKAGER_PORT is already in use by a different process. Stop it before running integration tests."
        return 1
    fi

    echo "Starting integration_test Expo packager on port $PACKAGER_PORT..."
    (
        cd "$INTEGRATION_TEST_DIR" || exit 1
        npx expo start --port "$PACKAGER_PORT" --localhost > "$PACKAGER_LOG_FILE" 2>&1 &
        echo "$!" > "$PACKAGER_PID_FILE"
    )

    PACKAGER_STARTED_BY_SCRIPT=1

    for _ in {1..30}; do
        pid=$(packager_pid_on_port)
        if [ -n "$pid" ] && packager_process_matches_project "$pid"; then
            echo "Integration test Expo packager is ready"
            return 0
        fi
        sleep 1
    done

    echo "Failed to start integration_test Expo packager. Check $PACKAGER_LOG_FILE"
    cleanup_owned_packager
    return 1
}

stop_integration_test_packager() {
    local pid

    pid=$(cat "$PACKAGER_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && packager_process_matches_project "$pid"; then
        kill_packager_pid "$pid"
        rm -f "$PACKAGER_PID_FILE"
        return 0
    fi

    pid=$(packager_pid_on_port)
    if [ -n "$pid" ] && packager_process_matches_project "$pid"; then
        kill_packager_pid "$pid"
        rm -f "$PACKAGER_PID_FILE"
        return 0
    fi

    rm -f "$PACKAGER_PID_FILE"
    echo "No integration_test Expo packager found"
}
