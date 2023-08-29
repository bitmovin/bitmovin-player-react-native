import { NativeInstanceConfig } from '../nativeInstance';
import { SourceConfig } from '../source';

/**
 * Object used to configure a new `OfflineContentManager` instance.
 */
export interface OfflineContentConfig extends NativeInstanceConfig {
  /**
   * An identifier for this source that is unique within the location and must never change.
   * The root folder will contain a folder based on this id.
   */
  identifier: string;
  /**
   * The `SourceConfig` used to download the offline resources.
   */
  sourceConfig: SourceConfig;
}

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

/**
 * Contains the state an OfflineContentManager can have.
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
  /**
   * Represents the audio options available for download
   */
  audioOptions: OfflineOptionEntry[];
  /**
   * Represents the text options available for download
   */
  textOptions: OfflineOptionEntry[];
}

/**
 * Represents the configuration to start a download.
 * @platform Android, iOS
 */
export interface OfflineDownloadRequest {
  minimumBitrate?: number;
  audioOptionIds?: string[];
  textOptionIds?: string[];
}
