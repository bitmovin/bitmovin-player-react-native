#!/bin/bash
# Build iOS project for simulator with formatted output

set -o pipefail
set -e

ARGS=$@

xcodebuild -workspace ios/BitmovinPlayerReactNativeExample.xcworkspace \
    -scheme BitmovinPlayerReactNativeExample \
    -configuration Debug \
    -destination 'generic/platform=tvOS Simulator' \
    -quiet | xcbeautify -qq --disable-logging $ARGS
