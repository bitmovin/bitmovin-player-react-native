import {
  OfflineContentOptions,
  OfflineOptionEntryState,
} from './offlineContentOptions';

/**
 * Enum to hold the `eventType` on the `BitmovinNativeOfflineEventData`
 */
export enum OfflineEventType {
  onCompleted = 'onCompleted',
  onError = 'onError',
  onProgress = 'onProgress',
  onOptionsAvailable = 'onOptionsAvailable',
  onDrmLicenseUpdated = 'onDrmLicenseUpdated',
  onSuspended = 'onSuspended',
  onResumed = 'onResumed',
}

export interface OfflineEvent<T extends OfflineEventType> {
  /**
   * The native id associated with the `OfflineContentManager` emitting this event
   */
  nativeId: string;
  /**
   * The `OfflineEventType` that correlates to which native `OfflineContentManagerListener` method was called.
   */
  eventType: T;
}

/**
 * BitmovinOfflineEvent for when the download process has completed.
 */
export interface OnCompletedEvent
  extends OfflineEvent<OfflineEventType.onCompleted> {
  /**
   * The options that are available to download
   */
  options?: OfflineContentOptions;
  /**
   * The current offline download state
   */
  state: OfflineOptionEntryState;
}

/**
 * BitmovinOfflineEvent for when an error has occurred.
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
 * BitmovinOfflineEvent for when there is a progress change for the process call.
 */
export interface OnProgressEvent
  extends OfflineEvent<OfflineEventType.onProgress> {
  /**
   * The progress for the current process
   */
  progress: number;
}

/**
 * BitmovinOfflineEvent for when the `OfflineContentOptions` is available after a `OfflineContentManager.getOptions` call.
 */
export interface OnOptionsAvailableEvent
  extends OfflineEvent<OfflineEventType.onOptionsAvailable> {
  /**
   * The options that are available to download
   */
  options?: OfflineContentOptions;
  /**
   * The current offline download state
   */
  state: OfflineOptionEntryState;
}

/**
 * BitmovinOfflineEvent for when the DRM license was updated.
 */
export interface OnDrmLicenseUpdatedEvent
  extends OfflineEvent<OfflineEventType.onDrmLicenseUpdated> {}

/**
 * BitmovinOfflineEvent for when all active actions have been suspended.
 */
export interface OnSuspendedEvent
  extends OfflineEvent<OfflineEventType.onSuspended> {}

/**
 * BitmovinOfflineEvent for when all actions have been resumed.
 */
export interface OnResumedEvent
  extends OfflineEvent<OfflineEventType.onResumed> {}

/**
 * The type aggregation for all possible native offline events received from the `DeviceEventEmitter`
 */
export type BitmovinNativeOfflineEventData =
  | OnCompletedEvent
  | OnOptionsAvailableEvent
  | OnProgressEvent
  | OnErrorEvent
  | OnDrmLicenseUpdatedEvent
  | OnSuspendedEvent
  | OnResumedEvent;

/**
 * The listener that can be passed to the `OfflineContentManager` to receive callbacks for different events.
 */
export interface OfflineContentManagerListener {
  onCompleted?: (e: OnCompletedEvent) => void;
  onError?: (e: OnErrorEvent) => void;
  onProgress?: (e: OnProgressEvent) => void;
  onOptionsAvailable?: (e: OnOptionsAvailableEvent) => void;
  onDrmLicenseUpdated?: (e: OnDrmLicenseUpdatedEvent) => void;
  onSuspended?: (e: OnSuspendedEvent) => void;
  onResumed?: (e: OnResumedEvent) => void;
}
