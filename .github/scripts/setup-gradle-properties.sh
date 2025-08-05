#!/bin/bash

# Setup Gradle properties for CI builds
# This script copies the CI-optimized gradle.properties to all Android projects

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CI_GRADLE_PROPS="${SCRIPT_DIR}/../gradle-ci.properties"

# Function to setup gradle properties for a given Android directory
setup_gradle_properties() {
  local android_dir="$1"
  
  if [ -d "$android_dir" ]; then
    echo "Setting up Gradle properties for $android_dir"
    
    # Backup existing gradle.properties if it exists
    if [ -f "$android_dir/gradle.properties" ]; then
      cp "$android_dir/gradle.properties" "$android_dir/gradle.properties.backup"
    fi
    
    # Append CI properties to existing gradle.properties
    echo "" >> "$android_dir/gradle.properties"
    echo "# CI Optimization Properties" >> "$android_dir/gradle.properties"
    cat "$CI_GRADLE_PROPS" >> "$android_dir/gradle.properties"
  fi
}

# Setup for example app
setup_gradle_properties "example/android"

# Setup for integration tests
setup_gradle_properties "integration_test/android"

echo "✅ Gradle CI properties setup complete"