#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CI_XCODE_CONFIG="${SCRIPT_DIR}/../xcode-ci.xcconfig"

setup_xcode_project() {
  local ios_dir="$1"
  local project_name="$2"
  
  if [ -d "$ios_dir" ]; then
    local project_file="${ios_dir}/${project_name}.xcodeproj/project.pbxproj"
    local config_dir="${ios_dir}/${project_name}.xcodeproj"
    
    if [ -f "$project_file" ] && [ -d "$config_dir" ]; then
      cp "$CI_XCODE_CONFIG" "${config_dir}/ci.xcconfig"
      echo "Applied CI configuration to ${project_name}"
    fi
  fi
}

setup_xcode_project "example/ios" "BitmovinPlayerReactNativeExample"
setup_xcode_project "integration_test/ios" "IntegrationTest"
