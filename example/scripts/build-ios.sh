#!/bin/bash
# Build iOS project for simulator with formatted output

set -o pipefail
set -e

XCBEAUTIFY_ARGS=$@

eval "xcodebuild -workspace ios/BitmovinPlayerReactNativeExample.xcworkspace \
    -scheme BitmovinPlayerReactNativeExample \
    -configuration Debug \
    -quiet \
    ${XCODEBUILD_ARGS} \
    | xcbeautify -qq --disable-logging $XCBEAUTIFY_ARGS"
