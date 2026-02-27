import { SourceConfig, SourceType } from 'bitmovin-player-react-native';

export const Sources = {
  artOfMotionHls: {
    url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  artOfMotionDash: {
    url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    type: SourceType.DASH,
  } as SourceConfig,

  iReplayTestLiveHls: {
    url: 'https://ireplay.tv/test/blender.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  id3MetadataHls: {
    url: 'https://cdn.bitmovin.com/content/internal/assets/metadata/media.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  sintel: {
    url: 'https://cdn.bitmovin.com/content/internal/assets/sintel/hls/playlist.m3u8',
    type: SourceType.HLS,
  } as SourceConfig,

  widevineDrmWithBrokenLicense: {
    url: 'https://cdn.bitmovin.com/content/internal/assets/art-of-motion_drm/mpds/11331.mpd',
    type: SourceType.DASH,
    drmConfig: {
      widevine: {
        licenseUrl: 'https://httpstat.us/403',
      },
    },
  } as SourceConfig,

  fairplayDrmWithBrokenLicense: {
    url: 'https://fps.ezdrm.com/demo/video/ezdrm.m3u8',
    type: SourceType.HLS,
    drmConfig: {
      fairplay: {
        licenseUrl: 'https://httpstat.us/403',
        certificateUrl: 'https://fps.ezdrm.com/demo/video/eleisure.cer',
      },
    },
  } as SourceConfig,
};
