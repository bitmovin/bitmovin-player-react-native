#!/bin/bash

# Setup git pre-commit hooks for the project
echo "Setting up pre-commit hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository. Please run this from the root of the project."
    exit 1
fi

# Check if hooks directory exists
if [ ! -d ".git/hooks" ]; then
    echo "Creating .git/hooks directory..."
    mkdir -p .git/hooks
fi

# Create the pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook to run lint-staged
npx lint-staged
EOF

# Make it executable
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hooks installed successfully!"
echo ""
echo "The pre-commit hook will now run automatically on every commit and will:"
echo "  - Run ESLint (quiet mode) on TypeScript/JavaScript files"
echo "  - Auto-format Swift files with SwiftLint, then run SwiftLint (strict mode)"
echo "  - Auto-format Kotlin files with ktlint, then run ktlint"
echo "  - Auto-format files with Prettier"
echo ""
echo "To test all linting manually, run: yarn lint:all"
echo "To bypass the hook temporarily, commit with: git commit --no-verify"