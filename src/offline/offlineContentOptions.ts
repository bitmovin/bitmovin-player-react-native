/**
 * Superclass of entries which can be selected to download for offline playback
 * @platform Android, iOS
 */
export interface OfflineContentOptionEntry {
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
 * Represents the downloadable options provided via the `onOptionsAvailable` callback on `OfflineContentManagerListener`
 * @platform Android, iOS
 */
export interface OfflineContentOptions {
  /**
   * Represents the audio options available for download
   */
  audioOptions: OfflineContentOptionEntry[];
  /**
   * Represents the text options available for download
   */
  textOptions: OfflineContentOptionEntry[];
}
