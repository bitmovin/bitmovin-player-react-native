#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
. "$SCRIPT_DIR/packager-utils.sh"

configure_packager_port "$@"
echo "Stopping integration_test Expo packager..."
stop_integration_test_packager
echo "Packager cleanup completed"
exit 0
