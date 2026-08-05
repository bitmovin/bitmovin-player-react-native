#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
INTEGRATION_TEST_DIR=$(cd "$SCRIPT_DIR/.." && pwd -P)
PACKAGER_PORT=8081
PACKAGER_STATE_ID=$(printf '%s' "$INTEGRATION_TEST_DIR" | cksum | awk '{print $1 "-" $2}')
PACKAGER_PID_FILE="${TMPDIR:-/tmp}/bitmovin-integration-test-packager-${PACKAGER_STATE_ID}.pid"
PACKAGER_LOG_FILE="${TMPDIR:-/tmp}/bitmovin-integration-test-metro-${PACKAGER_STATE_ID}.log"
PACKAGER_STARTED_BY_SCRIPT=0
PACKAGER_STARTED_PID=""

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
    local recorded_pid

    if [ "$PACKAGER_STARTED_BY_SCRIPT" != "1" ]; then
        return
    fi

    pid="$PACKAGER_STARTED_PID"
    if [ -n "$pid" ] && packager_process_matches_project "$pid"; then
        kill_packager_pid "$pid"
    fi

    recorded_pid=$(cat "$PACKAGER_PID_FILE" 2>/dev/null)
    if [ "$recorded_pid" = "$pid" ]; then
        rm -f "$PACKAGER_PID_FILE"
    fi
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
        exec npx expo start --port "$PACKAGER_PORT" --localhost
    ) > "$PACKAGER_LOG_FILE" 2>&1 &

    PACKAGER_STARTED_PID="$!"
    printf '%s\n' "$PACKAGER_STARTED_PID" > "$PACKAGER_PID_FILE"
    PACKAGER_STARTED_BY_SCRIPT=1

    for _ in {1..30}; do
        pid=$(packager_pid_on_port)
        if [ -n "$pid" ] && packager_process_matches_project "$pid"; then
            PACKAGER_STARTED_PID="$pid"
            printf '%s\n' "$PACKAGER_STARTED_PID" > "$PACKAGER_PID_FILE"
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
