#!/bin/bash

echo "Stopping packager processes..."

# Function to safely kill processes by PID
safe_kill() {
    local pids="$1"
    local signal="${2:-TERM}"
    
    if [ -n "$pids" ]; then
        echo "Killing processes: $pids (signal: $signal)"
        echo "$pids" | xargs -n1 kill -$signal 2>/dev/null || true
    fi
}

# Find and kill processes using port 8081 (Expo default port)
PORT_8081_PIDS=$(lsof -ti:8081 2>/dev/null)
if [ -n "$PORT_8081_PIDS" ]; then
    echo "Found processes on port 8081: $PORT_8081_PIDS"
    safe_kill "$PORT_8081_PIDS" "TERM"
    sleep 1
    # Force kill if still running
    REMAINING_8081=$(lsof -ti:8081 2>/dev/null)
    if [ -n "$REMAINING_8081" ]; then
        echo "Force killing remaining processes on port 8081: $REMAINING_8081"
        safe_kill "$REMAINING_8081" "KILL"
    fi
else
    echo "No processes found on port 8081"
fi

# Find and kill Metro bundler processes (but not terminal or shell processes)
METRO_PIDS=$(pgrep -f "metro.*start\|expo.*start" 2>/dev/null | grep -v $$ || true)
if [ -n "$METRO_PIDS" ]; then
    echo "Found Metro/Expo processes: $METRO_PIDS"
    safe_kill "$METRO_PIDS" "TERM"
    sleep 1
    # Force kill if still running
    REMAINING_METRO=$(pgrep -f "metro.*start\|expo.*start" 2>/dev/null | grep -v $$ || true)
    if [ -n "$REMAINING_METRO" ]; then
        echo "Force killing remaining Metro/Expo processes: $REMAINING_METRO"
        safe_kill "$REMAINING_METRO" "KILL"
    fi
else
    echo "No Metro/Expo processes found"
fi

# Find and kill node processes that look like packagers (but not this script or terminal)
NODE_PACKAGER_PIDS=$(ps aux | grep -E "node.*metro|node.*expo" | grep -v grep | grep -v $$ | awk '{print $2}' || true)
if [ -n "$NODE_PACKAGER_PIDS" ]; then
    echo "Found Node packager processes: $NODE_PACKAGER_PIDS"
    safe_kill "$NODE_PACKAGER_PIDS" "TERM"
    sleep 1
    # Force kill if still running
    REMAINING_NODE=$(ps aux | grep -E "node.*metro|node.*expo" | grep -v grep | grep -v $$ | awk '{print $2}' || true)
    if [ -n "$REMAINING_NODE" ]; then
        echo "Force killing remaining Node packager processes: $REMAINING_NODE"
        safe_kill "$REMAINING_NODE" "KILL"
    fi
else
    echo "No Node packager processes found"
fi

echo "Packager cleanup completed"
exit 0
