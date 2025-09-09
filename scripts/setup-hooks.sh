#!/bin/bash

# Setup git pre-commit hooks for the project
echo "Setting up pre-commit hooks..."

# Check if .git directory or file exists (supports both regular repos and worktrees)
if [ ! -d ".git" ] && [ ! -f ".git" ]; then
    echo "Error: Not a git repository. Please run this from the root of the project."
    exit 1
fi

# Check if hooks directory exists
if [ ! -d ".git/hooks" ]; then
    echo "Creating .git/hooks directory..."
    mkdir -p .git/hooks
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRE_COMMIT_SOURCE="$SCRIPT_DIR/pre-commit.sh"

# Check if the pre-commit.sh template exists
if [ ! -f "$PRE_COMMIT_SOURCE" ]; then
    echo "Error: pre-commit.sh template not found at $PRE_COMMIT_SOURCE"
    exit 1
fi

# Check if pre-commit hook already exists and compare content
HOOK_PATH=".git/hooks/pre-commit"
NEEDS_UPDATE=true

if [ -f "$HOOK_PATH" ]; then
    # Compare the existing hook with the template
    if cmp -s "$PRE_COMMIT_SOURCE" "$HOOK_PATH"; then
        NEEDS_UPDATE=false
        echo "✅ Pre-commit hook is already up to date"
    else
        echo "📝 Pre-commit hook exists but differs from template, updating..."
    fi
else
    echo "📦 Installing pre-commit hook..."
fi

# Install or update the hook if needed
if [ "$NEEDS_UPDATE" = true ]; then
    cp "$PRE_COMMIT_SOURCE" "$HOOK_PATH"
    chmod +x "$HOOK_PATH"
    echo "✅ Pre-commit hook installed successfully!"
fi
echo ""
echo "The pre-commit hook will now run automatically on every commit and will:"
echo "  - Run ESLint (quiet mode) on TypeScript/JavaScript files"
echo "  - Auto-format Swift files with SwiftLint, then run SwiftLint (strict mode)"
echo "  - Auto-format Kotlin files with ktlint, then run ktlint"
echo "  - Auto-format files with Prettier"
echo ""
echo "To test all linting manually, run: yarn lint:all"
echo "To bypass the hook temporarily, commit with: git commit --no-verify"
