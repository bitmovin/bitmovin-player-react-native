import { SourceConfig, SourceType } from 'bitmovin-player-react-native';

export const Sources = {
  artOfMotionHls: {
    url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  artOfMotionDash: {
    url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    type: SourceType.DASH,
  } as SourceConfig,
};
