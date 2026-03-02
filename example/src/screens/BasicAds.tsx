import React, { useCallback, useMemo, useState } from 'react';
import { View, Platform, StyleSheet, Pressable, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AdSourceType,
  AdSkippedEvent,
  PlayerViewConfig,
  AdvertisingConfig,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

const withCorrelator = (tag: string): string =>
  `${tag}${Math.floor(Math.random() * 100000)}`;

const createAdTags = () => ({
  vastSkippable: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpreonly&ciu_szs=300x250%2C728x90&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&correlator='
  ),
  vast1: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator='
  ),
  vast2: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator='
    // 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpostonly&cmsid=496&vid=short_onecue&correlator='
  ),
});

type AdTags = ReturnType<typeof createAdTags>;

type AdSystemScenario = {
  id: 'ima' | 'bam';
  label: string;
  sourceType: AdSourceType;
};

const adSystemScenarios: AdSystemScenario[] = [
  {
    id: 'ima',
    label: 'IMA',
    sourceType: AdSourceType.IMA,
  },
  {
    id: 'bam',
    label: 'BAM',
    sourceType: AdSourceType.BITMOVIN,
  },
];

const buildAdvertisingConfig = (
  sourceType: AdSourceType,
  adTags: AdTags
): AdvertisingConfig => ({
  schedule: [
    // First ad item at "pre" (default) position.
    {
      sources: [
        {
          tag: adTags.vastSkippable,
          type: sourceType,
        },
      ],
    },
    // Second ad item at "20%" position.
    {
      position: '20%',
      sources: [
        {
          tag: adTags.vast1,
          type: sourceType,
        },
      ],
    },
  ],
});

const remoteControlConfig = {
  isCastEnabled: false,
};

const playerViewConfig: PlayerViewConfig = {
  hideFirstFrame: true,
};

export default function BasicAds() {
  const [selectedScenario, setSelectedScenario] = useState(
    adSystemScenarios[0]
  );
  const [adTags, setAdTags] = useState<AdTags>(() => createAdTags());
  const [playerInstanceKey, setPlayerInstanceKey] = useState(0);

  const onSelectScenario = useCallback((scenario: AdSystemScenario) => {
    setSelectedScenario(scenario);
    setAdTags(createAdTags());
    setPlayerInstanceKey((value) => value + 1);
  }, []);

  return (
    <View style={styles.container}>
      <BasicAdsPlayer
        key={`${selectedScenario.id}-${playerInstanceKey}`}
        scenario={selectedScenario}
        adTags={adTags}
      />
      <View style={styles.actionsContainer}>
        {adSystemScenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenario.id;
          return (
            <Pressable
              key={scenario.id}
              style={({ pressed }) => [
                styles.actionButton,
                isSelected && styles.actionButtonSelected,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => onSelectScenario(scenario)}
            >
              <Text
                style={[
                  styles.actionButtonLabel,
                  isSelected && styles.actionButtonLabelSelected,
                ]}
              >
                Ad System: {scenario.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BasicAdsPlayer({
  scenario,
  adTags,
}: {
  scenario: AdSystemScenario;
  adTags: AdTags;
}) {
  useTVGestures();

  const advertisingConfig = useMemo(
    () => buildAdvertisingConfig(scenario.sourceType, adTags),
    [scenario.sourceType, adTags]
  );
  const player = usePlayer({ advertisingConfig, remoteControlConfig });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            : 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/poster.jpg',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onSourceLoaded = useCallback(
    (event: Event) => {
      onEvent(event);
      // Dinamically schedule an ad to play after the video
      player.scheduleAd({
        position: 'post',
        sources: [
          {
            tag: adTags.vast2,
            type: scenario.sourceType,
          },
        ],
      });
    },
    [adTags.vast2, player, onEvent, scenario.sourceType]
  );

  const onAdStarted = useCallback(
    (event: Event) => {
      onEvent(event);
      // Check if an ad is playing right now
      void player.isAd().then((isAd) => {
        prettyPrint('is Ad playing?', isAd);
      });
    },
    [player, onEvent]
  );

  const onAdSkipped = useCallback(
    (event: AdSkippedEvent) => {
      onEvent(event);
      prettyPrint(`[${event.name}]`, `ID (${event.ad?.id})`);
    },
    [onEvent]
  );

  return (
    <PlayerView
      player={player}
      style={styles.player}
      config={playerViewConfig}
      onAdBreakFinished={onEvent}
      onAdBreakStarted={onEvent}
      onAdClicked={onEvent}
      onAdError={onEvent}
      onAdFinished={onEvent}
      onAdManifestLoad={onEvent}
      onAdManifestLoaded={onEvent}
      onAdQuartile={onEvent}
      onAdScheduled={onEvent}
      onAdSkipped={onAdSkipped}
      onAdStarted={onAdStarted}
      onSourceLoaded={onSourceLoaded}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  actionsContainer: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'white',
    alignSelf: 'stretch',
    borderTopColor: 'black',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  actionButton: {
    minWidth: 150,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  actionButtonSelected: {
    backgroundColor: '#1f6feb',
    borderColor: '#1f6feb',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonLabelSelected: {
    color: 'white',
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
});
