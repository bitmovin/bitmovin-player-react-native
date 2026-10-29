# Positioned WebVTT fixture

Metro serves this HLS source at `/cavy-fixtures/positioned-webvtt/master.m3u8`.
The `Debug` subtitle rendition exercises in-manifest WebVTT discovery and cue
layout. Its cue authors line 10%, position 10%, line-left alignment and start
text alignment. Size and writing mode remain at their defaults.

`video-0.mpegts` contains the unchanged first four-second segment of the existing
[Art of Motion test source](https://cdn.bitmovin.com/content/internal/assets/MI201109210084/video/180_250000/hls/segment_0.ts),
downloaded on 2026-10-20. It is 153,972 bytes, with SHA-256
`221aead3659bf0eaed75345a2407bd0aca8f8a1ab337ab98d936b58d7a7ce0cb`.
The `.mpegts` extension keeps TypeScript tooling from treating the media as code.

The first video presentation timestamp is 7200 at a 90 kHz time base. The
WebVTT timestamp map aligns cue time zero with that timestamp. The cue starts at
three seconds, after the test's seek to one second, and ends before playback
finishes. No audio is needed for these layout assertions.
