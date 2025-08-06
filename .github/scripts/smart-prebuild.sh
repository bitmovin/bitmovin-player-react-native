#!/bin/bash

PROJECT="$1"
PLATFORM_TYPE="$2"

if [ -z "$PROJECT" ] || [ -z "$PLATFORM_TYPE" ]; then
  echo "Usage: smart-prebuild.sh [example|integration-test] [mobile|tv]"
  exit 1
fi

if [ "$PROJECT" = "example" ]; then
  ANDROID_DIR="example/android"
elif [ "$PROJECT" = "integration-test" ]; then
  ANDROID_DIR="integration_test/android"
else
  echo "Invalid project: $PROJECT"
  exit 1
fi

if [ -d "$ANDROID_DIR" ]; then
  if [ -f "$ANDROID_DIR/app/build.gradle" ]; then
    exit 0
  else
    rm -rf "$ANDROID_DIR"
  fi
fi

if [ "$PLATFORM_TYPE" = "tv" ]; then
  yarn "$PROJECT" prebuild:tv --clean
else
  yarn "$PROJECT" prebuild --clean
fi