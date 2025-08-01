#!/bin/bash
# Install pods (macOS only)

if [ "$(uname)" = "Darwin" ]; then
    yarn pod-install
else
    echo "Skipping pod install on non-macOS system"
fi
