var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/advertising.ts
var AdQuartile = /* @__PURE__ */ ((AdQuartile2) => {
  AdQuartile2["FIRST"] = "first";
  AdQuartile2["MID_POINT"] = "mid_point";
  AdQuartile2["THIRD"] = "third";
  return AdQuartile2;
})(AdQuartile || {});
var AdSourceType = /* @__PURE__ */ ((AdSourceType2) => {
  AdSourceType2["IMA"] = "ima";
  AdSourceType2["UNKNOWN"] = "unknown";
  AdSourceType2["PROGRESSIVE"] = "progressive";
  return AdSourceType2;
})(AdSourceType || {});

// src/analytics/config.ts
var CdnProvider = /* @__PURE__ */ ((CdnProvider2) => {
  CdnProvider2["BITMOVIN"] = "bitmovin";
  CdnProvider2["AKAMAI"] = "akamai";
  CdnProvider2["FASTLY"] = "fastly";
  CdnProvider2["MAXCDN"] = "maxcdn";
  CdnProvider2["CLOUDFRONT"] = "cloudfront";
  CdnProvider2["CHINACACHE"] = "chinacache";
  CdnProvider2["BITGRAVITY"] = "bitgravity";
  return CdnProvider2;
})(CdnProvider || {});

// src/analytics/collector.ts
import { NativeModules as NativeModules2 } from "react-native";

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

// src/analytics/collector.ts
var AnalyticsModule = NativeModules2.AnalyticsModule;
var AnalyticsCollector = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        AnalyticsModule.initWithConfig(this.nativeId, this.config);
        this.isInitialized = true;
      }
    });
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        AnalyticsModule.destroy(this.nativeId);
        this.isDestroyed = true;
      }
    });
    __publicField(this, "attach", (playerId) => {
      AnalyticsModule.attach(this.nativeId, playerId);
    });
    __publicField(this, "detach", () => {
      AnalyticsModule.detach(this.nativeId);
    });
    __publicField(this, "setCustomDataOnce", (customData) => {
      AnalyticsModule.setCustomDataOnce(this.nativeId, customData);
    });
    __publicField(this, "setCustomData", (customData) => {
      AnalyticsModule.setCustomData(this.nativeId, customData);
    });
    __publicField(this, "getCustomData", async () => {
      return AnalyticsModule.getCustomData(this.nativeId);
    });
    __publicField(this, "getUserId", async () => {
      return AnalyticsModule.getUserId(this.nativeId);
    });
  }
};

// src/audioSession.ts
import { NativeModules as NativeModules3 } from "react-native";
var AudioSessionModule = NativeModules3.AudioSessionModule;
var AudioSession = {
  setCategory: async (category) => {
    if (AudioSessionModule) {
      await AudioSessionModule.setCategory(category);
    }
  }
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

// src/ui/fullscreenhandlerbridge.ts
import { NativeModules as NativeModules4 } from "react-native";
import BatchedBridge from "react-native/Libraries/BatchedBridge/BatchedBridge";
var Uuid2 = NativeModules4.UuidModule;
var FullscreenHandlerModule = NativeModules4.FullscreenHandlerModule;
var FullscreenHandlerBridge = class {
  constructor(nativeId) {
    __publicField(this, "nativeId");
    __publicField(this, "fullscreenHandler");
    __publicField(this, "isDestroyed");
    this.nativeId = nativeId ?? Uuid2.generate();
    this.isDestroyed = false;
    BatchedBridge.registerCallableModule(
      `FullscreenBridge-${this.nativeId}`,
      this
    );
    FullscreenHandlerModule.registerHandler(this.nativeId);
  }
  destroy() {
    if (!this.isDestroyed) {
      FullscreenHandlerModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }
  enterFullscreen() {
    this.fullscreenHandler?.enterFullscreen();
    FullscreenHandlerModule.onFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
  exitFullscreen() {
    this.fullscreenHandler?.exitFullscreen();
    FullscreenHandlerModule.onFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
};

// src/ui/custommessagehandlerbridge.ts
import { NativeModules as NativeModules5 } from "react-native";
import BatchedBridge2 from "react-native/Libraries/BatchedBridge/BatchedBridge";
var Uuid3 = NativeModules5.UuidModule;
var CustomMessageHandlerModule = NativeModules5.CustomMessageHandlerModule;
var CustomMessageHandlerBridge = class {
  constructor(nativeId) {
    __publicField(this, "nativeId");
    __publicField(this, "customMessageHandler");
    __publicField(this, "isDestroyed");
    this.nativeId = nativeId ?? Uuid3.generate();
    this.isDestroyed = false;
    BatchedBridge2.registerCallableModule(
      `CustomMessageBridge-${this.nativeId}`,
      this
    );
    CustomMessageHandlerModule.registerHandler(this.nativeId);
  }
  setCustomMessageHandler(customMessageHandler) {
    this.customMessageHandler = customMessageHandler;
    this.customMessageHandler.customMessageSender = this;
  }
  destroy() {
    if (!this.isDestroyed) {
      CustomMessageHandlerModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }
  receivedSynchronousMessage(message, data) {
    const result = this.customMessageHandler?.receivedSynchronousMessage(
      message,
      data
    );
    CustomMessageHandlerModule.onReceivedSynchronousMessageResult(
      this.nativeId,
      result
    );
  }
  receivedAsynchronousMessage(message, data) {
    this.customMessageHandler?.receivedAsynchronousMessage(message, data);
  }
  sendMessage(message, data) {
    CustomMessageHandlerModule.sendMessage(this.nativeId, message, data);
  }
};

// src/components/PlayerView/index.tsx
var styles = StyleSheet.create({
  baseStyle: {
    alignSelf: "stretch"
  }
});
function dispatch(command, node, ...args) {
  const commandId = Platform.OS === "android" ? UIManager.NativePlayerView.Commands[command].toString() : UIManager.getViewManagerConfig("NativePlayerView").Commands[command];
  UIManager.dispatchViewManagerCommand(
    node,
    commandId,
    Platform.select({ ios: args, android: [node, ...args] })
  );
}
function PlayerView({
  style,
  player,
  fullscreenHandler,
  customMessageHandler,
  ...props
}) {
  const nativeView = useRef(null);
  const proxy = useProxy(nativeView);
  const nativeViewStyle = StyleSheet.flatten([styles.baseStyle, style]);
  const fullscreenBridge = useRef(void 0);
  if (fullscreenHandler && !fullscreenBridge.current) {
    fullscreenBridge.current = new FullscreenHandlerBridge();
  }
  if (fullscreenBridge.current) {
    fullscreenBridge.current.fullscreenHandler = fullscreenHandler;
  }
  const customMessageHandlerBridge = useRef(void 0);
  if (customMessageHandler && !customMessageHandlerBridge.current) {
    customMessageHandlerBridge.current = new CustomMessageHandlerBridge();
  }
  if (customMessageHandlerBridge.current && customMessageHandler) {
    customMessageHandlerBridge.current.setCustomMessageHandler(
      customMessageHandler
    );
  }
  useEffect(() => {
    player.initialize();
    const node = findNodeHandle2(nativeView.current);
    if (node) {
      if (customMessageHandlerBridge.current) {
        dispatch(
          "setCustomMessageHandlerBridgeId",
          node,
          customMessageHandlerBridge.current.nativeId
        );
      }
      dispatch("attachPlayer", node, player.nativeId, player.config);
      if (fullscreenBridge.current) {
        dispatch(
          "attachFullscreenBridge",
          node,
          fullscreenBridge.current.nativeId
        );
      }
    }
    return () => {
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = void 0;
      customMessageHandlerBridge.current?.destroy();
      customMessageHandlerBridge.current = void 0;
    };
  }, [player]);
  return /* @__PURE__ */ React.createElement(NativePlayerView, {
    ref: nativeView,
    style: nativeViewStyle,
    disableAdUi: props.disableAdUi,
    fullscreenBridge: fullscreenBridge.current,
    customMessageHandlerBridge: customMessageHandlerBridge.current,
    onAdBreakFinished: proxy(props.onAdBreakFinished),
    onAdBreakStarted: proxy(props.onAdBreakStarted),
    onAdClicked: proxy(props.onAdClicked),
    onAdError: proxy(props.onAdError),
    onAdFinished: proxy(props.onAdFinished),
    onAdManifestLoad: proxy(props.onAdManifestLoad),
    onAdManifestLoaded: proxy(props.onAdManifestLoaded),
    onAdQuartile: proxy(props.onAdQuartile),
    onAdScheduled: proxy(props.onAdScheduled),
    onAdSkipped: proxy(props.onAdSkipped),
    onAdStarted: proxy(props.onAdStarted),
    onDestroy: proxy(props.onDestroy),
    onEvent: proxy(props.onEvent),
    onFullscreenEnabled: proxy(props.onFullscreenEnabled),
    onFullscreenDisabled: proxy(props.onFullscreenDisabled),
    onFullscreenEnter: proxy(props.onFullscreenEnter),
    onFullscreenExit: proxy(props.onFullscreenExit),
    onMuted: proxy(props.onMuted),
    onPaused: proxy(props.onPaused),
    onPictureInPictureAvailabilityChanged: proxy(
      props.onPictureInPictureAvailabilityChanged
    ),
    onPictureInPictureEnter: proxy(props.onPictureInPictureEnter),
    onPictureInPictureEntered: proxy(props.onPictureInPictureEntered),
    onPictureInPictureExit: proxy(props.onPictureInPictureExit),
    onPictureInPictureExited: proxy(props.onPictureInPictureExited),
    onPlay: proxy(props.onPlay),
    onPlaybackFinished: proxy(props.onPlaybackFinished),
    onPlayerActive: proxy(props.onPlayerActive),
    onPlayerError: proxy(props.onPlayerError),
    onPlayerWarning: proxy(props.onPlayerWarning),
    onPlaying: proxy(props.onPlaying),
    onReady: proxy(props.onReady),
    onSeek: proxy(props.onSeek),
    onSeeked: proxy(props.onSeeked),
    onTimeShift: proxy(props.onTimeShift),
    onTimeShifted: proxy(props.onTimeShifted),
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
    onUnmuted: proxy(props.onUnmuted),
    onVideoSizeChanged: proxy(props.onVideoSizeChanged),
    onDurationChanged: proxy(props.onDurationChanged),
    onVideoPlaybackQualityChanged: proxy(props.onVideoPlaybackQualityChanged)
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
    playerId: props?.player?.nativeId,
    applyEmbeddedFontSizes: props.applyEmbeddedFontSizes,
    applyEmbeddedStyles: props.applyEmbeddedStyles,
    bottomPaddingFraction: props.bottomPaddingFraction,
    fixedTextSize: props.fixedTextSize,
    fractionalTextSize: props.fractionalTextSize,
    captionStyle: props.captionStyle
  }) : null;
}

// src/drm/index.ts
import { NativeModules as NativeModules6, Platform as Platform3 } from "react-native";
import BatchedBridge3 from "react-native/Libraries/BatchedBridge/BatchedBridge";
var DrmModule = NativeModules6.DrmModule;
var Drm = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        BatchedBridge3.registerCallableModule(`DRM-${this.nativeId}`, this);
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
import { NativeModules as NativeModules8, Platform as Platform4 } from "react-native";

// src/source.ts
import { NativeModules as NativeModules7 } from "react-native";
var SourceModule = NativeModules7.SourceModule;
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
var PlayerModule = NativeModules8.PlayerModule;
var Player = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "source");
    __publicField(this, "analyticsCollector");
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        PlayerModule.initWithConfig(this.nativeId, this.config);
        const analyticsConfig = this.config?.analyticsConfig;
        if (analyticsConfig) {
          this.analyticsCollector = new AnalyticsCollector(analyticsConfig);
          this.analyticsCollector?.initialize();
          this.analyticsCollector?.attach(this.nativeId);
        }
        this.isInitialized = true;
      }
    });
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        PlayerModule.destroy(this.nativeId);
        this.source?.destroy();
        this.analyticsCollector?.destroy();
        this.isDestroyed = true;
      }
    });
    __publicField(this, "load", (sourceConfig) => {
      this.loadSource(new Source(sourceConfig));
    });
    __publicField(this, "loadOfflineSource", (offlineContentManager) => {
      PlayerModule.loadOfflineSource(
        this.nativeId,
        offlineContentManager.nativeId
      );
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
    __publicField(this, "timeShift", (offset) => {
      PlayerModule.timeShift(this.nativeId, offset);
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
    __publicField(this, "setPlaybackSpeed", (speed) => {
      PlayerModule.setPlaybackSpeed(this.nativeId, speed);
    });
    __publicField(this, "getPlaybackSpeed", async () => {
      return PlayerModule.getPlaybackSpeed(this.nativeId);
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
      return PlayerModule.setAudioTrack(this.nativeId, trackIdentifier);
    });
    __publicField(this, "getAvailableSubtitles", async () => {
      return PlayerModule.getAvailableSubtitles(this.nativeId);
    });
    __publicField(this, "setSubtitleTrack", async (trackIdentifier) => {
      return PlayerModule.setSubtitleTrack(this.nativeId, trackIdentifier);
    });
    __publicField(this, "scheduleAd", (adItem) => {
      PlayerModule.scheduleAd(this.nativeId, adItem);
    });
    __publicField(this, "skipAd", async () => {
      return PlayerModule.skipAd(this.nativeId);
    });
    __publicField(this, "isAd", async () => {
      return PlayerModule.isAd(this.nativeId);
    });
    __publicField(this, "getTimeShift", async () => {
      return PlayerModule.getTimeShift(this.nativeId);
    });
    __publicField(this, "getMaxTimeShift", async () => {
      return PlayerModule.getMaxTimeShift(this.nativeId);
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

// src/ui/custommessagehandler.ts
var CustomMessageHandler = class {
  constructor({
    onReceivedSynchronousMessage,
    onReceivedAsynchronousMessage
  }) {
    __publicField(this, "onReceivedSynchronousMessage");
    __publicField(this, "onReceivedAsynchronousMessage");
    __publicField(this, "customMessageSender");
    this.onReceivedSynchronousMessage = onReceivedSynchronousMessage;
    this.onReceivedAsynchronousMessage = onReceivedAsynchronousMessage;
  }
  receivedSynchronousMessage(message, data) {
    return this.onReceivedSynchronousMessage(message, data);
  }
  receivedAsynchronousMessage(message, data) {
    this.onReceivedAsynchronousMessage(message, data);
  }
  sendMessage(message, data) {
    this.customMessageSender?.sendMessage(message, data);
  }
};

// src/offlineContentOptions.ts
var OfflineOptionEntryState = /* @__PURE__ */ ((OfflineOptionEntryState2) => {
  OfflineOptionEntryState2["Downloaded"] = "Downloaded";
  OfflineOptionEntryState2["Downloading"] = "Downloading";
  OfflineOptionEntryState2["Suspended"] = "Suspended";
  OfflineOptionEntryState2["NotDownloaded"] = "NotDownloaded";
  return OfflineOptionEntryState2;
})(OfflineOptionEntryState || {});

// src/offlineContentManager.ts
import {
  NativeEventEmitter,
  NativeModules as NativeModules9
} from "react-native";

// src/offlineContentManagerListener.ts
var OfflineEventType = /* @__PURE__ */ ((OfflineEventType2) => {
  OfflineEventType2["onCompleted"] = "onCompleted";
  OfflineEventType2["onError"] = "onError";
  OfflineEventType2["onProgress"] = "onProgress";
  OfflineEventType2["onOptionsAvailable"] = "onOptionsAvailable";
  OfflineEventType2["onDrmLicenseUpdated"] = "onDrmLicenseUpdated";
  OfflineEventType2["onSuspended"] = "onSuspended";
  OfflineEventType2["onResumed"] = "onResumed";
  return OfflineEventType2;
})(OfflineEventType || {});

// src/offlineContentManager.ts
var OfflineModule = NativeModules9.BitmovinOfflineModule;
var OfflineContentManager = class extends NativeInstance {
  constructor(config) {
    super(config);
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "eventSubscription");
    __publicField(this, "initialize", () => {
      let initPromise = Promise.resolve();
      if (!this.isInitialized && this.config) {
        if (this.config.listener) {
          this.eventSubscription = new NativeEventEmitter(
            OfflineModule
          ).addListener(
            "BitmovinOfflineEvent",
            (data) => {
              if (this.nativeId !== data?.nativeId) {
                return;
              }
              if (data.eventType === "onCompleted" /* onCompleted */) {
                this.config?.listener?.onCompleted?.(data);
              } else if (data.eventType === "onError" /* onError */) {
                this.config?.listener?.onError?.(data);
              } else if (data.eventType === "onProgress" /* onProgress */) {
                this.config?.listener?.onProgress?.(data);
              } else if (data.eventType === "onOptionsAvailable" /* onOptionsAvailable */) {
                this.config?.listener?.onOptionsAvailable?.(data);
              } else if (data.eventType === "onDrmLicenseUpdated" /* onDrmLicenseUpdated */) {
                this.config?.listener?.onDrmLicenseUpdated?.(data);
              } else if (data.eventType === "onSuspended" /* onSuspended */) {
                this.config?.listener?.onSuspended?.(data);
              } else if (data.eventType === "onResumed" /* onResumed */) {
                this.config?.listener?.onResumed?.(data);
              }
            }
          );
        }
        initPromise = OfflineModule.initWithConfig(this.nativeId, {
          offlineId: this.config.offlineId,
          sourceConfig: this.config.sourceConfig
        });
      }
      this.isInitialized = true;
      return initPromise;
    });
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        this.isDestroyed = true;
        this.eventSubscription?.remove?.();
        return OfflineModule.release(this.nativeId);
      }
      return Promise.resolve();
    });
    __publicField(this, "getOfflineSourceConfig", () => {
      return OfflineModule.getOfflineSourceConfig(this.nativeId);
    });
    __publicField(this, "getOptions", () => {
      return OfflineModule.getOptions(this.nativeId);
    });
    __publicField(this, "process", (request) => {
      return OfflineModule.process(this.nativeId, request);
    });
    __publicField(this, "resume", () => {
      return OfflineModule.resume(this.nativeId);
    });
    __publicField(this, "suspend", () => {
      return OfflineModule.suspend(this.nativeId);
    });
    __publicField(this, "cancelDownload", () => {
      return OfflineModule.cancelDownload(this.nativeId);
    });
    __publicField(this, "deleteAll", () => {
      return OfflineModule.deleteAll(this.nativeId);
    });
    __publicField(this, "downloadLicense", () => {
      return OfflineModule.downloadLicense(this.nativeId);
    });
    __publicField(this, "releaseLicense", () => {
      return OfflineModule.releaseLicense(this.nativeId);
    });
    __publicField(this, "renewOfflineLicense", () => {
      return OfflineModule.renewOfflineLicense(this.nativeId);
    });
  }
};
export {
  AdQuartile,
  AdSourceType,
  AnalyticsCollector,
  AudioSession,
  CdnProvider,
  CustomMessageHandler,
  Drm,
  LoadingState,
  OfflineContentManager,
  OfflineEventType,
  OfflineOptionEntryState,
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
