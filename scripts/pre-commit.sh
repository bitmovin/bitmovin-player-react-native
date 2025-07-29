#!/bin/sh
# Pre-commit hook to run lint-staged

# Load common paths where Node.js might be installed
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/current/bin:$HOME/.volta/bin:$HOME/.fnm/current/bin:$PATH"

# Try to find npx
NPX=$(command -v npx)
if [ -z "$NPX" ]; then
  echo "Error: npx not found in PATH"
  exit 1
fi

$NPX lint-staged