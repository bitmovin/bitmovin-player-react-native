import { NativeInstanceConfig } from '../nativeInstance';
import { SourceConfig } from '../source';

/**
 * Object used to configure a new `OfflineContentManager` instance.
 * @platform Android, iOS
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
