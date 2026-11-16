export default interface Features {
  airPlay?: boolean;
  backgroundPlayback?: boolean;
  /**
   * Includes the Google Interactive Media Ads SDK in native builds.
   * IMA ad sources require the SDK. On Android, a host-supplied SDK remains
   * available when this automatic dependency flag is false.
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
