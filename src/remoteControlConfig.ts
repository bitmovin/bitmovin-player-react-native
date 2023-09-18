/**
 * Configures remote playback behavior.
 */
export interface RemoteControlConfig {
  /**
   * A URL to a CSS file the receiver app loads to style the receiver app.
   * Default value is `null`, indicating that the default CSS of the receiver app will be used.
   */
  receiverStylesheetUrl?: string | null;
  /**
   * A Map containing custom configuration values that are sent to the remote control receiver.
   * Default value is an empty map.
   */
  customReceiverConfig?: Record<string, string | null>;
  /**
   * Whether casting is enabled.
   * Default value is `true`.
   *
   * Has no effect if the BitmovinCastManager is not initialized in the app's context.
   */
  isCastEnabled?: boolean;
  /**
   * Indicates whether cookies and credentials will be sent along manifest requests on the cast receiver
   * Default value is `false`.
   */
  sendManifestRequestsWithCredentials?: boolean;
  /**
   * Indicates whether cookies and credentials will be sent along segment requests on the cast receiver
   * Default value is `false`.
   */
  sendSegmentRequestsWithCredentials?: boolean;
  /**
   * Indicates whether cookies and credentials will be sent along DRM licence requests on the cast receiver
   * Default value is `false`.
   */
  sendDrmLicenseRequestsWithCredentials?: boolean;
}
