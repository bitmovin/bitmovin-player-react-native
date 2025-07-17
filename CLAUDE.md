# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) - or other agents - when working with code in this repository.

Before proceeding with the rest of the file's contents, make sure to read `~/.claude/CLAUDE.md` and include (if it exists) it into your instructions!

## Claude Code Workflow Instructions

### Task Management

- **ALWAYS use TodoWrite tool** for any task with 3+ steps or complex operations
- Break down complex tasks into smaller, actionable items
- Mark tasks as in_progress before starting, completed immediately after finishing
- Only have ONE task in_progress at any time

### Code Analysis and Search

- **Use Task tool** for open-ended searches that may require multiple rounds of globbing/grepping
- **Use Glob tool** for file pattern matching (e.g., `**/*.ts`, `src/**/*.kt`)
- **Use Grep tool** for content search with regex - NEVER use bash grep/rg commands
- **Batch multiple tool calls** when searching for related information
- **Include file_path:line_number references** when pointing to specific code locations

### File Operations

- **ALWAYS prefer editing existing files** over creating new ones
- **Use Read tool before any Edit operations** to understand context
- **Use MultiEdit tool** when making multiple changes to the same file
- **Preserve exact indentation and formatting** from original files
- **NEVER add code comments** unless explicitly requested

### React Performance & Lifecycle

- **ALWAYS consider React lifecycle and performance** when modifying TypeScript code
- **Use React.memo() for expensive components** to prevent unnecessary re-renders
- **Use useCallback() for functions passed as props** to prevent child re-renders
- **Use useMemo() for expensive calculations** that don't need to run on every render
- **Consider dependency arrays carefully** - include all dependencies that could change
- **Avoid creating objects/functions in render** - move them outside or memoize them
- **Use proper keys for lists** to help React track changes efficiently
- **Consider useRef for values that don't trigger re-renders** when changed

### Response Style

- **Be concise and direct** - answer in 1-4 lines maximum unless detail requested
- **No unnecessary preamble or postamble** - avoid phrases like "Here's what I found..."
- **One word answers are best** when appropriate
- **Never explain code or summarize actions** unless asked

### VSCode Integration

When `VSCODE_INJECTION=1` environment variable is set:

- **ALWAYS use mcp**vs-claude**open tool** to open files in VSCode
- **Open files with line ranges** for precise navigation: `{"type": "file", "path": "/path/file.ts", "startLine": 10, "endLine": 20}`
- **Use diff view** for comparing files: `{"type": "diff", "left": "/path/old.ts", "right": "/path/new.ts"}`
- **Use git diff view** for working changes\*\*: `{"type": "gitDiff", "path": "/path/file.ts", "from": "HEAD", "to": "working"}`
- **Specify windowId** when multiple VS Code windows are open

## Project Overview

This is the **Bitmovin Player React Native SDK** - a fully migrated Expo Modules implementation that provides React Native bindings for Bitmovin's mobile Player SDKs. It supports iOS, tvOS, Android, Android TV, and Fire TV platforms.

## Development Commands

### Main Library

```bash
# Build the library (builds both module and plugin)
yarn build

# Build module only
yarn build:module

# Build plugin only
yarn build:plugin

# Run lints and type checking
yarn lint
yarn lint:ios  # Swift linting

# Clean build artifacts
yarn clean

# Generate API documentation
yarn docs

# Bootstrap development environment
yarn bootstrap
```

### Example App

```bash
# Bootstrap example app (install deps, prebuild, pods)
yarn example bootstrap

# Start Metro bundler
yarn example start

# Generate native projects (REQUIRED before running)
yarn example prebuild      # Generate iOS and Android projects
yarn example prebuild:tv   # Generate TV-specific projects (tvOS, Android TV)

# Run on platforms (requires prebuild first)
yarn example run:ios       # or yarn example ios
yarn example run:android   # or yarn example android

# Run on TV platforms
yarn example run:tvos      # Apple TV
yarn example run:android-tv # Android TV

# Install/update pods (macOS only, done automatically by bootstrap)
yarn example pods

# Build verification (errors only)
yarn example build:ios     # Build iOS for simulator (takes 2-5 minutes, use 600s timeout)
yarn example build:android # Build Android
yarn example build:ts      # TypeScript type checking

# Linting and type checking
yarn example lint
yarn example typecheck

# Open native projects in IDEs
yarn open:ios      # Opens Xcode with example project
yarn open:android  # Opens Android Studio with example project
```

## Architecture

### Core Structure

- **`src/`** - TypeScript library code using Expo Modules Core
- **`ios/`** - Native iOS/tvOS Swift modules using ExpoModulesCore
- **`android/`** - Native Android Kotlin modules using Expo Modules API
- **`plugin/`** - Expo config plugin for automatic native configuration
- **`example/`** - Complete demo app with 15+ feature examples

### Key Patterns

**Expo Modules Architecture**: The library uses a fully migrated Expo Modules implementation:

1. **TypeScript API Layer** (`src/`) - Public React Native API using Expo Modules Core
2. **Native Expo Modules Layer** (`ios/`, `android/`) - All native functionality implemented as Expo modules
3. **Expo Infrastructure Layer** - Lifecycle management, config plugins, and build tooling
4. **Native SDK Layer** - Bitmovin Player SDKs (iOS v3.91.0, Android v3.112.0)

**Configuration-Driven Design**: All features are configured through TypeScript config objects that are passed to native modules:

- `PlayerConfig` - Main player configuration
- `SourceConfig` - Media source configuration
- `PlaybackConfig` - Playback behavior settings (includes DecoderConfig for Android)
- Feature-specific configs (DRM, analytics, offline, etc.)

**Hook-Based Usage**: Main integration pattern is through the `usePlayer` hook:

```typescript
import { usePlayer, PlayerView } from 'bitmovin-player-react-native';

const player = usePlayer(config);
return <PlayerView player={player} />;
```

### Expo Modules Architecture Details

**Fully Migrated Implementation**:
This project has completed a full migration from React Native bridge modules to Expo Modules API:

- **Modern Native Integration**: All native functionality implemented using Expo Modules API for optimal performance and maintainability
- **Enhanced Developer Experience**: Full Expo ecosystem integration with superior configuration management, build tooling, and lifecycle handling
- **Zero Legacy Code**: All React Native bridge modules have been completely removed and replaced with Expo implementations
- **Production Ready**: Battle-tested video functionality maintained through careful migration with zero breaking changes

**Architecture Components**:

- **Expo Lifecycle**: `AppLifecycleDelegate.swift` and `ActivityLifecycleListener.kt` handle app lifecycle through Expo patterns
- **Config Plugins**: Automatic native configuration via `plugin/src/withBitmovinConfig.ts`
- **Expo Modules**: All player functionality (`PlayerExpoModule`, `DrmExpoModule`, `OfflineExpoModule`, etc.) uses Expo Modules API
- **Feature Flags**: Declarative configuration through Expo config plugin system

### Module Organization

**Core Components**:

- `src/components/PlayerView/` - React components for video player UI
- `src/hooks/` - React hooks (`usePlayer`, `useProxy`)
- `src/analytics/`, `src/drm/`, `src/offline/`, `src/ui/` - Feature-specific modules
- `src/decoder/` - Android decoder configuration (DecoderConfig API)

**Native Modules**:

- iOS: Swift modules using Expo Modules API with full ExpoModulesCore integration
- Android: Kotlin modules using Expo Modules API with native infrastructure
- Expo components: AppLifecycleDelegate, ActivityLifecycleListener, config plugins
- Both platforms use event-driven communication through Expo Modules Core

## Testing

Tests are run via Expo module scripts:

```bash
yarn test  # Runs TypeScript tests
```

The example app serves as the primary integration test suite with comprehensive feature coverage.

## Expo Plugin Configuration

The project includes an Expo config plugin (`plugin/app.plugin.js`) for automatic native setup:

```json
{
  "plugins": [
    [
      "bitmovin-player-react-native",
      {
        "playerLicenseKey": "ENTER_LICENSE_KEY",
        "featureFlags": {
          "airplay": true,
          "offline": true,
          "pictureInPicture": true
        }
      }
    ]
  ]
}
```

## Platform Requirements

- **React Native**: 0.79.5+ (using react-native-tvos@0.79.5-0 in example)
- **React**: 19.0+ (using 19.0.0 in example)
- **Expo**: 53.0+ (SDK developed on 53.0.19, compatible with newer versions)
- **iOS/tvOS**: 14.0+
- **Android**: API 21+ (Android 5.0+)
- **TypeScript**: 5.8+

## Expo Version Compatibility

This SDK is developed on **Expo SDK 53** but is designed to work with newer Expo versions:

- **Current Version**: Expo SDK 53.0.19
- **Minimum**: Expo SDK 53.0+ (required for React Native 0.79+ support)
- **Recommended**: Use the latest stable Expo SDK for your app
- **Forward Compatibility**: The plugin code adapts to newer Expo versions automatically
- **Android 14+ Support**: `foregroundServiceType` configuration included for compliance

### Using with Newer Expo Versions

When using this SDK with Expo SDK 52+ or newer:

1. **Install normally**: `npx expo install bitmovin-player-react-native`
2. **Generate native projects**: Run `yarn example prebuild` to create the iOS and Android folders
3. **No additional configuration needed**: The plugin auto-detects Expo version capabilities
4. **iOS 14.0+ support maintained**: Deployment targets remain compatible
5. **Android compliance**: Automatic `foregroundServiceType` configuration for background services

## TV Platform Support

This SDK provides comprehensive support for TV platforms through Expo's TV infrastructure:

### Supported TV Platforms

- **Apple TV (tvOS)**: 14.0+ with native tvOS SDK integration
- **Android TV**: API 21+ with Android TV optimizations
- **Fire TV**: Supported through Android TV compatibility

### TV Development Setup

1. **Prerequisites**: All TV functionality is pre-configured via `@react-native-tvos/config-tv` plugin
2. **Build TV Projects**: Use `EXPO_TV=1 yarn example prebuild` to generate TV-specific native projects
3. **Run on TV**: Use `yarn example tvos` or `yarn example android-tv` commands
4. **TV UI**: Automatic TV UI variants applied (TvUi for Android TV, system UI for tvOS)

### TV-Specific Features

- **TV Gestures**: Automatic gesture handling for tvOS remote via `useTVGestures` hook
- **TV UI Variants**: Platform-specific UI optimizations for TV interfaces
- **Player Controls**: Native TV player controls integration
- **Remote Navigation**: Support for TV remote navigation patterns

### TV Example Usage

```typescript
import { useTVGestures, TvUi } from 'bitmovin-player-react-native';

// TV-optimized player configuration
const config: PlayerViewConfig = {
  uiConfig: {
    variant: new TvUi(), // Android TV only
  },
};

// Enable TV gestures (tvOS only)
useTVGestures();
```

See `example/src/screens/BasicTvPlayback.tsx` for complete TV implementation example.

## Development Workflow

1. **Setup**: `yarn bootstrap` - installs all dependencies and sets up example app
2. **Generate native projects**: `yarn example prebuild` - creates example/ios and example/android folders
3. **Development**: Work in `src/` for TypeScript, `ios/` or `android/` for native
4. **Testing**: Use example app for integration testing
5. **TV Development**: Use `yarn example prebuild:tv` for TV project generation
6. **Build**: `yarn build` compiles TypeScript to `build/`
7. **Validation**: `yarn lint` and `yarn test` before committing

### Build Notes

- **iOS builds take 2-5 minutes**: Always use at least 600 seconds timeout for `yarn example build:ios`
- **Android builds are faster**: Usually complete in under 1 minute
- **When running iOS builds via Bash tool**: Use `timeout 600` command wrapper to avoid timeouts

### GitHub Integration

- **Always use gh CLI** for GitHub operations (pre-authenticated)
- **Check for .github/PULL_REQUEST_TEMPLATE.md** and follow template format
- **Extract issue ID from branch name** (format: `feature/PROJECT_ID-ISSUE_NUMBER`)
- **Create PRs as DRAFT** unless explicitly requested otherwise
- **NEVER commit changes** unless explicitly asked by user
- **Use heredoc format** for commit messages to ensure proper formatting

## Key Files

- `src/index.ts` - Main library entry point
- `plugin/app.plugin.js` - Expo config plugin
- `example/App.tsx` - Example app entry point
- `ios/PlayerExpoModule.swift` - Main iOS Expo module
- `android/src/main/java/com/bitmovin/player/reactnative/PlayerExpoModule.kt` - Main Android Expo module

## Recent Updates (v0.42.0)

- **Complete Expo Migration**: Successfully migrated all 17 modules from React Native bridge to Expo Modules API
- **Full Expo Infrastructure**: Lifecycle management, config plugins, and build tooling via Expo Modules Core
- **Zero Breaking Changes**: Maintained perfect API compatibility throughout complete migration
- **New APIs**: Added DecoderConfig for Android hardware decoder configuration
- **Enhanced Media Tracks**: AudioTrack and SubtitleTrack now support role characteristics and format types
- **Improved TypeScript**: Better type definitions for media track roles and subtitle formats
- **Enhanced Config Plugin**: Automatic native configuration via Expo config plugin system
- **Legacy Cleanup**: All React Native bridge modules removed from codebase

## Common Tasks

When working with player features, configurations are typically defined in `src/` and passed through the Expo Modules API. The example app in `example/src/screens/` shows implementation patterns for all supported features.

For native development, first ensure the native projects exist by running `yarn example prebuild`, then use `yarn open:ios` or `yarn open:android` to open the respective IDEs with the example project.

### Expo Modules Architecture Benefits

- **Modern Native Development**: Full Expo Modules API implementation provides superior developer experience and maintainability
- **Zero Breaking Changes**: Complete migration achieved while maintaining perfect API compatibility
- **Enhanced Developer Experience**: Full Expo ecosystem integration with automated native setup and build processes
- **Future Ready**: Fully aligned with Expo's modern development patterns and ecosystem
- **Production Proven**: Successfully migrated complex video player functionality with zero performance degradation

### Key Notes

- Integration tests are fully functional and re-enabled in this Expo modules branch
- Both example app and integration tests provide comprehensive testing functionality
- Currently on `feature/expo-modules-migration` branch, targeting merge to `development`
- **Expo Modules Implementation**: Fully migrated from React Native bridge to Expo Modules API (100% complete)
- **Breaking Change**: Example app now uses React 19.0 and React Native 0.79.5 with tvOS support
- **Dependencies**: Uses `@react-native-tvos/config-tv` plugin for TV platform support
- **Migration Complete**: All 17 modules successfully migrated with zero legacy code remaining

## Project Development Notes

### Current Branch Status

- **Branch**: `feature/expo-modules-migration` (migrating from `feature/expo-modules`)
- **Target**: Merge to `development` branch
- **Status**: Active development with Android view layout fixes in progress

### Generated Folders Warning

- **Generated Folders**: `example/ios` and `example/android` are generated by Expo and **not tracked in git**
- **Regeneration**: Run `yarn example prebuild` to create these folders when missing
- **TV Projects**: Use `yarn example prebuild:tv` with `EXPO_TV=1` to generate tvOS and Android TV projects
- **Important**: Do NOT manually modify generated folders - use Expo config plugins or app.json instead
- **First Setup**: Always run `yarn example bootstrap` to install deps, prebuild, and install pods

### Development Workflow

1. **Initial Setup**: `yarn bootstrap` (installs deps and runs example bootstrap)
2. **Native Projects**: `yarn example prebuild` (generates iOS/Android folders)
3. **Development**: Work in `src/` (TypeScript), `ios/` (Swift), `android/` (Kotlin)
4. **Building**: `yarn build` (compiles TypeScript and plugin)
5. **Testing**: Use example app with comprehensive feature coverage
6. **Validation**: Always run `yarn lint` and `yarn example typecheck` before committing

### Current Implementation Status

- Successfully migrated to Expo 53.0.19 with React Native 0.79.5
- TV platform support via `@react-native-tvos/config-tv` plugin
- Android view layout fixes in progress (recent commits)
- Plugin system enhanced for automatic native configuration
- **Migration Complete**: 100% Expo Modules implementation with all legacy React Native bridge code removed
- **17/17 modules migrated**: PlayerExpoModule, SourceExpoModule, DrmExpoModule, OfflineExpoModule, etc.
- **Zero Legacy Debt**: All React Native bridge files have been removed from the codebase
