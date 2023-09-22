import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  SourceConfig,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

const source: SourceConfig = {
  url:
    Platform.OS === 'ios'
      ? 'https://fps.ezdrm.com/demo/video/ezdrm.m3u8'
      : 'https://bitmovin-a.akamaihd.net/content/art-of-motion_drm/mpds/11331.mpd',
  type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
  drmConfig: {
    // Android only.
    widevine: {
      licenseUrl: 'https://cwip-shaka-proxy.appspot.com/no_auth',
      prepareLicense: (license) => {
        console.log(
          '\n[PREPARE LICENSE]\nlicense:',
          license.slice(0, 256) + '...\n'
        );
        // Do something with license...
        return license;
      },
      prepareMessage: (message) => {
        console.log(
          '\n[PREPARE MESSAGE]\nmessage:',
          message.slice(0, 256) + '...\n'
        );
        // Do something with message...
        return message;
      },
      // Checkout widevine docs to know more about security levels.
      // You should be fine with just the default level.
      preferredSecurityLevel: 'L3', // L3 = software level Drm protection.
      shouldKeepDrmSessionsAlive: true,
      httpHeaders: {
        'test-header': 'test header value',
        'different-header': 'different value',
      },
    },
    // iOS only.
    fairplay: {
      licenseUrl:
        'https://fps.ezdrm.com/api/licenses/09cc0377-6dd4-40cb-b09d-b582236e70fe',
      // FairPlay certificate. Required for iOS.
      certificateUrl: 'https://fps.ezdrm.com/demo/video/eleisure.cer',
      prepareLicense: (license) => {
        console.log(
          '\n[PREPARE LICENSE]\nlicense:',
          license.slice(0, 256) + '...\n'
        );
        // Do something with license...
        return license;
      },
      prepareCertificate: (certificate) => {
        console.log(
          '\n[PREPARE CERTIFICATE]\ncertificate:',
          certificate.slice(0, 256) + '...\n'
        );
        // Do something with certificate...
        return certificate;
      },
      prepareMessage: (message, assetId) => {
        console.log(
          '\n[PREPARE MESSAGE]\nassetId:',
          assetId,
          '\nmessage:',
          message.slice(0, 256) + '...\n'
        );
        // Do something with message...
        return message;
      },
      prepareSyncMessage: (syncMessage, assetId) => {
        console.log(
          '[PREPARE SYNC MESSAGE]\nassetId:',
          assetId,
          '\nsyncMessage:',
          syncMessage.slice(0, 256) + '...\n'
        );
        // Do something with syncMessage and assetId...
        return syncMessage;
      },
      prepareContentId: (contentId) => {
        console.log('\n[PREPARE CONTENT ID]\ncontentId:', contentId + '\n');
        // Do something with syncMessage and assetId...
        return contentId;
      },
      prepareLicenseServerUrl: (licenseServerUrl) => {
        console.log(
          '[PREPARE LICENSE SERVER URL]\nlicenseServerUrl:',
          licenseServerUrl + '\n'
        );
        // Do something with licenseServerUrl...
        return licenseServerUrl;
      },
    },
  },
};

export default function BasicDrmPlayback() {
  useTVGestures();

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load(source);
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
});
