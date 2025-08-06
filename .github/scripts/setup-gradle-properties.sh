#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CI_GRADLE_PROPS="${SCRIPT_DIR}/../gradle-ci.properties"

setup_gradle_properties() {
  local android_dir="$1"
  
  if [ -d "$android_dir" ]; then
    if [ -f "$android_dir/gradle.properties" ]; then
      cp "$android_dir/gradle.properties" "$android_dir/gradle.properties.backup"
    fi
    
    echo "" >> "$android_dir/gradle.properties"
    cat "$CI_GRADLE_PROPS" >> "$android_dir/gradle.properties"
  fi
}

setup_gradle_properties "example/android"
setup_gradle_properties "integration_test/android"
