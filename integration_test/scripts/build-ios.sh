#!/bin/bash
# Build iOS integration test project for simulator with formatted output

set -o pipefail
set -e

XCBEAUTIFY_ARGS=$@

eval "xcodebuild -workspace ios/IntegrationTest.xcworkspace \
    -scheme IntegrationTest \
    -configuration Debug \
    -quiet \
    ${XCODEBUILD_ARGS} \
    | xcbeautify -qq --disable-logging $XCBEAUTIFY_ARGS"
