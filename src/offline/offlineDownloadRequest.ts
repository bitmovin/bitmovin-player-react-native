/**
 * Represents the configuration to start a download.
 * @platform Android, iOS
 */
export interface OfflineDownloadRequest {
  /**
   * Minimum video bitrate to download. The nearest higher available bitrate will be selected.
   */
  minimumBitrate?: number;

  /**
   * Audio tracks with IDs to download.
   */
  audioOptionIds?: string[];

  /**
   * Text tracks with IDs to download.
   */
  textOptionIds?: string[];
}
