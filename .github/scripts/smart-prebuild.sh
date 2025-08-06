#!/bin/bash

PROJECT="$1"
PLATFORM_TYPE="$2"

if [ -z "$PROJECT" ]; then
  echo "Usage: smart-prebuild.sh <project> [platform]"
  exit 1
fi

ANDROID_DIR="${PROJECT}/android"

if [ -d "$ANDROID_DIR" ]; then
  if [ -f "$ANDROID_DIR/app/build.gradle" ]; then
    exit 0
  else
    rm -rf "$ANDROID_DIR"
  fi
fi

COMMAND="prebuild"
if [ -n "$PLATFORM_TYPE" ]; then
  COMMAND="${COMMAND}:${PLATFORM_TYPE}"
fi

yarn "$PROJECT" "$COMMAND" --clean