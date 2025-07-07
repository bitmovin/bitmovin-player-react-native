# TODO: Improve Developer Environment Setup for the Example App

This document outlines the definitive plan to improve the developer environment setup **for the example app within this repository**. The goal is to use a local `.env` file for sensitive information, which is the standard and recommended approach for Expo applications.

This change will allow developers working on this project to have a smoother setup process without needing to manually edit configuration files and risk committing secret keys. **This is a developer convenience for this repository only and does not change the public API of the SDK or its config plugin.**

The solution is to convert the static `example/app.json` to a dynamic, type-safe `example/app.config.ts`.

## Plan

### Phase 1: Dependencies

- [ ] **Add Scoped Development Dependencies**
  - From the project root, use the `--cwd` flag to run the `yarn add` command within the `example` directory. This correctly scopes the new dependencies to the example app.

  ```bash
  yarn --cwd example add -D dotenv @expo/config-types
  ```

### Phase 2: Create Dynamic Config (`app.config.ts`)

- [ ] **Audit and Delete `example/app.json`**
  - Before deleting, ensure all necessary values from the static `app.json` have been migrated to the new dynamic configuration below. The new `app.config.ts` will be the single source of truth.

- [ ] **Create `example/app.config.ts`**
  - Create the new file and add the following content. This code loads the entire app configuration, reads from `.env` for secrets, and preserves existing `featureFlags`. The Apple Developer Team ID is optional and only required for iOS device builds.

  ```typescript
  // example/app.config.ts
  import { ExpoConfig } from '@expo/config-types';
  import dotenv from 'dotenv';
  import fs from 'fs';
  import path from 'path';

  const envPath = path.resolve(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Environment file not found at "example/.env". Please copy "example/.env.example" to "example/.env" and fill it out.`
    );
  }

  // Load environment variables from .env file
  dotenv.config({ path: envPath });

  const { BITMOVIN_PLAYER_LICENSE_KEY, APPLE_DEVELOPMENT_TEAM_ID } = process.env;

  if (!BITMOVIN_PLAYER_LICENSE_KEY) {
    throw new Error(
      'BITMOVIN_PLAYER_LICENSE_KEY is not set in example/.env. Please follow the setup instructions in example/README.md.'
    );
  }

  const config: ExpoConfig = {
    name: 'bitmovin-player-react-native-example',
    slug: 'bitmovin-player-react-native-example',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.bitmovin.player.reactnative.example',
      ...(APPLE_DEVELOPMENT_TEAM_ID && { developmentTeam: APPLE_DEVELOPMENT_TEAM_ID }),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.bitmovin.player.reactnative.example',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        '../', // Use the local plugin from the root
        {
          playerLicenseKey: BITMOVIN_PLAYER_LICENSE_KEY,
          featureFlags: {
            airplay: true,
            offline: true,
            pictureInPicture: true,
          },
        },
      ],
    ],
  };

  export default config;
  ```

### Phase 3: Documentation & Guidance

- [ ] **Create `example/.env.example` file**
  - Add a new file `example/.env.example` to serve as a template.

  ```
  # Local development configuration for the Bitmovin Player React Native SDK example app.
  # Copy this file to `example/.env` and fill in your details.

  # Bitmovin Player License Key for running the example app (required)
  BITMOVIN_PLAYER_LICENSE_KEY="YOUR_LICENSE_KEY_HERE"

  # Apple Developer Team ID for signing the iOS app (optional)
  # This is only needed to build the app on a physical iOS/tvOS device.
  # You can find your Team ID on the Apple Developer website under "Membership details".
  APPLE_DEVELOPMENT_TEAM_ID="YOUR_TEAM_ID_HERE"
  ```

- [ ] **Update `.gitignore`**
  - Add `example/.env` to the project's root `.gitignore` file to prevent committing secrets.

  ```bash
  echo "example/.env" >> .gitignore
  ```

- [ ] **Update `example/README.md`**
  - Add a "Development Setup" section with clear instructions.

  ```markdown
  ### Development Setup

  To run the example app for local development, you need to provide a Bitmovin Player license key. This project uses a local `.env` file and a dynamic `app.config.ts` to manage these secrets.

  1.  **Create a local environment file:**
      From the root of the repository, copy the example `.env` template:

      ```bash
      cp example/.env.example example/.env
      ```

  2.  **Add your credentials:**
      Open `example/.env` and replace the placeholder values.
      - The `BITMOVIN_PLAYER_LICENSE_KEY` is required.
      - The `APPLE_DEVELOPMENT_TEAM_ID` is optional and only needed if you want to build the app on a physical iOS or tvOS device. You can find your Apple Team ID on the [Apple Developer website](https://developer.apple.com/account/) under "Membership details".

  These values are loaded automatically by `example/app.config.ts` during the prebuild process and are not committed to version control. **This method is for internal development only.**
  ```

### Phase 4: Verification

- [ ] **Test the developer workflow**
  - **Run Prebuild:** Execute `yarn example prebuild`.
    - **Check for Errors:** Confirm the command completes without any errors related to `app.config.ts` or missing environment variables.
  - **Verify iOS Config (Conditional):** If you provided an `APPLE_DEVELOPMENT_TEAM_ID`, inspect `example/ios/BitmovinPlayerReactNativeExample.xcodeproj/project.pbxproj` and search for `DEVELOPMENT_TEAM`. The value should match your ID. If you did not provide one, ensure this key is not present.
  - **Verify Android Config:** Inspect `example/android/app/src/main/AndroidManifest.xml` and confirm the `BITMOVIN_PLAYER_LICENSE_KEY` is present as a `<meta-data>` tag.
  - **Verify Feature Flags:** Build and run the example app. Confirm that features like AirPlay and Picture-in-Picture are available and functional, which proves the `featureFlags` were correctly applied.
  - **Verify Player License:** Confirm the player loads content without any license errors.
  - **Confirm Cross-Platform Build:** Build and run the app on an iOS Simulator and on an Android device/emulator. If you have an Apple Developer Team ID, also build and run on a real iOS device to confirm signing.
