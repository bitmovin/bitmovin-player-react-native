export default interface Features {
  airPlay?: boolean;
  backgroundPlayback?: boolean;
  /**
   * Enables the Google Interactive Media Ads SDK on Android, iOS, and tvOS.
   *
   * @defaultValue `false`
   */
  googleIMA?: boolean;
  googleCastSDK?: {
    appId?: string;
    messageNamespace?: string;
    android:
      | string
      | {
          version: string;
          appId?: string;
          messageNamespace?: string;
        };
    ios:
      | string
      | {
          version: string;
          appId?: string;
          messageNamespace?: string;
          localNetworkUsageDescription?: string;
        };
  };
  offline?:
    | boolean
    | {
        android?: { isEnabled: boolean; externalStoragePermission?: boolean };
        ios?: { isEnabled: boolean };
      };
  pictureInPicture?: boolean;
}
