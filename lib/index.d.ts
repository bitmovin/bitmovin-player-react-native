import { ViewStyle } from 'react-native';

/**
 * Utility type that maps the specified optional props from the target `Type` to be
 * required props. Note all the other props stay unaffected.
 *
 * @example
 * type MyType = {
 *   a?: string;
 *   b?: number;
 *   c?: boolean;
 * };
 *
 * type MyRequiredType = MakeRequired<MyType, 'a' | 'c'> // => { a: string; b?: number; c: boolean; }
 */
declare type MakeRequired<Type, Key extends keyof Type> = Omit<Type, Key> & Required<Pick<Type, Key>>;

/**
 * Supported subtitle/caption file formats.
 */
declare enum SubtitleFormat {
    CEA = "cea",
    TTML = "ttml",
    VTT = "vtt"
}
/**
 * Represents a custom subtitle track source that can be added to `SourceConfig.subtitleTracks`.
 */
interface SubtitleTrack {
    /**
     * The URL to the timed file, e.g. WebVTT file.
     */
    url?: string;
    /**
     * The label for this track.
     */
    label?: string;
    /**
     * The unique identifier for this track. If no value is provided, a random UUIDv4 will be generated for it.
     */
    identifier?: string;
    /**
     * Specifies the file format to be used by this track.
     */
    format?: SubtitleFormat;
    /**
     * If set to true, this track would be considered as default. Default is `false`.
     */
    isDefault?: boolean;
    /**
     * Tells if a subtitle track is forced. If set to `true` it means that the player should automatically
     * select and switch this subtitle according to the selected audio language. Forced subtitles do
     * not appear in `Player.getAvailableSubtitles`.
     *
     * Default is `false`.
     */
    isForced?: boolean;
    /**
     * The IETF BCP 47 language tag associated with this track, e.g. `pt`, `en`, `es` etc.
     */
    language?: string;
}
/**
 * Helper type that represents an entry in `SourceConfig.subtitleTracks` list.
 *
 * Since `SubtitleTrack` has all of its properties as optionals for total compatibility with
 * values that may be sent from native code, this type serves as a reinforcer of what properties
 * should be required during the registration of an external subtitle track from JS.
 */
declare type SideLoadedSubtitleTrack = MakeRequired<SubtitleTrack, 'url' | 'label' | 'language' | 'format'>;

/**
 * Base event type for all events.
 */
interface Event {
    /**
     * This event name as it is on the native side.
     */
    name: string;
    /**
     * The UNIX timestamp in which this event happened.
     */
    timestamp: number;
}
/**
 * Base event type for error and warning events.
 */
interface ErrorEvent extends Event {
    /**
     * Error/Warning's code number.
     */
    code?: number;
    /**
     * Error/Warning's localized message.
     */
    message: string;
    /**
     * Underlying data emitted with the Error/Warning.
     */
    data?: Record<string, any>;
}
/**
 * Emitted when a source is loaded into the player.
 * Seeking and time shifting are allowed as soon as this event is seen.
 */
interface PlayerActiveEvent extends Event {
}
/**
 * Emitted when a player error happens.
 */
interface PlayerErrorEvent extends ErrorEvent {
}
/**
 * Emitted when a player warning happens.
 */
interface PlayerWarningEvent extends ErrorEvent {
}
/**
 * Emitted when the player is destroyed.
 */
interface DestroyEvent extends Event {
}
/**
 * Emitted when the player is muted.
 */
interface MutedEvent extends Event {
}
/**
 * Emitted when the player is unmuted.
 */
interface UnmutedEvent extends Event {
}
/**
 * Emitted when the player is ready for immediate playback, because initial audio/video
 * has been downloaded.
 */
interface ReadyEvent extends Event {
}
/**
 * Emitted when the player is paused.
 */
interface PausedEvent extends Event {
    /**
     * The player's playback time from when this event happened.
     */
    time: number;
}
/**
 * Emitted when the player received an intention to start/resume playback.
 */
interface PlayEvent extends Event {
    /**
     * The player's playback time from when this event happened.
     */
    time: number;
}
/**
 * Emitted when playback has started.
 */
interface PlayingEvent extends Event {
    /**
     * The player's playback time from when this event happened.
     */
    time: number;
}
/**
 * Emitted when the playback of the current media has finished.
 */
interface PlaybackFinishedEvent extends Event {
}
/**
 * Source object representation the way it appears on `Event` payloads such as `SeekEvent`, for example.
 *
 * This interface only type hints what should be the shape of a `Source` object inside an `Event`'s
 * payload during runtime so it has no direct relation with the `Source` class present in `src/source.ts`.
 *
 * Do not mistake it for a `NativeInstance` type.
 */
interface EventSource {
    /**
     * Event's source duration in seconds.
     */
    duration: number;
    /**
     * Whether this event's source is currently active in a player.
     */
    isActive: boolean;
    /**
     * Whether this event's source is currently attached to a player instance.
     */
    isAttachedToPlayer: boolean;
    /**
     * Metadata for this event's source.
     */
    metadata?: Record<string, any>;
}
/**
 * Emitted when the player is about to seek to a new position.
 * Only applies to VoD streams.
 */
interface SeekEvent extends Event {
    /**
     * Removed source metadata.
     */
    from: {
        time: number;
        source: EventSource;
    };
    /**
     * Added source metadata.
     */
    to: {
        time: number;
        source: EventSource;
    };
}
/**
 * Emitted when seeking has finished and data to continue playback is available.
 * Only applies to VoD streams.
 */
interface SeekedEvent extends Event {
}
/**
 * Emitted when the current playback time has changed.
 */
interface TimeChangedEvent extends Event {
    /**
     * The player's playback time from when this event happened.
     */
    currentTime: number;
}
/**
 * Emitted when a new source loading has started.
 * It doesn't mean that the loading of the new manifest has finished.
 */
interface SourceLoadEvent extends Event {
    /**
     * Source that is about to load.
     */
    source: EventSource;
}
/**
 * Emitted when a new source is loaded.
 * It doesn't mean that the loading of the new manifest has finished.
 */
interface SourceLoadedEvent extends Event {
    /**
     * Source that was loaded into player.
     */
    source: EventSource;
}
/**
 * Emitted when the current source has been unloaded.
 */
interface SourceUnloadedEvent extends Event {
    /**
     * Source that was unloaded from player.
     */
    source: EventSource;
}
/**
 * Emitted when a source error happens.
 */
interface SourceErrorEvent extends ErrorEvent {
}
/**
 * Emitted when a source warning happens.
 */
interface SourceWarningEvent extends ErrorEvent {
}
/**
 * Emitted when a new subtitle track is added to the player.
 */
interface SubtitleAddedEvent extends Event {
    /**
     * Subtitle track that has been added.
     */
    subtitleTrack: SubtitleTrack;
}
/**
 * Emitted when a subtitle track is removed from the player.
 */
interface SubtitleRemovedEvent extends Event {
    /**
     * Subtitle track that has been removed.
     */
    subtitleTrack: SubtitleTrack;
}
/**
 * Emitted when the player's selected subtitle track has changed.
 */
interface SubtitleChangedEvent extends Event {
    /**
     * Subtitle track that was previously selected.
     */
    oldSubtitleTrack: SubtitleTrack;
    /**
     * Subtitle track that is selected now.
     */
    newSubtitleTrack: SubtitleTrack;
}

/**
 * Type that defines all event props supported by `PlayerView` and `NativePlayerView`.
 * Used to generate the specific events interface for each component.
 */
interface EventProps {
    onDestroy: DestroyEvent;
    onEvent: Event;
    onMuted: MutedEvent;
    onPaused: PausedEvent;
    onPlay: PlayEvent;
    onPlaybackFinished: PlaybackFinishedEvent;
    onPlayerActive: PlayerActiveEvent;
    onPlayerError: PlayerErrorEvent;
    onPlayerWarning: PlayerWarningEvent;
    onPlaying: PlayingEvent;
    onReady: ReadyEvent;
    onSeek: SeekEvent;
    onSeeked: SeekedEvent;
    onSourceError: SourceErrorEvent;
    onSourceLoad: SourceLoadEvent;
    onSourceLoaded: SourceLoadedEvent;
    onSourceUnloaded: SourceUnloadedEvent;
    onSourceWarning: SourceWarningEvent;
    onSubtitleAdded: SubtitleAddedEvent;
    onSubtitleChanged: SubtitleChangedEvent;
    onSubtitleRemoved: SubtitleRemovedEvent;
    onTimeChanged: TimeChangedEvent;
    onUnmuted: UnmutedEvent;
}
/**
 * Event props for `PlayerView`.
 *
 * Note the events of `PlayerView` are simply a proxy over
 * the events from `NativePlayerView` just removing RN's bubbling data.
 */
declare type PlayerViewEvents = {
    [Prop in keyof EventProps]?: (event: EventProps[Prop]) => void;
};

interface NativeInstanceConfig {
    /**
     * Optionally user-defined string `id` for the native instance.
     * Used to access a certain native instance from any point in the source code then call
     * methods/properties on it.
     *
     * When left empty, a random `UUIDv4` is generated for it.
     * @example
     * Accessing or creating the `Player` with `nativeId` equal to `my-player`:
     * ```
     * const player = new Player({ nativeId: 'my-player' })
     * player.play(); // call methods and properties...
     * ```
     */
    nativeId?: string;
}
declare abstract class NativeInstance<Config extends NativeInstanceConfig> {
    /**
     * Optionally user-defined string `id` for the native instance, or UUIDv4.
     */
    readonly nativeId: string;
    /**
     * The configuration object used to initialize this instance.
     */
    readonly config?: Config;
    /**
     * Generate UUID in case the user-defined `nativeId` is empty.
     */
    constructor(config?: Config);
    /**
     * Flag indicating whether the native resources of this object have been created internally
     * .i.e `initialize` has been called.
     */
    abstract isInitialized: boolean;
    /**
     * Create the native object/resources that will be managed by this instance.
     */
    abstract initialize(): void;
    /**
     * Flag indicating whether the native resources of this object have been disposed .i.e
     * `destroy` has been called.
     */
    abstract isDestroyed: boolean;
    /**
     * Dispose the native object/resources created by this instance during `initialize`.
     */
    abstract destroy(): void;
}

/**
 * Represents a FairPlay Streaming DRM config.
 */
interface FairplayConfig {
    /**
     * The DRM license acquisition URL.
     */
    licenseUrl: string;
    /**
     * The URL to the FairPlay Streaming certificate of the license server.
     */
    certificateUrl?: string;
    /**
     * A dictionary to specify custom HTTP headers for the license request.
     */
    licenseRequestHeaders?: Record<string, string>;
    /**
     * A dictionary to specify custom HTTP headers for the certificate request.
     */
    certificateRequestHeaders?: Record<string, string>;
    /**
     * A block to prepare the loaded certificate before building SPC data and passing it into the
     * system. This is needed if the server responds with anything else than the certificate, e.g. if
     * the certificate is wrapped into a JSON object. The server response for the certificate request
     * is passed as parameter “as is”.
     *
     * Note that both the passed `certificate` data and this block return value should be a Base64
     * string. So use whatever solution suits you best to handle Base64 in React Native.
     *
     * @param certificate - Base64 encoded certificate data.
     * @returns The processed Base64 encoded certificate.
     */
    prepareCertificate?: (certificate: string) => string;
    /**
     * A block to prepare the data which is sent as the body of the POST license request.
     * As many DRM providers expect different, vendor-specific messages, this can be done using
     * this user-defined block.
     *
     * Note that both the passed `message` data and this block return value should be a Base64 string.
     * So use whatever solution suits you best to handle Base64 in React Native.
     *
     * @param message - Base64 encoded message data.
     * @param assetId - Stream asset ID.
     * @returns The processed Base64 encoded message.
     */
    prepareMessage?: (message: string, assetId: string) => string;
    /**
     * A block to prepare the data which is sent as the body of the POST request for syncing the DRM
     * license information.
     *
     * Note that both the passed `syncMessage` data and this block return value should be a Base64
     * string. So use whatever solution suits you best to handle Base64 in React Native.
     *
     * @param message - Base64 encoded message data.
     * @param assetId - Asset ID.
     * @returns The processed Base64 encoded sync message.
     */
    prepareSyncMessage?: (syncMessage: string, assetId: string) => string;
    /**
     * A block to prepare the loaded CKC Data before passing it to the system. This is needed if the
     * server responds with anything else than the license, e.g. if the license is wrapped into a JSON
     * object.
     *
     * Note that both the passed `license` data and this block return value should be a Base64 string.
     * So use whatever solution suits you best to handle Base64 in React Native.
     *
     * @param license - Base64 encoded license data.
     * @returns The processed Base64 encoded license.
     */
    prepareLicense?: (license: string) => string;
    /**
     * A block to prepare the URI (without the skd://) from the HLS manifest before passing it to the
     * system.
     *
     * @param licenseServerUrl - License server URL string.
     * @returns The processed license server URL string.
     */
    prepareLicenseServerUrl?: (licenseServerUrl: string) => string;
    /**
     * A block to prepare the `contentId`, which is sent to the FairPlay Streaming license server as
     * request body, and which is used to build the SPC data. As many DRM providers expect different,
     * vendor-specific messages, this can be done using this user-defined block. The parameter is the
     * skd:// URI extracted from the HLS manifest (m3u8) and the return value should be the contentID
     * as string.
     *
     * @param contentId - Extracted content id string.
     * @returns The processed contentId.
     */
    prepareContentId?: (contentId: string) => string;
}

/**
 * Represents a Widevine Streaming DRM config.
 */
interface WidevineConfig {
    /**
     * The DRM license acquisition URL.
     */
    licenseUrl: string;
    /**
     * A block to prepare the data which is sent as the body of the POST license request.
     * As many DRM providers expect different, vendor-specific messages, this can be done using
     * this user-defined block.
     *
     * Note that both the passed `message` data and this block return value should be a Base64 string.
     * So use whatever solution suits you best to handle Base64 in React Native.
     *
     * @param message - Base64 encoded message data.
     * @returns The processed Base64 encoded message.
     */
    prepareMessage?: (message: string) => string;
    /**
     * A block to prepare the loaded CKC Data before passing it to the system. This is needed if the
     * server responds with anything else than the license, e.g. if the license is wrapped into a JSON
     * object.
     *
     * Note that both the passed `license` data and this block return value should be a Base64 string.
     * So use whatever solution suits you best to handle Base64 in React Native.
     *
     * @param license - Base64 encoded license data.
     * @returns The processed Base64 encoded license.
     */
    prepareLicense?: (license: string) => string;
    /**
     * Set widevine's preferred security level. Android only.
     */
    preferredSecurityLevel?: string;
}

/**
 * Represents the general Streaming DRM config.
 */
interface DrmConfig extends NativeInstanceConfig {
    /**
     * FairPlay specific configuration. Only applicable for iOS.
     */
    fairplay?: FairplayConfig;
    /**
     * Widevine specific configuration. Only applicable for Android.
     */
    widevine?: WidevineConfig;
}
/**
 * Represents a native DRM configuration object.
 */
declare class Drm extends NativeInstance<DrmConfig> {
    /**
     * Whether this object's native instance has been created.
     */
    isInitialized: boolean;
    /**
     * Whether this object's native instance has been disposed.
     */
    isDestroyed: boolean;
    /**
     * Allocates the DRM config instance and its resources natively.
     */
    initialize: () => void;
    /**
     * Destroys the native DRM config and releases all of its allocated resources.
     */
    destroy: () => void;
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareCertificate` function to native's `certificate` data and store
     * the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareCertificate` is dispatched.
     *
     * @param certificate - Base64 encoded certificate data.
     */
    onPrepareCertificate: (certificate: string) => void;
    /**
     * Applies the user-defined `prepareMessage` function to native's `message` data and store
     * the result back in `DrmModule`.
     *
     * Called from native code when `prepareMessage` is dispatched.
     *
     * @param message - Base64 encoded message data.
     * @param assetId - Optional asset ID. Only sent by iOS.
     */
    onPrepareMessage: (message: string, assetId?: string) => void;
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareSyncMessage` function to native's `syncMessage` data and
     * store the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareSyncMessage` is dispatched.
     *
     * @param syncMessage - Base64 encoded sync SPC message data.
     */
    onPrepareSyncMessage: (syncMessage: string, assetId: string) => void;
    /**
     * Applies the user-defined `prepareLicense` function to native's `license` data and store
     * the result back in `DrmModule`.
     *
     * Called from native code when `prepareLicense` is dispatched.
     *
     * @param license - Base64 encoded license data.
     */
    onPrepareLicense: (license: string) => void;
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareLicenseServerUrl` function to native's `licenseServerUrl` data
     * and store the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareLicenseServerUrl` is dispatched.
     *
     * @param licenseServerUrl - The license server URL string.
     */
    onPrepareLicenseServerUrl: (licenseServerUrl: string) => void;
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareContentId` function to native's `contentId` string
     * and store the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareContentId` is dispatched.
     *
     * @param contentId - The extracted contentId string.
     */
    onPrepareContentId: (contentId: string) => void;
}

/**
 * Types of media that can be handled by the player.
 */
declare enum SourceType {
    /**
     * Indicates a missing source type.
     */
    NONE = "none",
    /**
     * Indicates media type HLS.
     */
    HLS = "hls",
    /**
     * Indicates media type DASH.
     */
    DASH = "dash",
    /**
     * Indicates media type Progressive MP4.
     */
    PROGRESSIVE = "progressive"
}
/**
 * The different loading states a `Source` instance can be in.
 */
declare enum LoadingState {
    /**
     * The source is unloaded.
     */
    UNLOADED = 0,
    /**
     * The source is currently loading.
     */
    LOADING = 1,
    /**
     * The source is loaded.
     */
    LOADED = 2
}
/**
 * Represents a source configuration that be loaded into a player instance.
 */
interface SourceConfig extends NativeInstanceConfig {
    /**
     *  The url for this source configuration.
     */
    url: string;
    /**
     * The `SourceType` for this configuration.
     */
    type?: SourceType;
    /**
     * The title of the video source.
     */
    title?: string;
    /**
     * The URL to a preview image displayed until the video starts.
     */
    poster?: string;
    /**
     * Indicates whether to show the poster image during playback.
     * Useful, for example, for audio-only streams.
     */
    isPosterPersistent?: boolean;
    /**
     * The DRM config for the source.
     */
    drmConfig?: DrmConfig;
    /**
     * External subtitle tracks to be added into the player.
     */
    subtitleTracks?: SideLoadedSubtitleTrack[];
}
/**
 * Represents audio and video content that can be loaded into a player.
 */
declare class Source extends NativeInstance<SourceConfig> {
    /**
     * The native DRM config reference of this source.
     */
    drm?: Drm;
    /**
     * Whether the native `Source` object has been created.
     */
    isInitialized: boolean;
    /**
     * Whether the native `Source` object has been disposed.
     */
    isDestroyed: boolean;
    /**
     * Allocates the native `Source` instance and its resources natively.
     */
    initialize: () => void;
    /**
     * Destroys the native `Source` and releases all of its allocated resources.
     */
    destroy: () => void;
    /**
     * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
     * Default value is `0` if the duration is not available or not known.
     */
    duration: () => Promise<number>;
    /**
     * Whether the source is currently active in a player (i.e. playing back or paused).
     * Only one source can be active in the same player instance at any time.
     */
    isActive: () => Promise<boolean>;
    /**
     * Whether the source is currently attached to a player instance.
     */
    isAttachedToPlayer: () => Promise<boolean>;
    /**
     * Metadata for the currently loaded source.
     */
    metadata: () => Promise<Record<string, any> | null>;
    /**
     * Set metadata for the currently loaded source.
     * Setting the metadata to `null` clears the metadata object in native source.
     */
    setMetadata: (metadata: Record<string, any> | null) => void;
    /**
     * The current `LoadingState` of the source.
     */
    loadingState: () => Promise<LoadingState>;
}

/**
 * Object used to configure a new `Player` instance.
 */
interface PlayerConfig extends NativeInstanceConfig {
    /**
     * Bitmovin license key that can be found in the Bitmovin portal.
     * If a license key is set here, it will be used instead of the license key found in the `Info.plist` and `AndroidManifest.xml`.
     * @example
     * Configuring the player license key from source code:
     * ```
     * const player = new Player({
     *   licenseKey: '\<LICENSE-KEY-CODE\>',
     * });
     * ```
     * @example
     * `licenseKey` can be safely omitted from source code if it has
     * been configured in Info.plist/AndroidManifest.xml.
     * ```
     * const player = new Player(); // omit `licenseKey`
     * player.play(); // call methods and properties...
     * ```
     */
    licenseKey?: string;
    /**
     * Configures playback behaviour. A default PlaybackConfig is set initially.
     */
    playbackConfig?: PlaybackConfig;
}
/**
 * Configures the playback behaviour of the player.
 */
interface PlaybackConfig {
    /**
     * Whether the player starts playing automatically after loading a source or not. Default is `false`.
     * @example
     * ```
     * const player = new Player({
     *   playbackConfig: {
     *     isAutoplayEnabled: true,
     *   },
     * });
     * ```
     */
    isAutoplayEnabled?: boolean;
    /**
     * Whether the sound is muted on startup or not. Default value is `false`.
     * @example
     * ```
     * const player = new Player({
     *   playbackConfig: {
     *     isMuted: true,
     *   },
     * });
     * ```
     */
    isMuted?: boolean;
    /**
     * Whether time shift / DVR for live streams is enabled or not. Default is `true`.
     *  @example
     * ```
     * const player = new Player({
     *   playbackConfig: {
     *     isTimeShiftEnabled: false,
     *   },
     * });
     * ```
     */
    isTimeShiftEnabled?: boolean;
    /**
     * Whether background playback is enabled or not.
     * Default is `false`.
     *
     * When set to `true`, playback is not automatically paused
     * anymore when the app moves to the background.
     * When set to `true`, also make sure to properly configure your app to allow
     * background playback.
     *
     * On tvOS, background playback is only supported for audio-only content.
     *
     * Default is `false`.
     *
     *  @example
     * ```
     * const player = new Player({
     *   {
     *     isBackgroundPlaybackEnabled: true,
     *   }
     * })
     * ```
     */
    isBackgroundPlaybackEnabled?: boolean;
    /**
     * Whether the picture-in-picture mode option is enabled for iOS or not. Default is `false`.
     *  @example
     * ```
     * const player = new Player({
     *   playbackConfig: {
     *     isPictureInPictureEnabled: true,
     *   },
     * });
     * ```
     */
    isPictureInPictureEnabled?: boolean;
}
/**
 * Loads, controls and renders audio and video content represented through `Source`s. A player
 * instance can be created via the `usePlayer` hook and will idle until one or more `Source`s are
 * loaded. Once `load` is called, the player becomes active and initiates necessary downloads to
 * start playback of the loaded source(s).
 *
 * Can be attached to `PlayerView` component in order to use Bitmovin's Player Web UI.
 * @see PlayerView
 */
declare class Player extends NativeInstance<PlayerConfig> {
    /**
     * Currently active source, or `null` if none is active.
     */
    source?: Source;
    /**
     * Whether the native `Player` object has been created.
     */
    isInitialized: boolean;
    /**
     * Whether the native `Player` object has been disposed.
     */
    isDestroyed: boolean;
    /**
     * Allocates the native `Player` instance and its resources natively.
     */
    initialize: () => void;
    /**
     * Destroys the native `Player` and releases all of its allocated resources.
     */
    destroy: () => void;
    /**
     * Loads a new `Source` from `sourceConfig` into the player.
     */
    load: (sourceConfig: SourceConfig) => void;
    /**
     * Loads the given `Source` into the player.
     */
    loadSource: (source: Source) => void;
    /**
     * Unloads all `Source`s from the player.
     */
    unload: () => void;
    /**
     * Starts or resumes playback after being paused. Has no effect if the player is already playing.
     */
    play: () => void;
    /**
     * Pauses the video if it is playing. Has no effect if the player is already paused.
     */
    pause: () => void;
    /**
     * Seeks to the given playback time specified by the parameter `time` in seconds. Must not be
     * greater than the total duration of the video. Has no effect when watching a live stream since
     * seeking is not possible.
     *
     * @param time - The time to seek to in seconds.
     */
    seek: (time: number) => void;
    /**
     * Mutes the player if an audio track is available. Has no effect if the player is already muted.
     */
    mute: () => void;
    /**
     * Unmutes the player if it is muted. Has no effect if the player is already unmuted.
     */
    unmute: () => void;
    /**
     * Sets the player's volume between 0 (silent) and 100 (max volume).
     *
     * @param volume - The volume level to set.
     */
    setVolume: (volume: number) => void;
    /**
     * @returns The player's current volume level.
     */
    getVolume: () => Promise<number>;
    /**
     * @returns The current playback time in seconds.
     *
     * For VoD streams the returned time ranges between 0 and the duration of the asset.
     *
     * For live streams it can be specified if an absolute UNIX timestamp or a value
     * relative to the playback start should be returned.
     *
     * @param mode - The time mode to specify: an absolute UNIX timestamp ('absolute') or relative time ('relative').
     */
    getCurrentTime: (mode?: 'relative' | 'absolute') => Promise<number>;
    /**
     * @returns The total duration in seconds of the current video or INFINITY if it’s a live stream.
     */
    getDuration: () => Promise<number>;
    /**
     * @returns `true` if the player is muted.
     */
    isMuted: () => Promise<boolean>;
    /**
     * @returns `true` if the player is currently playing, i.e. has started and is not paused.
     */
    isPlaying: () => Promise<boolean>;
    /**
     * @returns `true` if the player has started playback but it's currently paused.
     */
    isPaused: () => Promise<boolean>;
    /**
     * @returns `true` if the displayed video is a live stream.
     */
    isLive: () => Promise<boolean>;
    /**
     * @remarks Only available for iOS devices.
     * @returns `true` when media is played externally using AirPlay.
     */
    isAirPlayActive: () => Promise<boolean>;
    /**
     * @remarks Only available for iOS devices.
     * @returns `true` when AirPlay is available.
     */
    isAirPlayAvailable: () => Promise<boolean>;
    /**
     * @returns An array containing SubtitleTrack objects for all available subtitle tracks.
     */
    getAvailableSubtitles: () => Promise<SubtitleTrack[]>;
}

/**
 * Base `PlayerView` component props. Used to stablish common
 * props between `NativePlayerView` and `PlayerView`.
 * @see NativePlayerView
 */
interface BasePlayerViewProps {
    style?: ViewStyle;
}
/**
 * `PlayerView` component props.
 * @see PlayerView
 */
interface PlayerViewProps extends BasePlayerViewProps, PlayerViewEvents {
    /**
     * `Player` instance (generally returned from `usePlayer` hook) that will control
     * and render audio/video inside the `PlayerView`.
     */
    player: Player;
}
/**
 * Component that provides the Bitmovin Player UI and default UI handling to an attached `Player` instance.
 * This component needs a `Player` instance to work properly so make sure one is passed to it as a prop.
 */
declare function PlayerView(props: PlayerViewProps): JSX.Element;

/**
 * React hook that creates and returns a reference to a `Player` instance
 * that can be used inside any component.
 */
declare function usePlayer(config?: PlayerConfig): Player;

export { BasePlayerViewProps, DestroyEvent, Drm, DrmConfig, ErrorEvent, Event, EventSource, FairplayConfig, LoadingState, MutedEvent, PausedEvent, PlayEvent, PlaybackConfig, PlaybackFinishedEvent, Player, PlayerActiveEvent, PlayerConfig, PlayerErrorEvent, PlayerView, PlayerViewProps, PlayerWarningEvent, PlayingEvent, ReadyEvent, SeekEvent, SeekedEvent, SideLoadedSubtitleTrack, Source, SourceConfig, SourceErrorEvent, SourceLoadEvent, SourceLoadedEvent, SourceType, SourceUnloadedEvent, SourceWarningEvent, SubtitleAddedEvent, SubtitleChangedEvent, SubtitleFormat, SubtitleRemovedEvent, SubtitleTrack, TimeChangedEvent, UnmutedEvent, WidevineConfig, usePlayer };
