/**
 * Object used configure how the native offline managers create and get offline source configurations
 */
export interface OfflineSourceOptions {
  /**
   * Whether or not the player should restrict playback only to audio, video and subtitle tracks which are stored offline on the device. This has to be set to true if the device has no network access.
   * @platform iOS
   */
  restrictedToAssetCache?: boolean;
}
