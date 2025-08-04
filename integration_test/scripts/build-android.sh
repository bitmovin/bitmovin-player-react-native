#!/bin/bash
# Build Android project in debug mode

cd android && ./gradlew assembleDebug --quiet --console=plain --warning-mode=none
