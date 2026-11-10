import BitmovinPlayer

/**
 * React native specific PlayerViewConfig.
 */
internal struct RNPlayerViewConfig {
    /**
     * The react native specific ui configuration.
     */
    let uiConfig: RNUiConfig?

    /**
     * React Native specific picture in picture config.
     */
    let pictureInPictureConfig: RNPictureInPictureConfig?

    /**
     * PlayerView config considering all properties
     */
    var playerViewConfig: PlayerViewConfig {
        let config = PlayerViewConfig()
        if let nativePictureInPictureConfig = pictureInPictureConfig?.nativeConfig {
            config.pictureInPictureConfig = nativePictureInPictureConfig
        }
        return config
    }

    /**
     * When set to `true` the first frame of the main content will not be rendered before playback starts.
     * Default is `false`.
     *
     * To reliably hide the first frame before a pre-roll ad, please ensure that you are using the
     * `AdvertisingConfig` to schedule ads and not the `scheduleAd` API call.
     */
    var hideFirstFrame: Bool?
}
