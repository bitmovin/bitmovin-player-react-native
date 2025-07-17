/**
 * The `MediaTrackRole` interface represents the role of a media track in a media stream.
 */
export interface MediaTrackRole {
  /**
   * The unique identifier for this role instance.
   * - On Android: Corresponds to the native [`MediaTrackRole.id`](https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media/-media-track-role/id.html).
   *  May be undefined.
   * - On iOS and tvOS: `undefined`, as HLS characteristics do not have inherent IDs in this context.
   */
  id?: string;

  /**
   * The URI identifying the scheme used for the role definition.
   * - On Android: Corresponds to the native [`MediaTrackRole.schemeIdUri`](https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media/-media-track-role/scheme-id-uri.html)
   *  (e.g., "urn:mpeg:dash:role:2011").
   * - On iOS and tvOS: predefined URN `urn:hls:characteristic` representing HLS characteristics.
   */
  schemeIdUri: string;

  /**
   * The value of the role within the specified scheme.
   * - On Android: Corresponds to the native [`MediaTrackRole.value`](https://cdn.bitmovin.com/player/android/3/docs/player-core/com.bitmovin.player.api.media/-media-track-role/value.html)
   *  (e.g., "main", "caption", "description").
   * - On iOS and tvOS: The raw HLS characteristic string (e.g., "public.accessibility.describes-music-and-sound",
   *  "public.accessibility.transcribes-spoken-dialog").
   */
  value?: string;
}
