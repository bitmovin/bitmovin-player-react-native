import BitmovinPlayer

/**
 * React Native specific PictureInPictureConfig.
 */
internal struct RNPictureInPictureConfig {
    /**
     * Native SDK PiP configuration.
     */
    let nativeConfig: PictureInPictureConfig?

    /**
     * Whether PiP should exit automatically when the app comes to the foreground.
     */
    let shouldExitOnForeground: Bool
}
