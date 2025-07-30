#!/bin/bash
# Build iOS project for simulator with formatted output

xcodebuild -workspace ios/integration_test.xcworkspace \
    -scheme integration_test \
    -configuration Debug \
    -destination 'generic/platform=iOS Simulator' \
    -quiet | xcbeautify -qq --disable-logging
