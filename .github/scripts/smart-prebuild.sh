#!/bin/bash

# Smart prebuild script that skips prebuild if Android project already exists and is fresh
# Usage: smart-prebuild.sh [example|integration-test] [mobile|tv]

PROJECT="$1"
PLATFORM_TYPE="$2"

if [ -z "$PROJECT" ] || [ -z "$PLATFORM_TYPE" ]; then
  echo "Usage: smart-prebuild.sh [example|integration-test] [mobile|tv]"
  exit 1
fi

# Determine project directory and android path
if [ "$PROJECT" = "example" ]; then
  PROJECT_DIR="example"
  ANDROID_DIR="example/android"
elif [ "$PROJECT" = "integration-test" ]; then
  PROJECT_DIR="integration_test"
  ANDROID_DIR="integration_test/android"
else
  echo "Invalid project: $PROJECT"
  exit 1
fi

# Check if Android project exists
if [ -d "$ANDROID_DIR" ]; then
  echo "🔍 Android project found at $ANDROID_DIR"
  
  # Check if main build file exists (indicating a complete prebuild)
  if [ -f "$ANDROID_DIR/app/build.gradle" ]; then
    echo "✅ Android project appears complete, skipping prebuild"
    exit 0
  else
    echo "⚠️ Android project incomplete, cleaning and rebuilding"
    rm -rf "$ANDROID_DIR"
  fi
else
  echo "🏗️ No Android project found, running prebuild"
fi

# Run appropriate prebuild command
cd "$PROJECT_DIR"

if [ "$PLATFORM_TYPE" = "tv" ]; then
  echo "📺 Running TV prebuild for $PROJECT"
  if [ "$PROJECT" = "example" ]; then
    yarn prebuild:tv --clean
  else
    EXPO_TV=1 yarn prebuild --clean
  fi
else
  echo "📱 Running mobile prebuild for $PROJECT"
  yarn prebuild --clean
fi

echo "✅ Prebuild completed for $PROJECT ($PLATFORM_TYPE)"