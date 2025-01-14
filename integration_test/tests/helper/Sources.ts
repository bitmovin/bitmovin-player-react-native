import { SourceConfig, SourceType } from 'bitmovin-player-react-native';

export const Sources = {
  artOfMotionHls: {
    url: 'https://cdn.bitmovin.com/content/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  artOfMotionDash: {
    url: 'https://cdn.bitmovin.com/content/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    type: SourceType.DASH,
  } as SourceConfig,

  akamaiTestLiveHls: {
    url: 'https://cph-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  sintel: {
    url: 'https://cdn.bitmovin.com/content/assets/sintel/hls/playlist.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,
};
