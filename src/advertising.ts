/**
 * Quartiles that can be reached during an ad playback.
 */
export enum AdQuartile {
  /**
   * Fist ad quartile.
   */
  FIRST = 'first',
  /**
   * Mid ad quartile.
   */
  MID_POINT = 'mid_point',
  /**
   * Third ad quartile.
   */
  THIRD = 'third',
}

/**
 * The possible types an `AdSource` can be.
 */
export enum AdSourceType {
  /**
   * Google Interactive Media Ads.
   */
  IMA = 'ima',
  /**
   * Unknown ad source type.
   */
  UNKNOWN = 'unknown',
  /**
   * Progressive ad type.
   */
  PROGRESSIVE = 'progressive',
}

/**
 * Represents an ad source which can be assigned to an `AdItem`. An `AdItem` can have multiple `AdSource`s
 * as waterfalling option.
 */
export interface AdSource {
  /**
   * The ad tag / url to the ad manifest.
   */
  tag: string;
  /**
   * The `AdSourceType` of this `AdSource`.
   */
  type: AdSourceType;
}

/**
 * Represents an ad break which can be scheduled for playback.
 *
 * One single `AdItem` can have multiple `AdSource`s where all but the first act as fallback ad sources
 * if the first one fails to load. The start and end of an ad break are signaled via `AdBreakStartedEvent`
 * and `AdBreakFinishedEvent`.
 */
export interface AdItem {
  /**
   * The playback position at which the ad break is scheduled to start. Default value is "pre".
   *
   * Possible values are:
   *  • "pre": pre-roll ad (for VoD and Live streaming)
   *  • "post": post-roll ad (for VoD streaming only)
   *  • fractional seconds: "10", "12.5" (mid-roll ad, for VoD and Live streaming)
   *  • percentage of the entire video duration: "25%", "50%" (mid-roll ad, for VoD streaming only)
   *  • timecode hh:mm:ss.mmm: "00:10:30.000", "01:00:00.000" (mid-roll ad, for VoD streaming only)
   */
  position?: string;
  /**
   * The `AdSource`s that make up this `AdItem`. The first ad source in this array is used as the main ad.
   * Subsequent ad sources act as a fallback, meaning that if the main ad source does not provide a
   * valid response, the subsequent ad sources will be utilized one after another.
   *
   * The fallback ad sources need to have the same `AdSourceType` as the main ad source.
   */
  sources: AdSource[];

  /**
   * The amount of seconds the ad manifest is loaded in advance
   * compared to when the ad break is scheduled for playback.
   *
   * Default value is 0.0
   *
   * @platform Android
   */
  preloadOffset?: number;
}

/**
 * Contains configuration values regarding the ads which should be played back by the player.
 */
export interface AdvertisingConfig {
  /**
   * The ad items that are scheduled when a new playback session is started via `Player.load()`.
   */
  schedule: AdItem[];
  /**
   * Configuration to customize Google IMA SDK integration.
   */
  ima?: ImaAdvertisingConfig;
}

/**
 * Configuration options applied to Google IMA SDK before initialization.
 */
export interface ImaAdvertisingConfig {
  /**
   * Invoked before the IMA SDK initializes, allowing mutation of the SDK settings.
   *
   * @param settings - Current IMA settings received from the native SDK.
   * @returns The settings object to apply. If omitted, the (mutated) `settings` argument is used.
   */
  beforeInitialization?: (settings: ImaSettings) => ImaSettings | void;
}

/**
 * Represents Google IMA SDK wide settings.
 */
export interface ImaSettings {
  /**
   * Publisher Provided Identification (PPID) sent with ad requests.
   */
  ppid?: string;
  /**
   * Language identifier in IETF BCP 47 format.
   */
  language: string;
  /**
   * Maximum allowed wrapper redirects. Default is `4`.
   */
  maxRedirects: number;
  /**
   * Enables background audio playback. Defaults to `false`.
   *
   * @platform iOS, tvOS
   */
  enableBackgroundPlayback?: boolean;
  /**
   * Player version identifier reported to IMA.
   */
  playerVersion?: string;
  /**
   * Session identifier used for frequency capping.
   */
  sessionId?: string;
  /**
   * Controls Same App Key usage.
   *
   * @platform iOS
   */
  sameAppKeyEnabled?: boolean;
}

/**
 * Contains the base configuration options for an ad.
 */
export interface AdConfig {
  /**
   * Specifies how many seconds of the main video content should be replaced by ad break(s).
   */
  replaceContentDuration: number;
}

/**
 * Holds various additional ad data.
 */
export interface AdData {
  /**
   * The average bitrate of the progressive media file as defined in the VAST response.
   */
  bitrate?: number;
  /**
   * The maximum bitrate of the streaming media file as defined in the VAST response.
   */
  maxBitrate?: number;
  /**
   * The MIME type of the media file or creative as defined in the VAST response.
   */
  mimeType?: string;
  /**
   * The minimum bitrate of the streaming media file as defined in the VAST response.
   */
  minBitrate?: number;
}

/**
 * Defines basic properties available for every ad type.
 */
export interface Ad {
  /**
   * The url the user should be redirected to when clicking the ad.
   */
  clickThroughUrl?: string;
  /**
   * Holds various additional `AdData`.
   */
  data?: AdData;
  /**
   * The height of the ad.
   */
  height: number;
  /**
   * Identifier for the ad. This might be autogenerated.
   */
  id?: string;
  /**
   * Determines whether an ad is linear, i.e. playback of main content needs to be paused for the ad.
   */
  isLinear: boolean;
  /**
   * The corresponding media file url for the ad.
   */
  mediaFileUrl?: string;
  /**
   * The width of the ad.
   */
  width: number;
}

/**
 * Contains information about an ad break.
 */
export interface AdBreak {
  /**
   * The ads scheduled for this `AdBreak`.
   */
  ads: Ad[];
  /**
   * The id of the corresponding `AdBreakConfig`. This will be auto-generated.
   */
  id: string;
  /**
   * The time in seconds in the media timeline the `AdBreak` is scheduled for.
   */
  scheduleTime: number;
}
