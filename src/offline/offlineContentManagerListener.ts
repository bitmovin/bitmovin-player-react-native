import { OfflineContentOptions } from './offlineContentOptions';
import { OfflineState } from './offlineState';

/**
 * Enum to hold the `eventType` on the `BitmovinNativeOfflineEventData`
 * @remarks Platform: Android, iOS
 */
export enum OfflineEventType {
  onCompleted = 'onCompleted',
  onError = 'onError',
  onProgress = 'onProgress',
  onOptionsAvailable = 'onOptionsAvailable',
  onDrmLicenseUpdated = 'onDrmLicenseUpdated',
  onDrmLicenseExpired = 'onDrmLicenseExpired',
  onSuspended = 'onSuspended',
  onResumed = 'onResumed',
  onCanceled = 'onCanceled',
}

/**
 * The base interface for all offline events.
 * @remarks Platform: Android, iOS
 */
export interface OfflineEvent<T extends OfflineEventType> {
  /**
   * The native id associated with the `OfflineContentManager` emitting this event
   */
  nativeId: string;
  /**
   * The supplied id representing the source associated with the `OfflineContentManager` emitting this event.
   */
  identifier: string;
  /**
   * The `OfflineEventType` that correlates to which native `OfflineContentManagerListener` method was called.
   */
  eventType: T;
  /**
   * The current offline download state
   */
  state: OfflineState;
}

/**
 * Emitted when the download process has completed.
 * @remarks Platform: Android, iOS
 */
export interface OnCompletedEvent
  extends OfflineEvent<OfflineEventType.onCompleted> {
  /**
   * The options that are available to download
   */
  options?: OfflineContentOptions;
}

/**
 * Emitted when an error has occurred.
 * @remarks Platform: Android, iOS
 */
export interface OnErrorEvent extends OfflineEvent<OfflineEventType.onError> {
  /**
   * The error code of the process error
   */
  code?: number;
  /**
   * The error message of the process error
   */
  message?: string;
}

/**
 * Emitted when there is a progress change for the process call.
 * @remarks Platform: Android, iOS
 */
export interface OnProgressEvent
  extends OfflineEvent<OfflineEventType.onProgress> {
  /**
   * The progress for the current process
   */
  progress: number;
}

/**
 * Emitted when the `OfflineContentOptions` is available after a `OfflineContentManager.getOptions` call.
 * @remarks Platform: Android, iOS
 */
export interface OnOptionsAvailableEvent
  extends OfflineEvent<OfflineEventType.onOptionsAvailable> {
  /**
   * The options that are available to download
   */
  options?: OfflineContentOptions;
}

/**
 * Emitted when the DRM license was updated.
 * @remarks Platform: Android, iOS
 */
export type OnDrmLicenseUpdatedEvent =
  OfflineEvent<OfflineEventType.onDrmLicenseUpdated>;

/**
 * Emitted when the DRM license has expired.
 * @remarks Platform: iOS
 */
export type OnDrmLicenseExpiredEvent =
  OfflineEvent<OfflineEventType.onDrmLicenseExpired>;

/**
 * Emitted when all active actions have been suspended.
 * @remarks Platform: Android, iOS
 */
export type OnSuspendedEvent = OfflineEvent<OfflineEventType.onSuspended>;

/**
 * Emitted when all actions have been resumed.
 * @remarks Platform: Android, iOS
 */
export type OnResumedEvent = OfflineEvent<OfflineEventType.onResumed>;

/**
 * Emitted when the download of the media content was canceled by the user and all partially downloaded content has been deleted from disk.
 * @remarks Platform: Android, iOS
 */
export type OnCanceledEvent = OfflineEvent<OfflineEventType.onCanceled>;

/**
 * The type aggregation for all possible native offline events received from the `DeviceEventEmitter`
 * @remarks Platform: Android, iOS
 */
export type BitmovinNativeOfflineEventData =
  | OnCompletedEvent
  | OnOptionsAvailableEvent
  | OnProgressEvent
  | OnErrorEvent
  | OnDrmLicenseUpdatedEvent
  | OnDrmLicenseExpiredEvent
  | OnSuspendedEvent
  | OnResumedEvent
  | OnCanceledEvent;

/**
 * The listener that can be passed to the `OfflineContentManager` to receive callbacks for different events.
 * @remarks Platform: Android, iOS
 */
export interface OfflineContentManagerListener {
  /**
   * Emitted when the download process has completed.
   *
   * @param e The `OnCompletedEvent` that was emitted
   */
  onCompleted?: (e: OnCompletedEvent) => void;
  /**
   * Emitted when an error has occurred.
   *
   * @param e The `OnErrorEvent` that was emitted
   */
  onError?: (e: OnErrorEvent) => void;
  /**
   * Emitted when there is a progress change for the process call.
   *
   * @param e The `OnProgressEvent` that was emitted
   */
  onProgress?: (e: OnProgressEvent) => void;
  /**
   * Emitted when the `OfflineContentOptions` is available after a `OfflineContentManager.getOptions` call.
   *
   * @param e The `OnOptionsAvailableEvent` that was emitted
   */
  onOptionsAvailable?: (e: OnOptionsAvailableEvent) => void;
  /**
   * Emitted when the DRM license was updated.
   *
   * @param e The `OnDrmLicenseUpdatedEvent` that was emitted
   */
  onDrmLicenseUpdated?: (e: OnDrmLicenseUpdatedEvent) => void;
  /**
   * Emitted when the DRM license has expired.
   *
   * @param e The `OnDrmLicenseExpiredEvent` that was emitted
   */
  onDrmLicenseExpired?: (e: OnDrmLicenseExpiredEvent) => void;
  /**
   * Emitted when all active actions have been suspended.
   *
   * @param e The `OnSuspendedEvent` that was emitted
   */
  onSuspended?: (e: OnSuspendedEvent) => void;
  /**
   * Emitted when all actions have been resumed.
   *
   * @param e The `OnResumedEvent` that was emitted
   */
  onResumed?: (e: OnResumedEvent) => void;
  /**
   * Emitted when the download of the media content was canceled by the user and all partially downloaded content has been deleted from disk.
   *
   * @param e The `OnCanceledEvent` that was emitted
   */
  onCanceled?: (e: OnCanceledEvent) => void;
}
