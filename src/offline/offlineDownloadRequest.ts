/**
 * Represents the configuration to start a download.
 * @platform Android, iOS
 */
export interface OfflineDownloadRequest {
  minimumBitrate?: number;
  audioOptionIds?: string[];
  textOptionIds?: string[];
}
