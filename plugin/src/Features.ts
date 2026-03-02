export default interface Features {
  airPlay?: boolean;
  backgroundPlayback?: boolean;
  /**
   * Controls whether Google IMA SDK dependencies are linked.
   * Defaults to `true`.
   */
  googleIMA?:
    | boolean
    | {
        android?: boolean;
        ios?: boolean;
      };
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
