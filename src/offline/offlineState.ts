/**
 * Contains the state an OfflineContentManager can have.
 * @remarks Platform: Android, iOS
 */
export enum OfflineState {
  /**
   * The offline content is downloaded and ready for offline playback.
   */
  Downloaded = 'Downloaded',
  /**
   * The offline content is currently downloading.
   */
  Downloading = 'Downloading',
  /**
   * The download of the offline content is suspended, and is only partly downloaded yet.
   */
  Suspended = 'Suspended',
  /**
   * The offline content is not downloaded. However, some data may be still cached.
   */
  NotDownloaded = 'NotDownloaded',
}
