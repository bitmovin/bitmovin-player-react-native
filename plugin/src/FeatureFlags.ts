export default interface FeatureFlags {
  airPlay?: boolean;
  backgroundPlayback?: boolean;
  googleCastSDK?: {
    android: string | { version: string };
    ios:
      | string
      | {
          version: string;
          appId?: string;
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
