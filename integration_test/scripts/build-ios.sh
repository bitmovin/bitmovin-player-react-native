#!/bin/bash
# Build iOS integration test project for simulator with formatted output

set -o pipefail
set -e

XCBEAUTIFY_ARGS=$@

xcodebuild -workspace ios/IntegrationTest.xcworkspace \
    -scheme IntegrationTest \
    -configuration Debug \
    -destination 'generic/platform=iOS Simulator' \
    -quiet \
    ${XCODEBUILD_ARGS} \
    | xcbeautify -qq --disable-logging $XCBEAUTIFY_ARGS
