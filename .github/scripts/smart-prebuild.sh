#!/bin/bash

PROJECT="$1"
PLATFORM_TYPE="$2"

if [ -z "$PROJECT" ]; then
  echo "Usage: smart-prebuild.sh <project> [platform]"
  exit 1
fi

ANDROID_DIR="${PROJECT}/android"
IOS_DIR="${PROJECT}/ios"

if [ -d "$ANDROID_DIR" ] && [ -f "$ANDROID_DIR/app/build.gradle" ] && 
   [ -d "$IOS_DIR" ] && [ -f "$IOS_DIR/Podfile" ]; then
  exit 0
fi

if [ -d "$ANDROID_DIR" ] && [ ! -f "$ANDROID_DIR/app/build.gradle" ]; then
  rm -rf "$ANDROID_DIR"
fi

if [ -d "$IOS_DIR" ] && [ ! -f "$IOS_DIR/Podfile" ]; then
  rm -rf "$IOS_DIR"
fi

COMMAND="prebuild"
if [ -n "$PLATFORM_TYPE" ]; then
  COMMAND="${COMMAND}:${PLATFORM_TYPE}"
fi

yarn "$PROJECT" "$COMMAND" --clean