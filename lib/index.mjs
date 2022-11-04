var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/components/PlayerView/index.tsx
import React, { useRef, useEffect } from "react";
import {
  Platform,
  UIManager,
  StyleSheet,
  findNodeHandle as findNodeHandle2
} from "react-native";

// src/components/PlayerView/native.ts
import { requireNativeComponent } from "react-native";
var NativePlayerView = requireNativeComponent("NativePlayerView");

// src/hooks/useProxy.ts
import omit from "lodash.omit";
import { useCallback } from "react";
import { findNodeHandle } from "react-native";
function unwrapNativeEvent(event) {
  return omit(event.nativeEvent, ["target"]);
}
function useProxy(viewRef) {
  return useCallback(
    (callback) => (event) => {
      const node = event.target._nativeTag;
      if (node === findNodeHandle(viewRef.current)) {
        callback?.(unwrapNativeEvent(event));
      }
    },
    [viewRef]
  );
}

// src/components/PlayerView/index.tsx
var styles = StyleSheet.create({
  baseStyle: {
    alignSelf: "stretch"
  }
});
function dispatch(command, node, playerId) {
  const commandId = Platform.OS === "android" ? UIManager.NativePlayerView.Commands[command].toString() : UIManager.getViewManagerConfig("NativePlayerView").Commands[command];
  UIManager.dispatchViewManagerCommand(
    node,
    commandId,
    Platform.select({
      ios: [playerId],
      android: [node, playerId]
    })
  );
}
function PlayerView(props) {
  const nativeView = useRef(null);
  const proxy = useProxy(nativeView);
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);
  useEffect(() => {
    props.player.initialize();
    const node = findNodeHandle2(nativeView.current);
    dispatch("attachPlayer", node, props.player.nativeId);
  }, [props.player]);
  return /* @__PURE__ */ React.createElement(NativePlayerView, {
    ref: nativeView,
    style,
    onDestroy: proxy(props.onDestroy),
    onEvent: proxy(props.onEvent),
    onMuted: proxy(props.onMuted),
    onPaused: proxy(props.onPaused),
    onPlay: proxy(props.onPlay),
    onPlaybackFinished: proxy(props.onPlaybackFinished),
    onPlayerActive: proxy(props.onPlayerActive),
    onPlayerError: proxy(props.onPlayerError),
    onPlayerWarning: proxy(props.onPlayerWarning),
    onPlaying: proxy(props.onPlaying),
    onReady: proxy(props.onReady),
    onSeek: proxy(props.onSeek),
    onSeeked: proxy(props.onSeeked),
    onStallStarted: proxy(props.onStallStarted),
    onStallEnded: proxy(props.onStallEnded),
    onSourceError: proxy(props.onSourceError),
    onSourceLoad: proxy(props.onSourceLoad),
    onSourceLoaded: proxy(props.onSourceLoaded),
    onSourceUnloaded: proxy(props.onSourceUnloaded),
    onSourceWarning: proxy(props.onSourceWarning),
    onAudioAdded: proxy(props.onAudioAdded),
    onAudioChanged: proxy(props.onAudioChanged),
    onAudioRemoved: proxy(props.onAudioRemoved),
    onSubtitleAdded: proxy(props.onSubtitleAdded),
    onSubtitleChanged: proxy(props.onSubtitleChanged),
    onSubtitleRemoved: proxy(props.onSubtitleRemoved),
    onTimeChanged: proxy(props.onTimeChanged),
    onUnmuted: proxy(props.onUnmuted)
  });
}

// src/components/SubtitleView/index.tsx
import React2 from "react";
import { StyleSheet as StyleSheet2, Platform as Platform2 } from "react-native";

// src/components/SubtitleView/native.ts
import { requireNativeComponent as requireNativeComponent2 } from "react-native";
var NativeSubtitleView = requireNativeComponent2(
  "BitmovinSubtitleView"
);

// src/components/SubtitleView/index.tsx
var styles2 = StyleSheet2.create({
  baseStyle: {
    alignSelf: "stretch"
  }
});
function SubtitleView(props) {
  const style = StyleSheet2.flatten([styles2.baseStyle, props.style]);
  return Platform2.OS === "android" ? /* @__PURE__ */ React2.createElement(NativeSubtitleView, {
    style,
    playerId: props?.player?.nativeId
  }) : null;
}

// src/drm/index.ts
import { NativeModules as NativeModules2, Platform as Platform3 } from "react-native";
import BatchedBridge from "react-native/Libraries/BatchedBridge/BatchedBridge";

// src/nativeInstance.ts
import { NativeModules } from "react-native";
var Uuid = NativeModules.UuidModule;
var NativeInstance = class {
  constructor(config) {
    __publicField(this, "nativeId");
    __publicField(this, "config");
    this.config = config;
    this.nativeId = config?.nativeId ?? Uuid.generate();
  }
};

// src/drm/index.ts
var DrmModule = NativeModules2.DrmModule;
var Drm = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        BatchedBridge.registerCallableModule(`DRM-${this.nativeId}`, this);
        DrmModule.initWithConfig(this.nativeId, this.config);
        this.isInitialized = true;
      }
    });
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        DrmModule.destroy(this.nativeId);
        this.isDestroyed = true;
      }
    });
    __publicField(this, "onPrepareCertificate", (certificate) => {
      if (this.config?.fairplay?.prepareCertificate) {
        DrmModule.setPreparedCertificate(
          this.nativeId,
          this.config?.fairplay?.prepareCertificate?.(certificate)
        );
      }
    });
    __publicField(this, "onPrepareMessage", (message, assetId) => {
      const config = Platform3.OS === "ios" ? this.config?.fairplay : this.config?.widevine;
      if (config && config.prepareMessage) {
        DrmModule.setPreparedMessage(
          this.nativeId,
          Platform3.OS === "ios" ? config.prepareMessage?.(message, assetId) : config.prepareMessage?.(message)
        );
      }
    });
    __publicField(this, "onPrepareSyncMessage", (syncMessage, assetId) => {
      if (this.config?.fairplay?.prepareSyncMessage) {
        DrmModule.setPreparedSyncMessage(
          this.nativeId,
          this.config?.fairplay?.prepareSyncMessage?.(syncMessage, assetId)
        );
      }
    });
    __publicField(this, "onPrepareLicense", (license) => {
      const prepareLicense = Platform3.OS === "ios" ? this.config?.fairplay?.prepareLicense : this.config?.widevine?.prepareLicense;
      if (prepareLicense) {
        DrmModule.setPreparedLicense(this.nativeId, prepareLicense(license));
      }
    });
    __publicField(this, "onPrepareLicenseServerUrl", (licenseServerUrl) => {
      if (this.config?.fairplay?.prepareLicenseServerUrl) {
        DrmModule.setPreparedLicenseServerUrl(
          this.nativeId,
          this.config?.fairplay?.prepareLicenseServerUrl?.(licenseServerUrl)
        );
      }
    });
    __publicField(this, "onPrepareContentId", (contentId) => {
      if (this.config?.fairplay?.prepareContentId) {
        DrmModule.setPreparedContentId(
          this.nativeId,
          this.config?.fairplay?.prepareContentId?.(contentId)
        );
      }
    });
  }
};

// src/hooks/usePlayer.ts
import { useRef as useRef2 } from "react";

// src/player.ts
import { NativeModules as NativeModules4, Platform as Platform4 } from "react-native";

// src/source.ts
import { NativeModules as NativeModules3 } from "react-native";
var SourceModule = NativeModules3.SourceModule;
var SourceType = /* @__PURE__ */ ((SourceType2) => {
  SourceType2["NONE"] = "none";
  SourceType2["HLS"] = "hls";
  SourceType2["DASH"] = "dash";
  SourceType2["PROGRESSIVE"] = "progressive";
  return SourceType2;
})(SourceType || {});
var LoadingState = /* @__PURE__ */ ((LoadingState2) => {
  LoadingState2[LoadingState2["UNLOADED"] = 0] = "UNLOADED";
  LoadingState2[LoadingState2["LOADING"] = 1] = "LOADING";
  LoadingState2[LoadingState2["LOADED"] = 2] = "LOADED";
  return LoadingState2;
})(LoadingState || {});
var Source = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "drm");
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        if (this.config?.drmConfig) {
          this.drm = new Drm(this.config.drmConfig);
          this.drm.initialize();
          SourceModule.initWithDrmConfig(
            this.nativeId,
            this.drm.nativeId,
            this.config
          );
        } else {
          SourceModule.initWithConfig(this.nativeId, this.config);
        }
        this.isInitialized = true;
      }
    });
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        SourceModule.destroy(this.nativeId);
        this.drm?.destroy();
        this.isDestroyed = true;
      }
    });
    __publicField(this, "duration", async () => {
      return SourceModule.duration(this.nativeId);
    });
    __publicField(this, "isActive", async () => {
      return SourceModule.isActive(this.nativeId);
    });
    __publicField(this, "isAttachedToPlayer", async () => {
      return SourceModule.isAttachedToPlayer(this.nativeId);
    });
    __publicField(this, "metadata", async () => {
      return SourceModule.getMetadata(this.nativeId);
    });
    __publicField(this, "setMetadata", (metadata) => {
      SourceModule.setMetadata(this.nativeId, metadata);
    });
    __publicField(this, "loadingState", async () => {
      return SourceModule.loadingState(this.nativeId);
    });
  }
};

// src/player.ts
var PlayerModule = NativeModules4.PlayerModule;
var Player = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "source");
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        PlayerModule.initWithConfig(this.nativeId, this.config);
        this.isInitialized = true;
      }
    });
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        PlayerModule.destroy(this.nativeId);
        this.source?.destroy();
        this.isDestroyed = true;
      }
    });
    __publicField(this, "load", (sourceConfig) => {
      this.loadSource(new Source(sourceConfig));
    });
    __publicField(this, "loadSource", (source) => {
      source.initialize();
      this.source = source;
      PlayerModule.loadSource(this.nativeId, source.nativeId);
    });
    __publicField(this, "unload", () => {
      PlayerModule.unload(this.nativeId);
    });
    __publicField(this, "play", () => {
      PlayerModule.play(this.nativeId);
    });
    __publicField(this, "pause", () => {
      PlayerModule.pause(this.nativeId);
    });
    __publicField(this, "seek", (time) => {
      PlayerModule.seek(this.nativeId, time);
    });
    __publicField(this, "mute", () => {
      PlayerModule.mute(this.nativeId);
    });
    __publicField(this, "unmute", () => {
      PlayerModule.unmute(this.nativeId);
    });
    __publicField(this, "setVolume", (volume) => {
      PlayerModule.setVolume(this.nativeId, volume);
    });
    __publicField(this, "getVolume", async () => {
      return PlayerModule.getVolume(this.nativeId);
    });
    __publicField(this, "getCurrentTime", async (mode) => {
      return PlayerModule.currentTime(this.nativeId, mode);
    });
    __publicField(this, "getDuration", async () => {
      return PlayerModule.duration(this.nativeId);
    });
    __publicField(this, "isMuted", async () => {
      return PlayerModule.isMuted(this.nativeId);
    });
    __publicField(this, "isPlaying", async () => {
      return PlayerModule.isPlaying(this.nativeId);
    });
    __publicField(this, "isPaused", async () => {
      return PlayerModule.isPaused(this.nativeId);
    });
    __publicField(this, "isLive", async () => {
      return PlayerModule.isLive(this.nativeId);
    });
    __publicField(this, "isAirPlayActive", async () => {
      if (Platform4.OS === "android") {
        console.warn(
          `[Player ${this.nativeId}] Method isAirPlayActive is not available for Android. Only iOS devices.`
        );
        return false;
      }
      return PlayerModule.isAirPlayActive(this.nativeId);
    });
    __publicField(this, "isAirPlayAvailable", async () => {
      if (Platform4.OS === "android") {
        console.warn(
          `[Player ${this.nativeId}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
        );
        return false;
      }
      return PlayerModule.isAirPlayAvailable(this.nativeId);
    });
    __publicField(this, "getAvailableAudioTracks", async () => {
      return PlayerModule.getAvailableAudioTracks(this.nativeId);
    });
    __publicField(this, "setAudioTrack", async (trackIdentifier) => {
      PlayerModule.setAudioTrack(this.nativeId, trackIdentifier);
    });
    __publicField(this, "getAvailableSubtitles", async () => {
      return PlayerModule.getAvailableSubtitles(this.nativeId);
    });
    __publicField(this, "setSubtitleTrack", async (trackIdentifier) => {
      PlayerModule.setSubtitleTrack(this.nativeId, trackIdentifier);
    });
  }
};

// src/hooks/usePlayer.ts
function usePlayer(config) {
  return useRef2(new Player(config)).current;
}

// src/subtitleTrack.ts
var SubtitleFormat = /* @__PURE__ */ ((SubtitleFormat2) => {
  SubtitleFormat2["CEA"] = "cea";
  SubtitleFormat2["TTML"] = "ttml";
  SubtitleFormat2["VTT"] = "vtt";
  return SubtitleFormat2;
})(SubtitleFormat || {});

// src/styleConfig.ts
var UserInterfaceType = /* @__PURE__ */ ((UserInterfaceType2) => {
  UserInterfaceType2["bitmovin"] = "bitmovin";
  UserInterfaceType2["system"] = "system";
  UserInterfaceType2["subtitle"] = "subtitle";
  return UserInterfaceType2;
})(UserInterfaceType || {});
var ScalingMode = /* @__PURE__ */ ((ScalingMode2) => {
  ScalingMode2["Fit"] = "Fit";
  ScalingMode2["Stretch"] = "Stretch";
  ScalingMode2["Zoom"] = "Zoom";
  return ScalingMode2;
})(ScalingMode || {});
export {
  Drm,
  LoadingState,
  Player,
  PlayerView,
  ScalingMode,
  Source,
  SourceType,
  SubtitleFormat,
  SubtitleView,
  UserInterfaceType,
  usePlayer
};
