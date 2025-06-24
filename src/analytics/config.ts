/**
 * Object used to configure the build-in analytics collector.
 */
export interface AnalyticsConfig {
  /**
   * The analytics license key
   */
  licenseKey: string;
  /**
   * Flag to enable Ad tracking (default: false).
   */
  adTrackingDisabled?: boolean;
  /**
   * Flag to use randomised userId not depending on device specific values (default: false).
   */
  randomizeUserId?: boolean;
  /**
   * Default metadata to be sent with events.
   * Fields of the `SourceMetadata` are prioritized over the default metadata.
   */
  defaultMetadata?: DefaultMetadata;
}

/**
 * DefaultMetadata that can be used to enrich the analytics data.
 * DefaultMetadata is not bound to a specific source and can be used to set fields for the lifecycle of the collector.
 * If fields are specified in `SourceMetadata` and `DefaultMetadata`, `SourceMetadata` takes precedence.
 */
export interface DefaultMetadata extends CustomDataConfig {
  /**
   * CDN Provide that the video playback session is using.
   */
  cdnProvider?: string;
  /**
   * User ID of the customer.
   */
  customUserId?: string;
}

/**
 * `SourceMetadata` that can be used to enrich the analytics data.
 */
export interface SourceMetadata extends CustomDataConfig {
  /**
   * ID of the video in the CMS system
   */
  videoId?: string;

  /**
   * Human readable title of the video asset currently playing
   */
  title?: string;

  /**
   * Breadcrumb path to show where in the app the user is
   */
  path?: string;

  /**
   * Flag to see if stream is live before stream metadata is available
   */
  isLive?: boolean;

  /**
   * CDN Provider that the video playback session is using
   */
  cdnProvider?: string;
}

/**
 * Free-form data that can be used to enrich the analytics data
 * If customData is specified in `SourceMetadata` and `DefaultMetadata`
 * data is merged on a field basis with `SourceMetadata` taking precedence.
 */
export interface CustomDataConfig {
  /**
   * Optional free-form custom data
   */
  customData1?: string;

  /**
   * Optional free-form custom data
   */
  customData2?: string;

  /**
   * Optional free-form custom data
   */
  customData3?: string;

  /**
   * Optional free-form custom data
   */
  customData4?: string;

  /**
   * Optional free-form custom data
   */
  customData5?: string;

  /**
   * Optional free-form custom data
   */
  customData6?: string;

  /**
   * Optional free-form custom data
   */
  customData7?: string;

  /**
   * Optional free-form custom data
   */
  customData8?: string;

  /**
   * Optional free-form custom data
   */
  customData9?: string;

  /**
   * Optional free-form custom data
   */
  customData10?: string;

  /**
   * Optional free-form custom data
   */
  customData11?: string;

  /**
   * Optional free-form custom data
   */
  customData12?: string;

  /**
   * Optional free-form custom data
   */
  customData13?: string;

  /**
   * Optional free-form custom data
   */
  customData14?: string;

  /**
   * Optional free-form custom data
   */
  customData15?: string;

  /**
   * Optional free-form custom data
   */
  customData16?: string;

  /**
   * Optional free-form custom data
   */
  customData17?: string;

  /**
   * Optional free-form custom data
   */
  customData18?: string;

  /**
   * Optional free-form custom data
   */
  customData19?: string;

  /**
   * Optional free-form custom data
   */
  customData20?: string;

  /**
   * Optional free-form custom data
   */
  customData21?: string;

  /**
   * Optional free-form custom data
   */
  customData22?: string;

  /**
   * Optional free-form custom data
   */
  customData23?: string;

  /**
   * Optional free-form custom data
   */
  customData24?: string;

  /**
   * Optional free-form custom data
   */
  customData25?: string;

  /**
   * Optional free-form custom data
   */
  customData26?: string;

  /**
   * Optional free-form custom data
   */
  customData27?: string;

  /**
   * Optional free-form custom data
   */
  customData28?: string;

  /**
   * Optional free-form custom data
   */
  customData29?: string;

  /**
   * Optional free-form custom data
   */
  customData30?: string;

  /**
   * Experiment name needed for A/B testing.
   */
  experimentName?: string;
}
