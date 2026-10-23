#!/bin/bash
# Build iOS project for simulator with formatted output

set -o pipefail
set -e

XCBEAUTIFY_ARGS=$@

# TEMP DEBUG (revert before merge): keep the raw log and print errors on failure
RAW_LOG="${RUNNER_TEMP:-/tmp}/xcodebuild-ios-raw.log"
if ! eval "xcodebuild -workspace ios/BitmovinPlayerReactNativeExample.xcworkspace \
    -scheme BitmovinPlayerReactNativeExample \
    -configuration Debug \
    ${XCODEBUILD_ARGS} \
    2>&1 | tee \"$RAW_LOG\" \
    | xcbeautify -qq --disable-logging $XCBEAUTIFY_ARGS"; then
  echo "::group::Raw xcodebuild errors"
  grep -n -E -B5 -A25 'error:|error [A-Z]|Error:|PhaseScriptExecution|Command .* failed|node' "$RAW_LOG" | grep -v -E 'warning:' | head -400
  echo "::endgroup::"
  echo "--- last 80 lines ---"
  tail -80 "$RAW_LOG"
  exit 65
fi
