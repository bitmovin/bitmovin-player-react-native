import { NativeInstanceConfig } from '../nativeInstance';
import { SourceConfig } from '../source';
import { OfflineContentManagerListener } from './offlineContentManagerListener';

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
  /**
   * The `OfflineContentManagerListener` where callbacks for event data will be passed to.
   */
  listener?: OfflineContentManagerListener;
}

/**
 * Object used configure how the native offline managers create and get offline source configurations
 * iOS Only
 */
export interface OfflineSourceOptions {
  /**
   * Whether or not the player should restrict playback only to audio, video and subtitle tracks which are stored offline on the device. This has to be set to true if the device has no network access.
   */
  restrictedToAssetCache?: boolean;
}

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

/**
 * Contains information about a DRM license.
 */
export interface DrmLicenseInformation {
  /**
   * The remaining license duration.
   */
  licenseDuration: number;
  /**
   * The remaining playback duration.
   */
  playbackDuration: number;
}
