import { OfflineContentOptions } from './offlineContentOptions';
import { OfflineState } from './offlineState';

/**
 * Enum to hold the `eventType` on the `BitmovinNativeOfflineEventData`
 * @platform Android, iOS
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
 * @platform Android, iOS
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
 * @platform Android, iOS
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
 * @platform Android, iOS
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
 * @platform Android, iOS
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
 * @platform Android, iOS
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
 * @platform Android, iOS
 */
export interface OnDrmLicenseUpdatedEvent
  extends OfflineEvent<OfflineEventType.onDrmLicenseUpdated> {}

/**
 * Emitted when the DRM license has expired.
 * @platform iOS
 */
export interface OnDrmLicenseExpiredEvent
  extends OfflineEvent<OfflineEventType.onDrmLicenseExpired> {}

/**
 * Emitted when all active actions have been suspended.
 * @platform Android, iOS
 */
export interface OnSuspendedEvent
  extends OfflineEvent<OfflineEventType.onSuspended> {}

/**
 * Emitted when all actions have been resumed.
 * @platform Android, iOS
 */
export interface OnResumedEvent
  extends OfflineEvent<OfflineEventType.onResumed> {}

/**
 * Emitted when the download of the media content was canceled by the user and all partially downloaded content has been deleted from disk.
 * @platform Android, iOS
 */
export interface OnCanceledEvent
  extends OfflineEvent<OfflineEventType.onCanceled> {}

/**
 * The type aggregation for all possible native offline events received from the `DeviceEventEmitter`
 * @platform Android, iOS
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
 * @platform Android, iOS
 */
export interface OfflineContentManagerListener {
  onCompleted?: (e: OnCompletedEvent) => void;
  onError?: (e: OnErrorEvent) => void;
  onProgress?: (e: OnProgressEvent) => void;
  onOptionsAvailable?: (e: OnOptionsAvailableEvent) => void;
  onDrmLicenseUpdated?: (e: OnDrmLicenseUpdatedEvent) => void;
  onDrmLicenseExpired?: (e: OnDrmLicenseExpiredEvent) => void;
  onSuspended?: (e: OnSuspendedEvent) => void;
  onResumed?: (e: OnResumedEvent) => void;
  onCanceled?: (e: OnCanceledEvent) => void;
}

export const handleBitmovinNativeOfflineEvent = (
  data: BitmovinNativeOfflineEventData,
  listeners: Set<OfflineContentManagerListener>
) => {
  listeners.forEach((listener) => {
    if (!listener) return;

    if (data.eventType === OfflineEventType.onCompleted) {
      listener.onCompleted?.(data);
    } else if (data.eventType === OfflineEventType.onError) {
      listener.onError?.(data);
    } else if (data.eventType === OfflineEventType.onProgress) {
      listener.onProgress?.(data);
    } else if (data.eventType === OfflineEventType.onOptionsAvailable) {
      listener.onOptionsAvailable?.(data);
    } else if (data.eventType === OfflineEventType.onDrmLicenseUpdated) {
      listener.onDrmLicenseUpdated?.(data);
    } else if (data.eventType === OfflineEventType.onDrmLicenseExpired) {
      listener.onDrmLicenseExpired?.(data);
    } else if (data.eventType === OfflineEventType.onSuspended) {
      listener.onSuspended?.(data);
    } else if (data.eventType === OfflineEventType.onResumed) {
      listener.onResumed?.(data);
    } else if (data.eventType === OfflineEventType.onCanceled) {
      listener.onCanceled?.(data);
    }
  });
};
