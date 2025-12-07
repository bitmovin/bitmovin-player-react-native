import {
  Ad,
  AdBreak,
  AdConfig,
  AdItem,
  AdQuartile,
  AdSourceType,
} from './advertising';
import { SubtitleTrack } from './subtitleTrack';
import { VideoQuality } from './media';
import { AudioTrack } from './audioTrack';
import { LoadingState } from './source';
import { HttpRequestType } from './network/networkConfig';
import { DateRangeMetadataEntry, Id3MetadataEntry, isAndroidId3Frame, isId3MetadataEntry, MetadataCollection, MetadataEntry, MetadataType, ScteMetadataEntry } from './metadata';

/**
 * Base event type for all events.
 */
export interface Event {
  /**
   * This event name as it is on the native side.
   */
  name: string;
  /**
   * The UNIX timestamp in which this event happened.
   */
  timestamp: number;
}

/**
 * Base event type for error and warning events.
 */
export interface ErrorEvent extends Event {
  /**
   * Error/Warning's code number.
   */
  code?: number;
  /**
   * Error/Warning's localized message.
   */
  message: string;
  /**
   * Underlying data emitted with the error or warning.
   */
  data?: Record<string, any>;
}

/**
 * Emitted when a source is loaded into the player.
 * Seeking and time shifting are allowed as soon as this event is seen.
 */
export type PlayerActiveEvent = Event;

/**
 * Emitted when a source is unloaded from the player.
 * Seeking and time shifting are not allowed anymore after this event.
 */
export type PlayerInactiveEvent = Event;

/**
 * Emitted when a player error occurred.
 */
export type PlayerErrorEvent = ErrorEvent;

/**
 * Emitted when a player warning occurred.
 */
export type PlayerWarningEvent = ErrorEvent;

/**
 * Emitted when the player is destroyed.
 */
export type DestroyEvent = Event;

/**
 * Emitted when the player is muted.
 */
export type MutedEvent = Event;

/**
 * Emitted when the player is unmuted.
 */
export type UnmutedEvent = Event;

/**
 * Emitted when the player is ready for immediate playback, because initial audio/video
 * has been downloaded.
 */
export type ReadyEvent = Event;

/**
 * Emitted when the player is paused.
 */
export interface PausedEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  time: number;
}

/**
 * Emitted when the player received an intention to start/resume playback.
 */
export interface PlayEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  time: number;
}

/**
 * Emitted when playback has started.
 */
export interface PlayingEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  time: number;
}

/**
 * Emitted when the playback of the current media has finished.
 */
export type PlaybackFinishedEvent = Event;

/**
 * Source object representation the way it appears on event's payloads such as `SeekEvent`, for example.
 *
 * This interface only type hints what should be the shape of a {@link Source} object inside an event's
 * payload during runtime so it has no direct relation with the `Source` class present in `src/source.ts`.
 *
 * Do not mistake it for a `NativeInstance` type.
 */
export interface EventSource {
  /**
   * Event's source duration in seconds.
   */
  duration: number;
  /**
   * Whether this event's source is currently active in a player.
   */
  isActive: boolean;
  /**
   * Whether this event's source is currently attached to a player instance.
   */
  isAttachedToPlayer: boolean;
  /**
   * Metadata for this event's source.
   */
  metadata?: Record<string, any>;
  /**
   * The current {@link LoadingState} of the source.
   */
  loadingState: LoadingState;
}

/**
 * Represents a seeking position.
 */
export interface SeekPosition {
  /**
   * The relevant {@link Source}.
   */
  source: EventSource;
  /**
   * The position within the {@link Source} in seconds.
   */
  time: number;
}

/**
 * Emitted when the player is about to seek to a new position.
 * This event only applies to VoD streams.
 * When looking for an equivalent for live streams, the {@link TimeShiftEvent} is relevant.
 */
export interface SeekEvent extends Event {
  /**
   * Origin source metadata.
   */
  from: SeekPosition;
  /**
   * Target source metadata.
   */
  to: SeekPosition;
}

/**
 * Emitted when seeking has finished and data to continue playback is available.
 * This event only applies to VoD streams.
 * When looking for an equivalent for live streams, the {@link TimeShiftedEvent} is relevant.
 */
export type SeekedEvent = Event;

/**
 * Emitted when the player starts time shifting.
 * This event only applies to live streams.
 * When looking for an equivalent for VoD streams, the {@link SeekEvent} is relevant.
 */
export interface TimeShiftEvent extends Event {
  /**
   * The position from which we start the time shift
   */
  position: number;
  /**
   * The position to which we want to jump for the time shift
   */
  targetPosition: number;
}

/**
 * Emitted when time shifting has finished and data is available to continue playback.
 * This event only applies to live streams.
 * When looking for an equivalent for VoD streams, the {@link SeekedEvent} is relevant.
 */
export type TimeShiftedEvent = Event;

/**
 * Emitted when the player begins to stall and to buffer due to an empty buffer.
 */
export type StallStartedEvent = Event;

/**
 * Emitted when the player ends stalling, due to enough data in the buffer.
 */
export type StallEndedEvent = Event;

/**
 * Emitted when the current playback time has changed.
 */
export interface TimeChangedEvent extends Event {
  /**
   * The player's playback time from when this event happened.
   */
  currentTime: number;
}

/**
 * Emitted when a new source loading has started.
 */
export interface SourceLoadEvent extends Event {
  /**
   * Source that is about to load.
   */
  source: EventSource;
}

/**
 * Emitted when a new source is loaded.
 * This does not mean that the source is immediately ready for playback.
 * {@link ReadyEvent} indicates the player is ready for immediate playback.
 */
export interface SourceLoadedEvent extends Event {
  /**
   * Source that was loaded into player.
   */
  source: EventSource;
}

/**
 * Emitted when the current source has been unloaded.
 */
export interface SourceUnloadedEvent extends Event {
  /**
   * Source that was unloaded from player.
   */
  source: EventSource;
}

/**
 * Emitted when a source error occurred.
 */
export type SourceErrorEvent = ErrorEvent;

/**
 * Emitted when a source warning occurred.
 */
export type SourceWarningEvent = ErrorEvent;

/**
 * Emitted when a new audio track is added to the player.
 */
export interface AudioAddedEvent extends Event {
  /**
   * Audio track that has been added.
   */
  audioTrack: AudioTrack;
}

/**
 * Emitted when the player's selected audio track has changed.
 */
export interface AudioChangedEvent extends Event {
  /**
   * Audio track that was previously selected.
   */
  oldAudioTrack: AudioTrack;
  /**
   * Audio track that is selected now.
   */
  newAudioTrack: AudioTrack;
}

/**
 * Emitted when an audio track is removed from the player.
 */
export interface AudioRemovedEvent extends Event {
  /**
   * Audio track that has been removed.
   */
  audioTrack: AudioTrack;
}

/**
 * Emitted when a new subtitle track is added to the player.
 */
export interface SubtitleAddedEvent extends Event {
  /**
   * Subtitle track that has been added.
   */
  subtitleTrack: SubtitleTrack;
}

/**
 * Emitted when a subtitle track is removed from the player.
 */
export interface SubtitleRemovedEvent extends Event {
  /**
   * Subtitle track that has been removed.
   */
  subtitleTrack: SubtitleTrack;
}

/**
 * Emitted when the player's selected subtitle track has changed.
 */
export interface SubtitleChangedEvent extends Event {
  /**
   * Subtitle track that was previously selected.
   */
  oldSubtitleTrack: SubtitleTrack;
  /**
   * Subtitle track that is selected now.
   */
  newSubtitleTrack: SubtitleTrack;
}

/**
 * Emitted when the player enters Picture in Picture mode.
 *
 * @platform iOS, Android
 */
export type PictureInPictureEnterEvent = Event;

/**
 * Emitted when the player exits Picture in Picture mode.
 *
 * @platform iOS, Android
 */
export type PictureInPictureExitEvent = Event;

/**
 * Emitted when the player has finished entering Picture in Picture mode on iOS.
 *
 * @platform iOS
 */
export type PictureInPictureEnteredEvent = Event;

/**
 * Emitted when the player has finished exiting Picture in Picture mode on iOS.
 *
 * @platform iOS
 */
export type PictureInPictureExitedEvent = Event;

/**
 * Emitted when the fullscreen functionality has been enabled.
 *
 * @platform iOS, Android
 */
export type FullscreenEnabledEvent = Event;

/**
 * Emitted when the fullscreen functionality has been disabled.
 *
 * @platform iOS, Android
 */
export type FullscreenDisabledEvent = Event;

/**
 * Emitted when the player enters fullscreen mode.
 *
 * @platform iOS, Android
 */
export type FullscreenEnterEvent = Event;

/**
 * Emitted when the player exits fullscreen mode.
 *
 * @platform iOS, Android
 */
export type FullscreenExitEvent = Event;

/**
 * Emitted when the availability of the Picture in Picture mode changed on Android.
 *
 * @platform Android
 */
export interface PictureInPictureAvailabilityChangedEvent extends Event {
  /**
   * Whether Picture in Picture is available.
   */
  isPictureInPictureAvailable: boolean;
}

/**
 * Emitted when an ad break has started.
 */
export interface AdBreakStartedEvent extends Event {
  /**
   * The {@link AdBreak} that has started.
   */
  adBreak?: AdBreak;
}

/**
 * Emitted when an ad break has finished.
 */
export interface AdBreakFinishedEvent extends Event {
  /**
   * The {@link AdBreak} that has finished.
   */
  adBreak?: AdBreak;
}

/**
 * Emitted when the playback of an ad has started.
 */
export interface AdStartedEvent extends Event {
  /**
   * The {@link Ad} this event is related to.
   */
  ad?: Ad;
  /**
   * The target URL to open once the user clicks on the ad.
   */
  clickThroughUrl?: string;
  /**
   * The {@link AdSourceType} of the started ad.
   */
  clientType?: AdSourceType;
  /**
   * The duration of the ad in seconds.
   */
  duration: number;
  /**
   * The index of the ad in the queue.
   */
  indexInQueue: number;
  /**
   * The position of the corresponding ad.
   */
  position?: string;
  /**
   * The skip offset of the ad in seconds.
   */
  skipOffset: number;
  /**
   * The main content time at which the ad is played.
   */
  timeOffset: number;
}

/**
 * Emitted when an ad has finished playback.
 */
export interface AdFinishedEvent extends Event {
  /**
   * The {@link Ad} that finished playback.
   */
  ad?: Ad;
}

/**
 * Emitted when an error with the ad playback occurs.
 */
export interface AdErrorEvent extends ErrorEvent {
  /**
   * The {@link AdConfig} for which the ad error occurred.
   */
  adConfig?: AdConfig;
  /**
   * The {@link AdItem} for which the ad error occurred.
   */
  adItem?: AdItem;
}

/**
 * Emitted when an ad was clicked.
 */
export interface AdClickedEvent extends Event {
  /**
   * The click through url of the ad.
   */
  clickThroughUrl?: string;
}

/**
 * Emitted when an ad was skipped.
 */
export interface AdSkippedEvent extends Event {
  /**
   * The ad that was skipped.
   */
  ad?: Ad;
}

/**
 * Emitted when the playback of an ad has progressed over a quartile boundary.
 */
export interface AdQuartileEvent extends Event {
  /**
   * The {@link AdQuartile} boundary that playback has progressed over.
   */
  quartile: AdQuartile;
}

/**
 * Emitted when an ad manifest was successfully downloaded, parsed and added into the ad break schedule.
 */
export interface AdScheduledEvent extends Event {
  /**
   * The total number of scheduled ads.
   */
  numberOfAds: number;
}

/**
 * Emitted when the download of an ad manifest is started.
 */
export interface AdManifestLoadEvent extends Event {
  /**
   * The {@link AdBreak} this event is related to.
   */
  adBreak?: AdBreak;
  /**
   * The {@link AdConfig} of the loaded ad manifest.
   */
  adConfig?: AdConfig;
}

/**
 * Emitted when an ad manifest was successfully loaded.
 */
export interface AdManifestLoadedEvent extends Event {
  /**
   * The {@link AdBreak} this event is related to.
   */
  adBreak?: AdBreak;
  /**
   * The {@link AdConfig} of the loaded ad manifest.
   */
  adConfig?: AdConfig;
  /**
   * How long it took for the ad tag to be downloaded in milliseconds.
   */
  downloadTime: number;
}

/**
 * Emitted when current video download quality has changed.
 */
export interface VideoDownloadQualityChangedEvent extends Event {
  /**
   * The new quality
   */
  newVideoQuality: VideoQuality;
  /**
   * The previous quality
   */
  oldVideoQuality: VideoQuality;
}

/**
 * Emitted when the current video playback quality has changed.
 */
export interface VideoPlaybackQualityChangedEvent extends Event {
  /**
   * The new quality
   */
  newVideoQuality: VideoQuality;
  /**
   * The previous quality
   */
  oldVideoQuality: VideoQuality;
}

/**
 * Emitted when casting to a cast-compatible device is available.
 */
export type CastAvailableEvent = Event;

/**
 * Emitted when the playback on a cast-compatible device was paused.
 *
 * On Android {@link PausedEvent} is also emitted while casting.
 */
export type CastPausedEvent = Event;

/**
 * Emitted when the playback on a cast-compatible device has finished.
 *
 * On Android {@link PlaybackFinishedEvent} is also emitted while casting.
 */
export type CastPlaybackFinishedEvent = Event;

/**
 * Emitted when playback on a cast-compatible device has started.
 *
 * On Android {@link PlayingEvent} is also emitted while casting.
 */
export type CastPlayingEvent = Event;

/**
 * Emitted when the cast app is launched successfully.
 */
export interface CastStartedEvent extends Event {
  /**
   * The name of the cast device on which the app was launched.
   */
  deviceName: string | null;
}

/**
 * Emitted when casting is initiated, but the user still needs to choose which device should be used.
 */
export type CastStartEvent = Event;

/**
 * Emitted when casting to a cast-compatible device is stopped.
 */
export type CastStoppedEvent = Event;

/**
 * Emitted when the time update from the currently used cast-compatible device is received.
 */
export type CastTimeUpdatedEvent = Event;

/**
 * Contains information for the {@link CastWaitingForDeviceEvent}.
 */
export interface CastPayload {
  /**
   * The current time in seconds.
   */
  currentTime: number;
  /**
   * The name of the chosen cast device.
   */
  deviceName: string | null;
  /**
   * The type of the payload (always `"cast"`).
   */
  type: string;
}

/**
 * Emitted when a cast-compatible device has been chosen and the player is waiting for the device to get ready for
 * playback.
 */
export interface CastWaitingForDeviceEvent extends Event {
  /**
   * The {@link CastPayload} object for the event
   */
  castPayload: CastPayload;
}

/**
 * Emitted when a download was finished.
 */
export interface DownloadFinishedEvent extends Event {
  /**
   * The time needed to finish the request, in seconds.
   */
  downloadTime: number;
  /**
   * Which type of request this was.
   */
  requestType: HttpRequestType;
  /**
   * The HTTP status code of the request.
   * If opening the connection failed, a value of `0` is returned.
   */
  httpStatus: number;
  /**
   * If the download was successful.
   */
  isSuccess: boolean;
  /**
   * The last redirect location, or `null` if no redirect happened.
   */
  lastRedirectLocation?: string;
  /**
   * The size of the downloaded data, in bytes.
   */
  size: number;
  /**
   * The URL of the request.
   */
  url: string;
}

/**
 * Emitted when the player transitions from one playback speed to another.
 * @platform iOS, tvOS
 */
export interface PlaybackSpeedChangedEvent extends Event {
  /**
   * The playback speed before the change happened.
   */
  from: number;
  /**
   * The playback speed after the change happened.
   */
  to: number;
}

/**
 * Emitted when a subtitle entry transitions into the active status.
 */
export interface CueEnterEvent extends Event {
  /**
   * The playback time in seconds when the subtitle should be rendered.
   */
  start: number;
  /**
   * The playback time in seconds when the subtitle should be hidden.
   */
  end: number;
  /**
   * The textual content of this subtitle.
   */
  text?: string;
  /**
   * Data URI for image data of this subtitle.
   */
  image?: string;
}

/**
 * Emitted when an active subtitle entry transitions into the inactive status.
 */
export interface CueExitEvent extends Event {
  /**
   * The playback time in seconds when the subtitle should be rendered.
   */
  start: number;
  /**
   * The playback time in seconds when the subtitle should be hidden.
   */
  end: number;
  /**
   * The textual content of this subtitle.
   */
  text?: string;
  /**
   * Data URI for image data of this subtitle.
   */
  image?: string;
}

interface MetadataEventBase<T extends MetadataEntry> extends Event {
  /**
   * Discriminator for the metadata type carried by this event.
   * 
   * All entries in {@link metadata.entries} share this value.
   * 
   * @remarks Use it in an `if`/`else` or `switch` to narrow the event type.
   */
  metadataType: T['metadataType'];// TODO: serialize from iOS/Android
  /**
   * Metadata entries and their trigger time.
   *
   * The collection is homogeneous: all entries share the same metadata type,
   * reflected by {@link metadataType}.
   */
  metadata: MetadataCollection<T>;
}

/**
 * Emitted when metadata is parsed from the stream.
 */
export type MetadataParsedEvent =
  | (MetadataEventBase<Id3MetadataEntry> & {
      metadataType: MetadataType.ID3;
    })
  | (MetadataEventBase<DateRangeMetadataEntry> & {
      metadataType: MetadataType.DATERANGE;
    })
  | (MetadataEventBase<ScteMetadataEntry> & {
      metadataType: MetadataType.SCTE;
    });

/**
 * Emitted when metadata is encountered during playback.
 */
export type MetadataEvent =
  | (MetadataEventBase<Id3MetadataEntry> & {
      metadataType: MetadataType.ID3;
    })
  | (MetadataEventBase<DateRangeMetadataEntry> & {
      metadataType: MetadataType.DATERANGE;
    })
  | (MetadataEventBase<ScteMetadataEntry> & {
      metadataType: MetadataType.SCTE;
    });
