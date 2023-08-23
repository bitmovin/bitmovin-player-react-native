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
  /**
   * Generate UUID in case the user-defined `nativeId` is empty.
   */
  constructor(config) {
    /**
     * Optionally user-defined string `id` for the native instance, or UUIDv4.
     */
    __publicField(this, "nativeId");
    /**
     * The configuration object used to initialize this instance.
     */
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
    /**
     * Whether the native `AnalyticsCollector` object has been created.
     */
    __publicField(this, "isInitialized", false);
    /**
     * The native player id that this analytics collector is attached to.
     */
    __publicField(this, "playerId");
    /**
     * Whether the native `AnalyticsCollector` object has been disposed.
     */
    __publicField(this, "isDestroyed", false);
    /**
     * Initializes a native `BitmovinPlayerCollector` object.
     */
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        AnalyticsModule.initWithConfig(this.nativeId, this.config);
        this.isInitialized = true;
      }
    });
    /**
     * Disposes the native `BitmovinPlayerCollector` object that has been created
     * during initialization.
     */
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        AnalyticsModule.destroy(this.nativeId);
        this.isDestroyed = true;
        this.playerId = void 0;
      }
    });
    /**
     * Attach a player instance to this analytics plugin. After this is completed, BitmovinAnalytics
     * will start monitoring and sending analytics data based on the attached player instance.
     *
     * @param playerId - Native Id of the player to attach this collector instance.
     */
    __publicField(this, "attach", (playerId) => {
      this.playerId = playerId;
      AnalyticsModule.attach(this.nativeId, playerId);
    });
    /**
     * Detach a player instance from this analytics plugin if there's any attached. If no player is attached,
     * nothing happens.
     */
    __publicField(this, "detach", () => {
      this.playerId = void 0;
      AnalyticsModule.detach(this.nativeId);
    });
    /**
     * Dynamically updates analytics custom data information. Use this method
     * to update your custom data during runtime.
     *
     * @param customData - Analytics custom data config.
     */
    __publicField(this, "setCustomDataOnce", (customData) => {
      AnalyticsModule.setCustomDataOnce(this.nativeId, customData);
    });
    /**
     * Sets the internal analytics custom data state.
     *
     * @param customData - Analytics custom data config.
     */
    __publicField(this, "setCustomData", (customData) => {
      AnalyticsModule.setCustomData(this.nativeId, this.playerId, customData);
    });
    /**
     * Gets the current custom data config from the native `BitmovinPlayerCollector` instance.
     *
     * @returns The current custom data config.
     */
    __publicField(this, "getCustomData", async () => {
      return AnalyticsModule.getCustomData(this.nativeId, this.playerId);
    });
    /**
     * Gets the current user id used by the native `BitmovinPlayerCollector` instance.
     *
     * @returns The current user id.
     */
    __publicField(this, "getUserId", async () => {
      return AnalyticsModule.getUserId(this.nativeId);
    });
    /**
     * Adds source metadata for the current source loaded into the player.
     * This method should be called every time a new source is loaded into the player to ensure
     * that the analytics data is correct.
     * @param sourceMetadata - Source metadata to set.
     */
    __publicField(this, "addSourceMetadata", (sourceMetadata) => {
      return AnalyticsModule.addSourceMetadata(
        this.nativeId,
        this.playerId,
        sourceMetadata
      );
    });
  }
};

// src/audioSession.ts
import { NativeModules as NativeModules3 } from "react-native";
var AudioSessionModule = NativeModules3.AudioSessionModule;
var AudioSession = {
  /**
   * Sets the audio session's category.
   *
   * @platform iOS
   * @see https://developer.apple.com/documentation/avfaudio/avaudiosession/1616583-setcategory
   */
  setCategory: async (category) => {
    if (AudioSessionModule) {
      await AudioSessionModule.setCategory(category);
    }
  }
};

// src/components/PlayerView/index.tsx
import React, { useRef, useEffect, useCallback as useCallback2 } from "react";
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
  setFullscreenHandler(fullscreenHandler) {
    if (this.fullscreenHandler === fullscreenHandler) {
      return;
    }
    this.fullscreenHandler = fullscreenHandler;
    FullscreenHandlerModule.setIsFullscreenActive(
      this.nativeId,
      fullscreenHandler?.isFullscreenActive ?? false
    );
  }
  /**
   * Destroys the native FullscreenHandler
   */
  destroy() {
    if (!this.isDestroyed) {
      FullscreenHandlerModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI should enter fullscreen.
   */
  enterFullscreen() {
    this.fullscreenHandler?.enterFullscreen();
    FullscreenHandlerModule.onFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI should exit fullscreen.
   */
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
  /**
   * Destroys the native CustomMessageHandler
   */
  destroy() {
    if (!this.isDestroyed) {
      CustomMessageHandlerModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI sends a synchronous message.
   */
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
  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI sends an asynchronous message.
   */
  receivedAsynchronousMessage(message, data) {
    this.customMessageHandler?.receivedAsynchronousMessage(message, data);
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by CustomMessageHandler, when sending a message to the UI.
   */
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
  isFullscreenRequested = false,
  ...props
}) {
  const workaroundViewManagerCommandNotSent = useCallback2(() => {
    setTimeout(() => player.getDuration(), 100);
  }, [player]);
  const nativeView = useRef(null);
  const proxy = useProxy(nativeView);
  const nativeViewStyle = StyleSheet.flatten([styles.baseStyle, style]);
  const fullscreenBridge = useRef(void 0);
  if (fullscreenHandler && !fullscreenBridge.current) {
    fullscreenBridge.current = new FullscreenHandlerBridge();
  }
  if (fullscreenBridge.current) {
    fullscreenBridge.current.setFullscreenHandler(fullscreenHandler);
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
      workaroundViewManagerCommandNotSent();
    }
    return () => {
      fullscreenBridge.current?.destroy();
      fullscreenBridge.current = void 0;
      customMessageHandlerBridge.current?.destroy();
      customMessageHandlerBridge.current = void 0;
    };
  }, [player, workaroundViewManagerCommandNotSent]);
  useEffect(() => {
    const node = findNodeHandle2(nativeView.current);
    if (node) {
      dispatch("setFullscreen", node, isFullscreenRequested);
    }
  }, [isFullscreenRequested, nativeView]);
  return /* @__PURE__ */ React.createElement(
    NativePlayerView,
    {
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
    }
  );
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
  return Platform2.OS === "android" ? /* @__PURE__ */ React2.createElement(
    NativeSubtitleView,
    {
      style,
      playerId: props?.player?.nativeId,
      applyEmbeddedFontSizes: props.applyEmbeddedFontSizes,
      applyEmbeddedStyles: props.applyEmbeddedStyles,
      bottomPaddingFraction: props.bottomPaddingFraction,
      fixedTextSize: props.fixedTextSize,
      fractionalTextSize: props.fractionalTextSize,
      captionStyle: props.captionStyle
    }
  ) : null;
}

// src/drm/index.ts
import { NativeModules as NativeModules6, Platform as Platform3 } from "react-native";
import BatchedBridge3 from "react-native/Libraries/BatchedBridge/BatchedBridge";
var DrmModule = NativeModules6.DrmModule;
var Drm = class extends NativeInstance {
  constructor() {
    super(...arguments);
    /**
     * Whether this object's native instance has been created.
     */
    __publicField(this, "isInitialized", false);
    /**
     * Whether this object's native instance has been disposed.
     */
    __publicField(this, "isDestroyed", false);
    /**
     * Allocates the DRM config instance and its resources natively.
     */
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        BatchedBridge3.registerCallableModule(`DRM-${this.nativeId}`, this);
        DrmModule.initWithConfig(this.nativeId, this.config);
        this.isInitialized = true;
      }
    });
    /**
     * Destroys the native DRM config and releases all of its allocated resources.
     */
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        DrmModule.destroy(this.nativeId);
        this.isDestroyed = true;
      }
    });
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareCertificate` function to native's `certificate` data and store
     * the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareCertificate` is dispatched.
     *
     * @param certificate - Base64 encoded certificate data.
     */
    __publicField(this, "onPrepareCertificate", (certificate) => {
      if (this.config?.fairplay?.prepareCertificate) {
        DrmModule.setPreparedCertificate(
          this.nativeId,
          this.config?.fairplay?.prepareCertificate?.(certificate)
        );
      }
    });
    /**
     * Applies the user-defined `prepareMessage` function to native's `message` data and store
     * the result back in `DrmModule`.
     *
     * Called from native code when `prepareMessage` is dispatched.
     *
     * @param message - Base64 encoded message data.
     * @param assetId - Optional asset ID. Only sent by iOS.
     */
    __publicField(this, "onPrepareMessage", (message, assetId) => {
      const config = Platform3.OS === "ios" ? this.config?.fairplay : this.config?.widevine;
      if (config && config.prepareMessage) {
        DrmModule.setPreparedMessage(
          this.nativeId,
          Platform3.OS === "ios" ? config.prepareMessage?.(message, assetId) : config.prepareMessage?.(message)
        );
      }
    });
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareSyncMessage` function to native's `syncMessage` data and
     * store the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareSyncMessage` is dispatched.
     *
     * @param syncMessage - Base64 encoded sync SPC message data.
     */
    __publicField(this, "onPrepareSyncMessage", (syncMessage, assetId) => {
      if (this.config?.fairplay?.prepareSyncMessage) {
        DrmModule.setPreparedSyncMessage(
          this.nativeId,
          this.config?.fairplay?.prepareSyncMessage?.(syncMessage, assetId)
        );
      }
    });
    /**
     * Applies the user-defined `prepareLicense` function to native's `license` data and store
     * the result back in `DrmModule`.
     *
     * Called from native code when `prepareLicense` is dispatched.
     *
     * @param license - Base64 encoded license data.
     */
    __publicField(this, "onPrepareLicense", (license) => {
      const prepareLicense = Platform3.OS === "ios" ? this.config?.fairplay?.prepareLicense : this.config?.widevine?.prepareLicense;
      if (prepareLicense) {
        DrmModule.setPreparedLicense(this.nativeId, prepareLicense(license));
      }
    });
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareLicenseServerUrl` function to native's `licenseServerUrl` data
     * and store the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareLicenseServerUrl` is dispatched.
     *
     * @param licenseServerUrl - The license server URL string.
     */
    __publicField(this, "onPrepareLicenseServerUrl", (licenseServerUrl) => {
      if (this.config?.fairplay?.prepareLicenseServerUrl) {
        DrmModule.setPreparedLicenseServerUrl(
          this.nativeId,
          this.config?.fairplay?.prepareLicenseServerUrl?.(licenseServerUrl)
        );
      }
    });
    /**
     * iOS only.
     *
     * Applies the user-defined `prepareContentId` function to native's `contentId` string
     * and store the result back in `DrmModule`.
     *
     * Called from native code when `FairplayConfig.prepareContentId` is dispatched.
     *
     * @param contentId - The extracted contentId string.
     */
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
    /**
     * The native DRM config reference of this source.
     */
    __publicField(this, "drm");
    /**
     * Whether the native `Source` object has been created.
     */
    __publicField(this, "isInitialized", false);
    /**
     * Whether the native `Source` object has been disposed.
     */
    __publicField(this, "isDestroyed", false);
    /**
     * Allocates the native `Source` instance and its resources natively.
     */
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
    /**
     * Destroys the native `Source` and releases all of its allocated resources.
     */
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        SourceModule.destroy(this.nativeId);
        this.drm?.destroy();
        this.isDestroyed = true;
      }
    });
    /**
     * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
     * Default value is `0` if the duration is not available or not known.
     */
    __publicField(this, "duration", async () => {
      return SourceModule.duration(this.nativeId);
    });
    /**
     * Whether the source is currently active in a player (i.e. playing back or paused).
     * Only one source can be active in the same player instance at any time.
     */
    __publicField(this, "isActive", async () => {
      return SourceModule.isActive(this.nativeId);
    });
    /**
     * Whether the source is currently attached to a player instance.
     */
    __publicField(this, "isAttachedToPlayer", async () => {
      return SourceModule.isAttachedToPlayer(this.nativeId);
    });
    /**
     * Metadata for the currently loaded source.
     */
    __publicField(this, "metadata", async () => {
      return SourceModule.getMetadata(this.nativeId);
    });
    /**
     * Set metadata for the currently loaded source.
     * Setting the metadata to `null` clears the metadata object in native source.
     */
    __publicField(this, "setMetadata", (metadata) => {
      SourceModule.setMetadata(this.nativeId, metadata);
    });
    /**
     * The current `LoadingState` of the source.
     */
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
    /**
     * Currently active source, or `null` if none is active.
     */
    __publicField(this, "source");
    /**
     * Analytics collector currently attached to this player instance.
     */
    __publicField(this, "analyticsCollector");
    /**
     * Whether the native `Player` object has been created.
     */
    __publicField(this, "isInitialized", false);
    /**
     * Whether the native `Player` object has been disposed.
     */
    __publicField(this, "isDestroyed", false);
    /**
     * Allocates the native `Player` instance and its resources natively.
     */
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
    /**
     * Destroys the native `Player` and releases all of its allocated resources.
     */
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        PlayerModule.destroy(this.nativeId);
        this.source?.destroy();
        this.analyticsCollector?.destroy();
        this.isDestroyed = true;
      }
    });
    /**
     * Loads a new `Source` from `sourceConfig` into the player.
     */
    __publicField(this, "load", (sourceConfig) => {
      this.loadSource(new Source(sourceConfig));
    });
    /**
     * Loads the OfflineSourceConfig into the player.
     */
    __publicField(this, "loadOfflineSource", (offlineContentManager, options) => {
      if (Platform4.OS === "ios") {
        PlayerModule.loadOfflineSource(
          this.nativeId,
          offlineContentManager.nativeId,
          options
        );
        return;
      }
      PlayerModule.loadOfflineSource(
        this.nativeId,
        offlineContentManager.nativeId
      );
    });
    /**
     * Loads the given `Source` into the player.
     */
    __publicField(this, "loadSource", (source) => {
      source.initialize();
      this.source = source;
      PlayerModule.loadSource(this.nativeId, source.nativeId);
    });
    /**
     * Unloads all `Source`s from the player.
     */
    __publicField(this, "unload", () => {
      PlayerModule.unload(this.nativeId);
    });
    /**
     * Starts or resumes playback after being paused. Has no effect if the player is already playing.
     */
    __publicField(this, "play", () => {
      PlayerModule.play(this.nativeId);
    });
    /**
     * Pauses the video if it is playing. Has no effect if the player is already paused.
     */
    __publicField(this, "pause", () => {
      PlayerModule.pause(this.nativeId);
    });
    /**
     * Seeks to the given playback time specified by the parameter `time` in seconds. Must not be
     * greater than the total duration of the video. Has no effect when watching a live stream since
     * seeking is not possible.
     *
     * @param time - The time to seek to in seconds.
     */
    __publicField(this, "seek", (time) => {
      PlayerModule.seek(this.nativeId, time);
    });
    /**
     * Shifts the time to the given `offset` in seconds from the live edge. The resulting offset has to be within the
     * timeShift window as specified by `maxTimeShift` (which is a negative value) and 0. When the provided `offset` is
     * positive, it will be interpreted as a UNIX timestamp in seconds and converted to fit into the timeShift window.
     * When the provided `offset` is negative, but lower than `maxTimeShift`, then it will be clamped to `maxTimeShift`.
     * Has no effect for VoD.
     *
     * Has no effect if no sources are loaded.
     */
    __publicField(this, "timeShift", (offset) => {
      PlayerModule.timeShift(this.nativeId, offset);
    });
    /**
     * Mutes the player if an audio track is available. Has no effect if the player is already muted.
     */
    __publicField(this, "mute", () => {
      PlayerModule.mute(this.nativeId);
    });
    /**
     * Unmutes the player if it is muted. Has no effect if the player is already unmuted.
     */
    __publicField(this, "unmute", () => {
      PlayerModule.unmute(this.nativeId);
    });
    /**
     * Sets the player's volume between 0 (silent) and 100 (max volume).
     *
     * @param volume - The volume level to set.
     */
    __publicField(this, "setVolume", (volume) => {
      PlayerModule.setVolume(this.nativeId, volume);
    });
    /**
     * @returns The player's current volume level.
     */
    __publicField(this, "getVolume", async () => {
      return PlayerModule.getVolume(this.nativeId);
    });
    /**
     * The playback speed of the player. Slow motion can be achieved by setting the speed to values between 0 and 1,
     * while fast forward is possible with values greater than 1. Values that are less than or equal to zero are ignored.
     *
     * @param speed - The playback speed of the player.
     */
    __publicField(this, "setPlaybackSpeed", (speed) => {
      PlayerModule.setPlaybackSpeed(this.nativeId, speed);
    });
    /**
     * @returns The player's current playback speed.
     */
    __publicField(this, "getPlaybackSpeed", async () => {
      return PlayerModule.getPlaybackSpeed(this.nativeId);
    });
    /**
     * @returns The current playback time in seconds.
     *
     * For VoD streams the returned time ranges between 0 and the duration of the asset.
     *
     * For live streams it can be specified if an absolute UNIX timestamp or a value
     * relative to the playback start should be returned.
     *
     * @param mode - The time mode to specify: an absolute UNIX timestamp ('absolute') or relative time ('relative').
     */
    __publicField(this, "getCurrentTime", async (mode) => {
      return PlayerModule.currentTime(this.nativeId, mode);
    });
    /**
     * @returns The total duration in seconds of the current video or INFINITY if it’s a live stream.
     */
    __publicField(this, "getDuration", async () => {
      return PlayerModule.duration(this.nativeId);
    });
    /**
     * @returns `true` if the player is muted.
     */
    __publicField(this, "isMuted", async () => {
      return PlayerModule.isMuted(this.nativeId);
    });
    /**
     * @returns `true` if the player is currently playing, i.e. has started and is not paused.
     */
    __publicField(this, "isPlaying", async () => {
      return PlayerModule.isPlaying(this.nativeId);
    });
    /**
     * @returns `true` if the player has started playback but it's currently paused.
     */
    __publicField(this, "isPaused", async () => {
      return PlayerModule.isPaused(this.nativeId);
    });
    /**
     * @returns `true` if the displayed video is a live stream.
     */
    __publicField(this, "isLive", async () => {
      return PlayerModule.isLive(this.nativeId);
    });
    /**
     * @remarks Only available for iOS devices.
     * @returns `true` when media is played externally using AirPlay.
     */
    __publicField(this, "isAirPlayActive", async () => {
      if (Platform4.OS === "android") {
        console.warn(
          `[Player ${this.nativeId}] Method isAirPlayActive is not available for Android. Only iOS devices.`
        );
        return false;
      }
      return PlayerModule.isAirPlayActive(this.nativeId);
    });
    /**
     * @remarks Only available for iOS devices.
     * @returns `true` when AirPlay is available.
     */
    __publicField(this, "isAirPlayAvailable", async () => {
      if (Platform4.OS === "android") {
        console.warn(
          `[Player ${this.nativeId}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
        );
        return false;
      }
      return PlayerModule.isAirPlayAvailable(this.nativeId);
    });
    /**
     * @returns An array containing AudioTrack objects for all available audio tracks.
     */
    __publicField(this, "getAvailableAudioTracks", async () => {
      return PlayerModule.getAvailableAudioTracks(this.nativeId);
    });
    /**
     * Sets the audio track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableAudioTracks.
     */
    __publicField(this, "setAudioTrack", async (trackIdentifier) => {
      return PlayerModule.setAudioTrack(this.nativeId, trackIdentifier);
    });
    /**
     * @returns An array containing SubtitleTrack objects for all available subtitle tracks.
     */
    __publicField(this, "getAvailableSubtitles", async () => {
      return PlayerModule.getAvailableSubtitles(this.nativeId);
    });
    /**
     * Sets the subtitle track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableSubtitles.
     */
    __publicField(this, "setSubtitleTrack", async (trackIdentifier) => {
      return PlayerModule.setSubtitleTrack(this.nativeId, trackIdentifier);
    });
    /**
     * Dynamically schedules the `adItem` for playback.
     * Has no effect if there is no active playback session.
     *
     * @param adItem - Ad to be scheduled for playback.
     *
     * @platform iOS, Android
     */
    __publicField(this, "scheduleAd", (adItem) => {
      PlayerModule.scheduleAd(this.nativeId, adItem);
    });
    /**
     * Skips the current ad.
     * Has no effect if the current ad is not skippable or if no ad is being played back.
     *
     * @platform iOS, Android
     */
    __publicField(this, "skipAd", async () => {
      return PlayerModule.skipAd(this.nativeId);
    });
    /**
     * @returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
     * @platform iOS, Android
     */
    __publicField(this, "isAd", async () => {
      return PlayerModule.isAd(this.nativeId);
    });
    /**
     * The current time shift of the live stream in seconds. This value is always 0 if the active `source` is not a
     * live stream or no sources are loaded.
     */
    __publicField(this, "getTimeShift", async () => {
      return PlayerModule.getTimeShift(this.nativeId);
    });
    /**
     * The limit in seconds for time shifting. This value is either negative or 0 and it is always 0 if the active
     * `source` is not a live stream or no sources are loaded.
     */
    __publicField(this, "getMaxTimeShift", async () => {
      return PlayerModule.getMaxTimeShift(this.nativeId);
    });
  }
};
__publicField(Player, "disposeAll", async () => {
  return PlayerModule.disposeAll();
});

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
var ScalingMode = /* @__PURE__ */ ((ScalingMode2) => {
  ScalingMode2["Fit"] = "Fit";
  ScalingMode2["Stretch"] = "Stretch";
  ScalingMode2["Zoom"] = "Zoom";
  return ScalingMode2;
})(ScalingMode || {});
var UserInterfaceType = /* @__PURE__ */ ((UserInterfaceType2) => {
  UserInterfaceType2["Bitmovin"] = "Bitmovin";
  UserInterfaceType2["System"] = "System";
  UserInterfaceType2["Subtitle"] = "Subtitle";
  return UserInterfaceType2;
})(UserInterfaceType || {});

// src/ui/custommessagehandler.ts
var CustomMessageHandler = class {
  /**
   * Android and iOS only.
   *
   * Creates a new `CustomMessageHandler` instance to handle two-way communication between the integation and the Player UI.
   *
   * @param onReceivedSynchronousMessage - A function that will be called when the Player UI sends a synchronous message to the integration.
   * @param onReceivedAsynchronousMessage - A function that will be called when the Player UI sends an asynchronous message to the integration.
   */
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
  /**
   * Android and iOS only.
   *
   * Sends a message to the Player UI.
   *
   * @param message - Identifier for the callback which should be called.
   * @param data - Payload for the callback.
   */
  sendMessage(message, data) {
    this.customMessageSender?.sendMessage(message, data);
  }
};

// src/offline/offlineContentOptions.ts
var OfflineOptionEntryState = /* @__PURE__ */ ((OfflineOptionEntryState2) => {
  OfflineOptionEntryState2["Downloaded"] = "Downloaded";
  OfflineOptionEntryState2["Downloading"] = "Downloading";
  OfflineOptionEntryState2["Suspended"] = "Suspended";
  OfflineOptionEntryState2["NotDownloaded"] = "NotDownloaded";
  return OfflineOptionEntryState2;
})(OfflineOptionEntryState || {});

// src/offline/offlineContentManager.ts
import {
  NativeEventEmitter,
  NativeModules as NativeModules9,
  Platform as Platform5
} from "react-native";

// src/offline/offlineContentManagerListener.ts
var OfflineEventType = /* @__PURE__ */ ((OfflineEventType2) => {
  OfflineEventType2["onCompleted"] = "onCompleted";
  OfflineEventType2["onError"] = "onError";
  OfflineEventType2["onProgress"] = "onProgress";
  OfflineEventType2["onOptionsAvailable"] = "onOptionsAvailable";
  OfflineEventType2["onDrmLicenseUpdated"] = "onDrmLicenseUpdated";
  OfflineEventType2["onDrmLicenseExpired"] = "onDrmLicenseExpired";
  OfflineEventType2["onSuspended"] = "onSuspended";
  OfflineEventType2["onResumed"] = "onResumed";
  OfflineEventType2["onCanceled"] = "onCanceled";
  return OfflineEventType2;
})(OfflineEventType || {});
var handleBitmovinNativeOfflineEvent = (data, listeners) => {
  listeners.forEach((listener) => {
    if (!listener)
      return;
    if (data.eventType === "onCompleted" /* onCompleted */) {
      listener.onCompleted?.(data);
    } else if (data.eventType === "onError" /* onError */) {
      listener.onError?.(data);
    } else if (data.eventType === "onProgress" /* onProgress */) {
      listener.onProgress?.(data);
    } else if (data.eventType === "onOptionsAvailable" /* onOptionsAvailable */) {
      listener.onOptionsAvailable?.(data);
    } else if (data.eventType === "onDrmLicenseUpdated" /* onDrmLicenseUpdated */) {
      listener.onDrmLicenseUpdated?.(data);
    } else if (data.eventType === "onDrmLicenseExpired" /* onDrmLicenseExpired */) {
      listener.onDrmLicenseExpired?.(data);
    } else if (data.eventType === "onSuspended" /* onSuspended */) {
      listener.onSuspended?.(data);
    } else if (data.eventType === "onResumed" /* onResumed */) {
      listener.onResumed?.(data);
    } else if (data.eventType === "onCanceled" /* onCanceled */) {
      listener.onCanceled?.(data);
    }
  });
};

// src/offline/offlineContentManager.ts
var OfflineModule = NativeModules9.BitmovinOfflineModule;
var OfflineContentManager = class extends NativeInstance {
  constructor(config) {
    super(config);
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "eventSubscription");
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    /**
     * Allocates the native `OfflineManager` instance and its resources natively.
     * Registers the `DeviceEventEmitter` listener to receive data from the native `OfflineContentManagerListener` callbacks
     */
    __publicField(this, "initialize", () => {
      let initPromise = Promise.resolve();
      if (!this.isInitialized && this.config) {
        this.eventSubscription = new NativeEventEmitter(
          OfflineModule
        ).addListener(
          "BitmovinOfflineEvent",
          (data) => {
            if (this.nativeId !== data?.nativeId) {
              return;
            }
            handleBitmovinNativeOfflineEvent(data, this.listeners);
          }
        );
        initPromise = OfflineModule.initWithConfig(this.nativeId, {
          identifier: this.config.identifier,
          sourceConfig: this.config.sourceConfig
        });
      }
      this.isInitialized = true;
      return initPromise;
    });
    /**
     * Adds a listener to the receive data from the native `OfflineContentManagerListener` callbacks
     * Returns a function that removes this listener from the `OfflineContentManager` that registered it.
     */
    __publicField(this, "addListener", (listener) => {
      this.listeners.add(listener);
      return () => {
        this.listeners.delete(listener);
      };
    });
    /**
     * Destroys the native `OfflineManager` and releases all of its allocated resources.
     */
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        this.isDestroyed = true;
        this.eventSubscription?.remove?.();
        this.listeners.clear();
        return OfflineModule.release(this.nativeId);
      }
      return Promise.resolve();
    });
    /**
     * Gets the current offline source config of the `OfflineContentManager`
     */
    __publicField(this, "getOfflineSourceConfig", (options) => {
      if (Platform5.OS === "ios") {
        return OfflineModule.getOfflineSourceConfig(this.nativeId, options);
      }
      return OfflineModule.getOfflineSourceConfig(this.nativeId);
    });
    /**
     * Loads the current `OfflineContentOptions`.
     * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
     */
    __publicField(this, "getOptions", () => {
      return OfflineModule.getOptions(this.nativeId);
    });
    /**
     * Enqueues downloads according to the `OfflineDownloadRequest`.
     * The promise will reject in the event of null or invalid request parameters.
     * The promise will reject when selecting an `OfflineOptionEntry` to download that is not compatible with the current state.
     * The promise will resolve when the download has been queued.  The download will is not finished when the promise resolves.
     */
    __publicField(this, "process", (request) => {
      return OfflineModule.process(this.nativeId, request);
    });
    /**
     * Resumes all suspended actions.
     */
    __publicField(this, "resume", () => {
      return OfflineModule.resume(this.nativeId);
    });
    /**
     * Suspends all active actions.
     */
    __publicField(this, "suspend", () => {
      return OfflineModule.suspend(this.nativeId);
    });
    /**
     * Cancels and deletes the active download.
     */
    __publicField(this, "cancelDownload", () => {
      return OfflineModule.cancelDownload(this.nativeId);
    });
    /**
     * Resolves how many bytes of storage are used by the offline content.
     */
    __publicField(this, "usedStorage", () => {
      return OfflineModule.usedStorage(this.nativeId);
    });
    /**
     * Deletes everything related to the related content ID.
     */
    __publicField(this, "deleteAll", () => {
      return OfflineModule.deleteAll(this.nativeId);
    });
    /**
     * Resolves A `DrmLicenseInformation` object containing the remaining drm license duration and the remaining playback duration.
     * The promise will reject if the loading of the DRM key fails.
     * The promise will reject if the provided DRM technology is not supported.
     * The promise will reject if the DRM licensing call to the server fails.
     */
    __publicField(this, "offlineDrmLicenseInformation", () => {
      return OfflineModule.offlineDrmLicenseInformation(this.nativeId);
    });
    /**
     * Downloads the offline license.
     * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
     * Errors are transmitted to the `OfflineContentManagerListener.onError`.
     */
    __publicField(this, "downloadLicense", () => {
      return OfflineModule.downloadLicense(this.nativeId);
    });
    /**
     * Releases the currently held offline license.
     * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
     * Errors are transmitted to the `OfflineContentManagerListener.onError`.
     */
    __publicField(this, "releaseLicense", () => {
      return OfflineModule.releaseLicense(this.nativeId);
    });
    /**
     * Renews the already downloaded DRM license.
     * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
     * Errors are transmitted to the `OfflineContentManagerListener.onError`.
     */
    __publicField(this, "renewOfflineLicense", () => {
      return OfflineModule.renewOfflineLicense(this.nativeId);
    });
  }
};
__publicField(OfflineContentManager, "disposeAll", async () => {
  return OfflineModule.disposeAll();
});
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
  handleBitmovinNativeOfflineEvent,
  usePlayer
};
