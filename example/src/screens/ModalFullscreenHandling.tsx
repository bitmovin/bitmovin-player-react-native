/**
 * ModalFullscreenHandling
 *
 * A clean reference implementation of fullscreen playback using a React Native
 * Modal. This approach works correctly on all device sizes — phones, tablets,
 * devices with navigation bars — because Modal always renders at the top of the
 * native window, above every other UI element (headers, tab bars, SafeAreaViews).
 *
 * WHY MODAL WORKS
 * ───────────────
 * React Native's Modal renders outside the component tree at the native window
 * root level. It covers everything regardless of where the player lives in the
 * component hierarchy.
 *
 * HOW THE PLAYER VIEW IS SHARED
 * ──────────────────────────────
 * There is only ONE PlayerView instance. When fullscreen is off it renders
 * inline; when fullscreen is on the inline slot is empty and the Modal renders
 * the same PlayerView JSX. React unmounts the old PlayerView and mounts a new
 * one inside the Modal — but the underlying native `player` object (from
 * usePlayer) stays alive, so playback continues seamlessly.
 *
 *   isFullscreen=false:
 *     <View>          ← inline wrapper (visible)
 *       <PlayerView>  ← mounted here
 *     <Modal visible={false}> ← hidden
 *
 *   isFullscreen=true:
 *     <View>          ← inline wrapper (empty)
 *     <Modal visible> ← covers full screen
 *       <PlayerView>  ← remounted here, reattaches to same native player
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PlayerView,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';
import type {
  FullscreenHandler,
  SourceConfig,
} from 'bitmovin-player-react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { RootStackParamsList } from '../App';

// ---------------------------------------------------------------------------
// FullscreenHandler implementation
// ---------------------------------------------------------------------------
// Inlined here so this file is self-contained and can be copied to any project.
//
// enterFullscreen: unlocks orientation (follows device), hides system UI, shows Modal.
// exitFullscreen:  unlocks orientation, restores system UI, hides Modal.
//
// Both enter and exit call unlockAsync() (not lockAsync) so fullscreen respects
// whatever orientation the device is currently held in, and the user can freely
// rotate while in fullscreen.

class SampleFullscreenHandler implements FullscreenHandler {
  isFullscreenActive: boolean = false;
  private onFullscreen: (isFullscreen: boolean) => void;

  constructor(onFullscreen: (isFullscreen: boolean) => void) {
    this.onFullscreen = onFullscreen;
  }

  enterFullscreen(): void {
    this.isFullscreenActive = true;
    if (Platform.OS === 'android') {
      void SystemNavigationBar.stickyImmersive(true);
    } else {
      StatusBar.setHidden(true);
    }
    // Unlock so fullscreen follows whatever direction the device is held.
    void ScreenOrientation.unlockAsync();
    this.onFullscreen(true);
  }

  exitFullscreen(): void {
    this.isFullscreenActive = false;
    if (Platform.OS === 'android') {
      void SystemNavigationBar.stickyImmersive(false);
    } else {
      StatusBar.setHidden(false);
    }
    void ScreenOrientation.unlockAsync();
    this.onFullscreen(false);
  }
}

// ---------------------------------------------------------------------------
// Source
// ---------------------------------------------------------------------------

const SOURCE: SourceConfig = {
  url:
    Platform.OS === 'ios'
      ? 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
      : 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
  type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
  title: 'Art of Motion',
  poster:
    'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/poster.jpg',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<
  RootStackParamsList,
  'ModalFullscreenHandling'
>;

export default function ModalFullscreenHandling({ navigation }: Props) {
  // ── Player ────────────────────────────────────────────────────────────────
  // usePlayer creates and manages the native player instance. This object
  // outlives any individual PlayerView — it keeps playing even when the
  // PlayerView is remounted inside the Modal.
  const player = usePlayer({
    remoteControlConfig: { isCastEnabled: false },
  });

  useEffect(() => {
    player.load(SOURCE);
    return () => {
      player.destroy();
    };
  }, [player]);

  // ── Fullscreen state ───────────────────────────────────────────────────────
  // isFullscreen drives both the Modal visibility and the inline player slot.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // useRef so the handler instance is stable across renders and never
  // recreated (which would cause the SDK to lose its reference to it).
  const fullscreenHandler = useRef(
    new SampleFullscreenHandler(setIsFullscreen)
  ).current;

  const onError = useCallback(() => {
    // On error, exit fullscreen to avoid a blank fullscreen Modal.
    fullscreenHandler.exitFullscreen();
  }, [fullscreenHandler]);

  // ── PlayerView JSX ────────────────────────────────────────────────────────
  /**
   * Two separate PlayerView instances — inline and fullscreen — both bound to
   * the same native `player` object.
   *
   * WHY SEPARATE?
   * ─────────────
   * The inline view has no isFullscreenRequested so it never triggers the SDK's
   * fullscreen flow. The modal view always has isFullscreenRequested={true} so
   * the SDK knows it is in fullscreen mode as soon as it mounts.
   *
   * This avoids the iOS feedback loop that occurs when a single PlayerView has
   * isFullscreenRequested toggled from true→false on exit:
   *   1. User taps exit → handler sets isFullscreen=false
   *   2. Modal unmounts its PlayerView (isFullscreenRequested=true disappears)
   *   3. Inline PlayerView mounts with no isFullscreenRequested → no loop
   *
   * On Android the loop was silently swallowed; on iOS it caused the player to
   * re-enter fullscreen immediately after exiting.
   */
  const inlinePlayerView = (
    <PlayerView
      player={player}
      style={styles.playerInline}
      fullscreenHandler={fullscreenHandler}
      onPlayerError={onError}
      onSourceError={onError}
    />
  );

  const fullscreenPlayerView = (
    <PlayerView
      player={player}
      // Always true here — this PlayerView only exists inside the Modal.
      isFullscreenRequested={true}
      style={styles.playerFullscreen}
      fullscreenHandler={fullscreenHandler}
      onPlayerError={onError}
      onSourceError={onError}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.menuBtn}
            hitSlop={12}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Modal Fullscreen</Text>
          <View style={styles.menuBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/*
           * Inline player slot.
           * When isFullscreen=false  → renders the player here.
           * When isFullscreen=true   → slot is empty; player is in the Modal.
           * This prevents two PlayerViews from using the same player object
           * simultaneously.
           */}
          <View
            style={[
              styles.inlinePlayerWrapper,
              isLandscape && {
                maxHeight: height * 0.65,
                alignSelf: 'center',
                width: (height * 0.65 * 16) / 9,
              },
            ]}
          >
            {!isFullscreen && inlinePlayerView}
          </View>

          {/* Page content below the player */}
          <View style={styles.info}>
            <Text style={styles.title}>Art of Motion</Text>
            <Text style={styles.subtitle}>
              Tap the fullscreen button inside the player to go fullscreen.
            </Text>
            <Text style={styles.body}>
              When fullscreen is activated, the PlayerView is moved into a React
              Native Modal. The Modal renders at the native window root — above
              all navigation, headers, and tab bars — so it truly covers the
              entire screen on any device, including tablets.
            </Text>
            <Text style={styles.body}>
              When you exit fullscreen (via the player button or the Android
              back button), the Modal hides and the player reappears inline,
              continuing from where it left off.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/*
       * Fullscreen Modal.
       *
       * - `visible={isFullscreen}` — shown only when fullscreen is active.
       * - `animationType="none"` — instant transition; the orientation change
       *   already provides a visual cue, a fade/slide would look jarring.
       * - `supportedOrientations={['portrait', 'landscape']}` — iOS: allow the
       *   Modal to follow the device orientation freely.
       * - `onRequestClose` — Android back button: delegate to the handler so
       *   orientation and system UI are properly restored.
       */}
      <Modal
        visible={isFullscreen}
        animationType="none"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => fullscreenHandler.exitFullscreen()}
      >
        <View style={styles.modalContainer}>{fullscreenPlayerView}</View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  menuBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  menuIcon: {
    color: '#fff',
    fontSize: 22,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Inline player: fixed 16:9 ratio, sits in the scroll flow like any element.
  inlinePlayerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  playerInline: {
    width: '100%',
    aspectRatio: 16 / 9,
  },

  // Fullscreen Modal container: fills the entire native window.
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Player inside the Modal: fills the modal container completely.
  playerFullscreen: {
    flex: 1,
  },

  info: {
    padding: 20,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#00c8dc',
    fontSize: 14,
    fontWeight: '500',
  },
  body: {
    color: '#888',
    fontSize: 14,
    lineHeight: 22,
  },
});
