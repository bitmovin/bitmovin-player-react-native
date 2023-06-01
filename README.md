# Bitmovin Player React Native

Official React Native bindings for Bitmovin's mobile Player SDKs.

[![npm](https://img.shields.io/npm/v/bitmovin-player-react-native)](https://www.npmjs.com/package/bitmovin-player-react-native)
![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20tvOS%20%7C%20Android%20%7C%20Android%20TV-lightgrey.svg)
[![MIT License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Bitmovin Community](https://img.shields.io/discourse/users?label=community&server=https%3A%2F%2Fcommunity.bitmovin.com)](https://community.bitmovin.com/?utm_source=github&utm_medium=bitmovin-player-react-native&utm_campaign=dev-community)

> As the library is under active development, this means certain features from our native SDKs are not yet exposed through these React Native bindings.  
> See [Feature Support](#feature-support) for an overview of the supported features.
>
> Not seeing the features you’re looking for?  
> We are accepting community pull requests to this open-source project so please feel free to contribute.
> or let us know in [our community](https://community.bitmovin.com/c/requests/14) what features we should work on next.

- [Bitmovin Player React Native](#bitmovin-player-react-native)
  - [Platform Support](#platform-support)
  - [Feature Support](#feature-support)
  - [Documentation](#documentation)
    - [Getting Started](#getting-started-guide)
    - [Feature Guides](#feature-guides)
    - [Sample Application](#sample-application)
  - [Contributing](#contributing)

## Platform Support

This library requires at least React Native 0.64+ and React 17+ to work properly. The currently supported platforms are:

- iOS 14.0+
- tvOS 14.0+
- Android API Level 21+
- Android TV API Level 24+
- Fire TV FireOS 5.0+

Please note that browsers and other browser-like environments such as webOS and Tizen are not supported. For more details regarding Bitmovin Player SDK platform and device support, please refer to the [Supported Platforms & Devices](https://developer.bitmovin.com/playback/docs/supported-platforms-devices-player) page of our documentation.

## Feature Support

Features of the native mobile Player SDKs are progressively being implemented in this React Native library. The table below summarizes the current state of the main Player SDK features.

| Feature                          | State                                     |
| -------------------------------- | ----------------------------------------- |
| Playback of DRM-protected assets | :white_check_mark: Available since v0.2.0 |
| Subtitles & Captions             | :white_check_mark: Available since v0.2.0 |
| Advertising                      | :white_check_mark: Available since v0.4.0 |
| Analytics                        | :white_check_mark: Available since v0.5.0 |
| Playlist API                     | :x: Not available                         |
| Casting                          | :x: Not available                         |
| Offline Playback                 | :x: Not available                         |

## Documentation

### Getting Started Guide

Our [Getting Started Guide](https://developer.bitmovin.com/playback/docs/getting-started-react-native) walks you through setting up and configuring the Bitmovin Player in React Native projects.

### Feature Guides

Check out our [React Native Guides](https://developer.bitmovin.com/playback/docs/guides-react-native) for more information on how to set up Player features such as Advertising, DRM-protected playback, Subtitles and more.

### Sample Application

In the [/example/](https://github.com/bitmovin/bitmovin-player-react-native/tree/development/example) folder you can find a sample application showcasing many of the features of the Player React Native SDK.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.
