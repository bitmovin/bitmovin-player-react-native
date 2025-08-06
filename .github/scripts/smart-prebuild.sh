#!/bin/bash

YARN_PROJECT="$1"
PLATFORM_TYPE="$2"

if [ -z "$YARN_PROJECT" ]; then
  echo "Usage: smart-prebuild.sh <yarn-project> [platform]"
  exit 1
fi

PROJECT_FOLDER="${YARN_PROJECT//-/_}"
ANDROID_DIR="${PROJECT_FOLDER}/android"
IOS_DIR="${PROJECT_FOLDER}/ios"

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

yarn "$YARN_PROJECT" "$COMMAND" --clean
