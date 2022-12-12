/**
 * Contains the states an OfflineOptionEntry can have.
 */
export enum OfflineOptionEntryState {
  /**
   * The `OfflineOptionEntry` is downloaded and ready for offline playback.
   */
  Downloaded = 'Downloaded',
  /**
   * The `OfflineOptionEntry` is currently downloading.
   */
  Downloading = 'Downloading',
  /**
   * The download of the `OfflineOptionEntry` is suspended, and is only partly downloaded yet.
   */
  Suspended = 'Suspended',
  /**
   * The `OfflineOptionEntry` is not downloaded. However, some data may be still cached.
   */
  NotDownloaded = 'NotDownloaded',
}

/**
 * Superclass of entries which can be selected to download for offline playback
 */
export interface OfflineOptionEntry {
  /**
   * The ID of the option.
   */
  id: string;
  /**
   * The language of the option.
   */
  language?: string;
}

/**
 * Represents the information from the `OfflineContentManagerListener` that is available to download
 */
export interface OfflineContentOptions {
  videoOptions: OfflineOptionEntry[];
  /**
   * Represents the audio options available for download
   */
  audioOptions: OfflineOptionEntry[];
  /**
   * Represents the text options available for download
   */
  textOptions: OfflineOptionEntry[];
}

export interface OfflineDownloadRequest {
  minimumBitrate: number;
  audioOptionIds: string[];
  textOptionIds: string[];
}
