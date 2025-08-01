#!/bin/bash
# Update pods (macOS only)

if [ "$(uname)" = "Darwin" ]; then
    cd ios && pod update --silent
else
    echo "Skipping pod update on non-macOS system"
fi
