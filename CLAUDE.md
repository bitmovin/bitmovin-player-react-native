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
- **ALWAYS use mcp__vs-claude__open tool** to open files in VSCode
- **Open files with line ranges** for precise navigation: `{"type": "file", "path": "/path/file.ts", "startLine": 10, "endLine": 20}`
- **Use diff view** for comparing files: `{"type": "diff", "left": "/path/old.ts", "right": "/path/new.ts"}`
- **Use git diff view** for working changes**: `{"type": "gitDiff", "path": "/path/file.ts", "from": "HEAD", "to": "working"}`
- **Specify windowId** when multiple VS Code windows are open

## Project Overview

This is the **Bitmovin Player React Native SDK** - an Expo module that provides React Native bindings for Bitmovin's mobile Player SDKs. It supports iOS, tvOS, Android, Android TV, and Fire TV platforms.

## Development Commands

### Main Library
```bash
# Build the library
yarn build

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
# Start Metro bundler
yarn example start

# Run on platforms
yarn example ios
yarn example android

# Run on TV platforms
yarn example tvos        # Run on Apple TV
yarn example android-tv  # Run on Android TV

# Prebuild for TV platforms
yarn example prebuild:tv  # Generate TV-specific native projects

# Install pods (macOS only)
yarn example pods

# Build verification (errors only) 
yarn example build:ios     # Build iOS for simulator
yarn example build:android # Build Android

# Open native projects
yarn open:ios      # Opens Xcode
yarn open:android  # Opens Android Studio
```

## Architecture

### Core Structure
- **`src/`** - TypeScript library code with React Native bridge
- **`ios/`** - Native iOS/tvOS Swift modules using ExpoModulesCore
- **`android/`** - Native Android Kotlin modules using Expo Module API
- **`plugin/`** - Expo config plugin for automatic native configuration
- **`example/`** - Complete demo app with 15+ feature examples

### Key Patterns

**Hybrid Architecture**: The library uses a sophisticated hybrid approach combining Expo infrastructure with React Native bridge modules:
1. **TypeScript API Layer** (`src/`) - Public React Native API
2. **Native Bridge Layer** (`ios/`, `android/`) - React Native bridge modules for complex video functionality
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

### Hybrid Architecture Details

**Why Hybrid Approach?**
This project successfully combines Expo infrastructure with React Native bridge modules to leverage the strengths of both approaches:

- **Complex Native SDK Integration**: Video player SDKs require sophisticated state management, threading control, and memory handling that React Native bridge patterns handle excellently
- **Modern Developer Experience**: Expo provides superior configuration management, build tooling, and lifecycle handling
- **Gradual Enhancement**: New simple features can be built as Expo modules while maintaining stability of complex existing functionality
- **Zero Migration Risk**: Battle-tested video functionality remains unchanged while gaining Expo infrastructure benefits

**Architecture Components**:
- **Expo Lifecycle**: `AppLifecycleDelegate.swift` and `ActivityLifecycleListener.kt` handle app lifecycle through Expo patterns
- **Config Plugins**: Automatic native configuration via `plugin/src/withBitmovinConfig.ts`
- **React Native Bridge**: All player modules (`PlayerModule`, `DrmModule`, `OfflineModule`, etc.) use proven bridge patterns
- **Feature Flags**: Declarative configuration through Expo config plugin system

### Module Organization

**Core Components**:
- `src/components/PlayerView/` - React components for video player UI
- `src/hooks/` - React hooks (`usePlayer`, `useProxy`)
- `src/analytics/`, `src/drm/`, `src/offline/`, `src/ui/` - Feature-specific modules
- `src/decoder/` - Android decoder configuration (DecoderConfig API)

**Native Modules**:
- iOS: Swift modules using React Native bridge with Expo lifecycle integration
- Android: Kotlin modules using React Native bridge with Expo infrastructure
- Expo components: AppLifecycleDelegate, ActivityLifecycleListener, config plugins
- Both platforms use event-driven communication with TypeScript layer

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
    ["bitmovin-player-react-native", {
      "playerLicenseKey": "ENTER_LICENSE_KEY",
      "featureFlags": {
        "airplay": true,
        "offline": true,
        "pictureInPicture": true
      }
    }]
  ]
}
```

## Platform Requirements

- **React Native**: 0.65+ (using react-native-tvos@0.76.3-0 in example)
- **React**: 17+ (using 18.3.1 in example) 
- **Expo**: 51.0+ (SDK developed on 51.0, compatible with newer versions)
- **iOS/tvOS**: 14.0+
- **Android**: API 21+ (Android 5.0+)

## Expo Version Compatibility

This SDK is developed on **Expo SDK 51** but is designed to work with newer Expo versions:

- **Minimum**: Expo SDK 51.0+ (required for iOS 14.0 support)
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
- `ios/PlayerModule.swift` - Main iOS module
- `android/src/main/java/com/bitmovin/player/reactnative/PlayerModule.kt` - Main Android module

## Recent Updates (v0.42.0)

- **Hybrid Architecture**: Successfully implemented hybrid Expo + React Native bridge architecture
- **Expo Infrastructure**: Added lifecycle management, config plugins, and build tooling via Expo
- **Core Stability**: Maintained proven React Native bridge modules for complex video functionality
- **New APIs**: Added DecoderConfig for Android hardware decoder configuration
- **Enhanced Media Tracks**: AudioTrack and SubtitleTrack now support role characteristics and format types
- **Improved TypeScript**: Better type definitions for media track roles and subtitle formats
- **Config Plugin**: Enhanced Expo config plugin for automatic native configuration

## Common Tasks

When working with player features, configurations are typically defined in `src/` and passed through the native bridge. The example app in `example/src/screens/` shows implementation patterns for all supported features.

For native development, first ensure the native projects exist by running `yarn example prebuild`, then use `yarn open:ios` or `yarn open:android` to open the respective IDEs with the example project.

### Hybrid Architecture Benefits
- **Best of Both Worlds**: Expo developer experience with React Native bridge power for complex native SDK integration
- **Zero Breaking Changes**: Core video functionality remains stable through proven React Native patterns
- **Enhanced Developer Experience**: Expo config plugins automate native setup and build processes
- **Future Ready**: Positioned for gradual adoption of Expo modules for appropriate use cases
- **Production Proven**: Battle-tested React Native bridge modules handle complex video player state management

### Key Notes
- Integration tests have been disabled in this Expo modules branch (`bootstrap:integration-test` is commented out)
- Focus is on the example app for comprehensive testing functionality
- Currently on `feature/expo-modules` branch, targeting merge to `development`
- **Hybrid approach**: Expo infrastructure + React Native bridge modules for optimal complexity management

## Project Development Notes

- **Generated Folders Warning**: 
  - The `example/ios` and `example/android` folders are generated by Expo and **not tracked in git**
  - These folders are automatically created when running `yarn example prebuild` or platform-specific commands
  - **To regenerate native projects**: Run `yarn example prebuild` (or `yarn example prebuild -p ios/android` for specific platforms)
  - **For TV platforms**: Use `yarn example prebuild:tv` to generate tvOS and Android TV projects
  - Do NOT manually modify these generated folders - use Expo config plugins or app.json configuration instead
  - If these folders are missing, simply run the prebuild command to regenerate them

