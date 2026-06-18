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
import { HttpRequestType, HttpResponse } from './network/networkConfig';
import {
  DateRangeMetadataEntry,
  EventMessageMetadataEntry,
  Id3MetadataEntry,
  MetadataCollection,
  MetadataEntry,
  MetadataType,
  ScteMetadataEntry,
  UnsupportedMetadataEntry,
} from './metadata';

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
 * Additional diagnostic information related to an error or warning.
 */
export interface DeficiencyData {
  /**
   * The HTTP response associated with the error, when the root cause is a network request
   * (e.g. a DRM license or certificate request resulting in a non-2xx status code).
   */
  httpResponse?: HttpResponse;
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
   * Additional diagnostic information related to the error or warning.
   * Contains details such as an {@link DeficiencyData.httpResponse | HTTP response} when
   * the error is caused by a failed network request.
   */
  data?: DeficiencyData & Record<string, any>;
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
  oldSubtitleTrack?: SubtitleTrack;
  /**
   * Subtitle track that is selected now.
   */
  newSubtitleTrack?: SubtitleTrack;
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
 * @platform iOS, Android
 */
export type PictureInPictureEnteredEvent = Event;

/**
 * Emitted when the player has finished exiting Picture in Picture mode on iOS.
 *
 * @platform iOS, Android
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

export type SubtitleCueLayoutLine =
  | { value: 'auto' }
  | { value: number; unit: 'line' | 'percent' };

/**
 * Cross-platform cue layout metadata normalized from native cue data.
 *
 * Values may include native/defaulted cue values, not only explicitly authored subtitle settings.
 * Omitted fields mean the value was not exposed or not applicable for this cue.
 *
 * @platform Android, iOS, tvOS
 */
export interface SubtitleCueLayout {
  /**
   * Cue position on the axis perpendicular to the text flow.
   *
   * For horizontal captions this controls vertical placement:
   * - `{ value: 85, unit: 'percent' }` places the cue about 85% down the video viewport.
   * - `{ value: 12, unit: 'line' }` places the cue by counting rendered text-line slots, not viewport percentage.
   * - `{ value: 'auto' }` lets the renderer/platform choose automatic line placement.
   *
   * For vertical captions this controls horizontal placement.
   * This is not the same as `cea608Position.rowIndex`, which refers to the CEA-608 caption grid.
   */
  line?: SubtitleCueLayoutLine;
  /**
   * Alignment of the cue box at the `line` position.
   *
   * This does not control text alignment inside the cue box; use `textAlign` for that.
   */
  lineAlign?: 'start' | 'center' | 'end';
  /**
   * Cue box position as a percentage of the viewport on the axis orthogonal to `line`.
   *
   * For horizontal captions this controls horizontal placement:
   * - `50` places the cue around the horizontal center of the viewport.
   * - `10` places the cue near the left side of the viewport.
   * - `'auto'` lets the renderer/platform choose automatic position placement.
   *
   * For vertical captions this controls vertical placement.
   * Use `positionAlign` to describe which part of the cue box is anchored at this position.
   */
  position?: number | 'auto';
  /**
   * Alignment of the cue box at the `position` value.
   *
   * For horizontal captions, this controls which horizontal part of the cue box is anchored at `position`.
   */
  positionAlign?: 'line-left' | 'center' | 'line-right' | 'auto';
  /**
   * Size of the cue box as a percentage of the viewport dimension in the cue writing direction.
   *
   * For horizontal captions this is relative to viewport width.
   * For vertical captions this is relative to viewport height.
   */
  size?: number;
  /**
   * Alignment of the cue text inside the cue box.
   */
  textAlign?: 'start' | 'center' | 'end' | 'left' | 'right';
  /**
   * Writing direction of the cue text.
   *
   * This affects how `line`, `position`, and `size` are interpreted.
   */
  writingMode: 'horizontal' | 'vertical-lr' | 'vertical-rl';
}

/**
 * Region metadata for this cue, when exposed by the native SDK.
 *
 * Regions are used by formats such as TTML and WebVTT to group or position cues.
 * This object is omitted when no region metadata is available.
 *
 * @platform iOS, tvOS
 */
export interface SubtitleCueRegion {
  /**
   * Region identifier for this cue, when available.
   */
  id?: string;
  /**
   * Opaque region style string from the native SDK, when available.
   *
   * The format is not guaranteed to be stable or portable across caption formats.
   * Prefer forwarding it to a compatible renderer or using it for diagnostics rather than parsing it as structured data.
   */
  style?: string;
}

/**
 * CEA-608 grid position for closed captions.
 *
 * This preserves the native 15x32 CEA-608 caption grid and is separate from `layout`,
 * which exposes normalized cue-box geometry.
 *
 * @platform iOS, tvOS
 */
export interface Cea608CuePosition {
  /**
   * Zero-based row index in the CEA-608 grid.
   *
   * Valid values are `0` through `rows - 1`.
   */
  rowIndex: number;
  /**
   * Zero-based column index in the CEA-608 grid.
   *
   * Valid values are `0` through `columns - 1`.
   */
  columnIndex: number;
  /**
   * Total row count in the CEA-608 grid.
   */
  rows: 15;
  /**
   * Total column count in the CEA-608 grid.
   */
  columns: 32;
}

/**
 * Subtitle cue payload shared by cue enter and cue exit events.
 */
export interface SubtitleCue {
  /**
   * Start time of the cue in seconds.
   */
  start: number;
  /**
   * End time of the cue in seconds.
   */
  end: number;
  /**
   * Plain textual content of this subtitle, when available.
   */
  text?: string;
  /**
   * Data URI for image subtitle data, when available.
   */
  image?: string;
  /**
   * Cue text represented as HTML, when available.
   *
   * This may include styling generated by the native SDK. Treat it as renderer input, not plain text.
   */
  html?: string;
  /**
   * Cross-platform cue layout metadata, when exposed by the native SDK.
   *
   * @platform Android, iOS, tvOS
   */
  layout?: SubtitleCueLayout;
  /**
   * Region metadata for this cue, when exposed by the native SDK.
   *
   * @platform iOS, tvOS
   */
  region?: SubtitleCueRegion;
  /**
   * CEA-608 grid position for closed captions.
   *
   * @platform iOS, tvOS
   */
  cea608Position?: Cea608CuePosition;
}

/**
 * Emitted when a subtitle entry transitions into the active status.
 */
export interface CueEnterEvent extends Event, SubtitleCue {}

/**
 * Emitted when an active subtitle entry transitions into the inactive status.
 */
export interface CueExitEvent extends Event, SubtitleCue {}

/**
 * Base event type for events that carry timed metadata.
 *
 * Concrete events like {@link MetadataParsedEvent} and {@link MetadataEvent}
 * fix {@link metadataType} and {@link metadata} to a specific metadata entry
 * type.
 *
 * @remarks Branching on {@link metadataType} using an `if`/`switch` statement narrows the
 *          event to the appropriate metadata subtype, giving access to entry-specific fields.
 *
 * @typeParam T - The metadata entry type carried by this event
 */
export interface MetadataEventBase<T extends MetadataEntry> extends Event {
  /**
   * Discriminator for the metadata type carried by this event.
   *
   * All entries in {@link MetadataCollection.entries} share this value.
   *
   * @remarks Use it in an `if`/`else` or `switch` to narrow the event type.
   */
  metadataType: T['metadataType'];
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
  | (MetadataEventBase<EventMessageMetadataEntry> & {
      metadataType: MetadataType.EMSG;
    })
  | (MetadataEventBase<ScteMetadataEntry> & {
      metadataType: MetadataType.SCTE;
    })
  | (MetadataEventBase<UnsupportedMetadataEntry> & {
      metadataType: MetadataType.Unsupported;
    });

/**
 * Emitted when metadata is encountered during playback.
 */
export type MetadataEvent = MetadataParsedEvent;

/**
 * Represents the FairPlay content key request associated with a license acquisition.
 *
 * @platform iOS, tvOS
 */
export interface FairplayContentKeyRequest {
  /**
   * The URI of the content key (the `skd://` URI from the HLS manifest).
   */
  skdUri: string;
}

/**
 * Emitted when a FairPlay license has been acquired successfully.
 *
 * @platform iOS, tvOS
 */
export interface FairplayLicenseAcquiredEvent extends Event {
  /**
   * The content key request associated with the acquired license.
   */
  contentKeyRequest: FairplayContentKeyRequest;
}
