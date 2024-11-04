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

// src/analytics/player.ts
import { NativeModules } from "react-native";
var PlayerAnalyticsModule = NativeModules.PlayerAnalyticsModule;
var AnalyticsApi = class {
  constructor(playerId) {
    /**
     * The native player id that this analytics api is attached to.
     */
    __publicField(this, "playerId");
    /**
     * Sends a sample with the provided custom data.
     * Does not change the configured custom data of the collector or source.
     */
    __publicField(this, "sendCustomDataEvent", (customData) => {
      PlayerAnalyticsModule.sendCustomDataEvent(this.playerId, customData);
    });
    /**
     * Gets the current user id used by the bundled analytics instance.
     *
     * @returns The current user id.
     */
    __publicField(this, "getUserId", async () => {
      return PlayerAnalyticsModule.getUserId(this.playerId);
    });
    this.playerId = playerId;
  }
};

// src/audioSession.ts
import { NativeModules as NativeModules2 } from "react-native";
var AudioSessionModule = NativeModules2.AudioSessionModule;
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
import { NativeModules as NativeModules3 } from "react-native";
import BatchedBridge from "react-native/Libraries/BatchedBridge/BatchedBridge";
var Uuid = NativeModules3.UuidModule;
var FullscreenHandlerModule = NativeModules3.FullscreenHandlerModule;
var FullscreenHandlerBridge = class {
  constructor(nativeId) {
    __publicField(this, "nativeId");
    __publicField(this, "fullscreenHandler");
    __publicField(this, "isDestroyed");
    this.nativeId = nativeId ?? Uuid.generate();
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
import { NativeModules as NativeModules4 } from "react-native";
import BatchedBridge2 from "react-native/Libraries/BatchedBridge/BatchedBridge";
var Uuid2 = NativeModules4.UuidModule;
var CustomMessageHandlerModule = NativeModules4.CustomMessageHandlerModule;
var CustomMessageHandlerBridge = class {
  constructor(nativeId) {
    __publicField(this, "nativeId");
    __publicField(this, "customMessageHandler");
    __publicField(this, "isDestroyed");
    this.nativeId = nativeId ?? Uuid2.generate();
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
   * @internal
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
   * @internal
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
  viewRef,
  style,
  player,
  config,
  fullscreenHandler,
  customMessageHandler,
  isFullscreenRequested = false,
  scalingMode,
  isPictureInPictureRequested = false,
  ...props
}) {
  const workaroundViewManagerCommandNotSent = useCallback2(() => {
    setTimeout(() => player.getDuration(), 100);
  }, [player]);
  const nativeView = useRef(viewRef?.current || null);
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
  useEffect(() => {
    const node = findNodeHandle2(nativeView.current);
    if (node && scalingMode) {
      dispatch("setScalingMode", node, scalingMode);
    }
  }, [scalingMode, nativeView]);
  useEffect(() => {
    const node = findNodeHandle2(nativeView.current);
    if (node) {
      dispatch("setPictureInPicture", node, isPictureInPictureRequested);
    }
  }, [isPictureInPictureRequested, nativeView]);
  useEffect(() => {
    if (viewRef) {
      viewRef.current = nativeView.current;
    }
  }, [viewRef, nativeView]);
  return /* @__PURE__ */ React.createElement(
    NativePlayerView,
    {
      ref: nativeView,
      style: nativeViewStyle,
      fullscreenBridge: fullscreenBridge.current,
      customMessageHandlerBridge: customMessageHandlerBridge.current,
      config,
      onBmpAdBreakFinished: proxy(props.onAdBreakFinished),
      onBmpAdBreakStarted: proxy(props.onAdBreakStarted),
      onBmpAdClicked: proxy(props.onAdClicked),
      onBmpAdError: proxy(props.onAdError),
      onBmpAdFinished: proxy(props.onAdFinished),
      onBmpAdManifestLoad: proxy(props.onAdManifestLoad),
      onBmpAdManifestLoaded: proxy(props.onAdManifestLoaded),
      onBmpAdQuartile: proxy(props.onAdQuartile),
      onBmpAdScheduled: proxy(props.onAdScheduled),
      onBmpAdSkipped: proxy(props.onAdSkipped),
      onBmpAdStarted: proxy(props.onAdStarted),
      onBmpCastAvailable: proxy(props.onCastAvailable),
      onBmpCastPaused: proxy(props.onCastPaused),
      onBmpCastPlaybackFinished: proxy(props.onCastPlaybackFinished),
      onBmpCastPlaying: proxy(props.onCastPlaying),
      onBmpCastStarted: proxy(props.onCastStarted),
      onBmpCastStart: proxy(props.onCastStart),
      onBmpCastStopped: proxy(props.onCastStopped),
      onBmpCastTimeUpdated: proxy(props.onCastTimeUpdated),
      onBmpCastWaitingForDevice: proxy(props.onCastWaitingForDevice),
      onBmpCueEnter: proxy(props.onCueEnter),
      onBmpCueExit: proxy(props.onCueExit),
      onBmpDestroy: proxy(props.onDestroy),
      onBmpEvent: proxy(props.onEvent),
      onBmpFullscreenEnabled: proxy(props.onFullscreenEnabled),
      onBmpFullscreenDisabled: proxy(props.onFullscreenDisabled),
      onBmpFullscreenEnter: proxy(props.onFullscreenEnter),
      onBmpFullscreenExit: proxy(props.onFullscreenExit),
      onBmpMuted: proxy(props.onMuted),
      onBmpPaused: proxy(props.onPaused),
      onBmpPictureInPictureAvailabilityChanged: proxy(
        props.onPictureInPictureAvailabilityChanged
      ),
      onBmpPictureInPictureEnter: proxy(props.onPictureInPictureEnter),
      onBmpPictureInPictureEntered: proxy(props.onPictureInPictureEntered),
      onBmpPictureInPictureExit: proxy(props.onPictureInPictureExit),
      onBmpPictureInPictureExited: proxy(props.onPictureInPictureExited),
      onBmpPlay: proxy(props.onPlay),
      onBmpPlaybackFinished: proxy(props.onPlaybackFinished),
      onBmpPlaybackSpeedChanged: proxy(props.onPlaybackSpeedChanged),
      onBmpPlayerActive: proxy(props.onPlayerActive),
      onBmpPlayerError: proxy(props.onPlayerError),
      onBmpPlayerWarning: proxy(props.onPlayerWarning),
      onBmpPlaying: proxy(props.onPlaying),
      onBmpReady: proxy(props.onReady),
      onBmpSeek: proxy(props.onSeek),
      onBmpSeeked: proxy(props.onSeeked),
      onBmpTimeShift: proxy(props.onTimeShift),
      onBmpTimeShifted: proxy(props.onTimeShifted),
      onBmpStallStarted: proxy(props.onStallStarted),
      onBmpStallEnded: proxy(props.onStallEnded),
      onBmpSourceError: proxy(props.onSourceError),
      onBmpSourceLoad: proxy(props.onSourceLoad),
      onBmpSourceLoaded: proxy(props.onSourceLoaded),
      onBmpSourceUnloaded: proxy(props.onSourceUnloaded),
      onBmpSourceWarning: proxy(props.onSourceWarning),
      onBmpAudioAdded: proxy(props.onAudioAdded),
      onBmpAudioChanged: proxy(props.onAudioChanged),
      onBmpAudioRemoved: proxy(props.onAudioRemoved),
      onBmpSubtitleAdded: proxy(props.onSubtitleAdded),
      onBmpSubtitleChanged: proxy(props.onSubtitleChanged),
      onBmpSubtitleRemoved: proxy(props.onSubtitleRemoved),
      onBmpTimeChanged: proxy(props.onTimeChanged),
      onBmpUnmuted: proxy(props.onUnmuted),
      onBmpVideoDownloadQualityChanged: proxy(
        props.onVideoDownloadQualityChanged
      ),
      onBmpVideoPlaybackQualityChanged: proxy(
        props.onVideoPlaybackQualityChanged
      ),
      onBmpDownloadFinished: proxy(props.onDownloadFinished)
    }
  );
}

// src/components/PlayerView/playerViewConfig.ts
var Variant = class {
  /**
   * Specifies the function name that will be used to initialize the `UIManager`
   * for the Bitmovin Player Web UI.
   *
   * The function is called on the `window` object with the `Player` as the first argument and
   * the `UIConfig` as the second argument.
   *
   * Example:
   * When you added a new function or want to use a different function of our `UIFactory`,
   * you can specify the full qualifier name including namespaces.
   * e.g. `bitmovin.playerui.UIFactory.buildDefaultSmallScreenUI` for the SmallScreenUi.
   * @see UIFactory https://github.com/bitmovin/bitmovin-player-ui/blob/develop/src/ts/uifactory.ts#L60
   *
   * Notes:
   * - It's not necessary to use our `UIFactory`. Any static function can be specified.
   */
  constructor(uiManagerFactoryFunction) {
    this.uiManagerFactoryFunction = uiManagerFactoryFunction;
  }
};
var SmallScreenUi = class extends Variant {
  constructor() {
    super("bitmovin.playerui.UIFactory.buildDefaultSmallScreenUI");
  }
};
var TvUi = class extends Variant {
  constructor() {
    super("bitmovin.playerui.UIFactory.buildDefaultTvUI");
  }
};
var CustomUi = class extends Variant {
  constructor(uiManagerFactoryFunction) {
    super(uiManagerFactoryFunction);
  }
};

// src/drm/index.ts
import { NativeModules as NativeModules6, Platform as Platform2 } from "react-native";
import BatchedBridge3 from "react-native/Libraries/BatchedBridge/BatchedBridge";

// src/nativeInstance.ts
import { NativeModules as NativeModules5 } from "react-native";
var Uuid3 = NativeModules5.UuidModule;
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
    this.nativeId = config?.nativeId ?? Uuid3.generate();
  }
};

// src/drm/index.ts
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
      const config = Platform2.OS === "ios" ? this.config?.fairplay : this.config?.widevine;
      if (config && config.prepareMessage) {
        DrmModule.setPreparedMessage(
          this.nativeId,
          Platform2.OS === "ios" ? config.prepareMessage?.(message, assetId) : config.prepareMessage?.(message)
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
      const prepareLicense = Platform2.OS === "ios" ? this.config?.fairplay?.prepareLicense : this.config?.widevine?.prepareLicense;
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
import { NativeModules as NativeModules10, Platform as Platform3 } from "react-native";

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
var TimelineReferencePoint = /* @__PURE__ */ ((TimelineReferencePoint2) => {
  TimelineReferencePoint2["START"] = "start";
  TimelineReferencePoint2["END"] = "end";
  return TimelineReferencePoint2;
})(TimelineReferencePoint || {});
var Source = class extends NativeInstance {
  constructor() {
    super(...arguments);
    /**
     * The native DRM config reference of this source.
     */
    __publicField(this, "drm");
    /**
     * The remote control config for this source.
     * This is only supported on iOS.
     *
     * @platform iOS
     */
    __publicField(this, "remoteControl", null);
    /**
     * Whether the native {@link Source} object has been created.
     */
    __publicField(this, "isInitialized", false);
    /**
     * Whether the native {@link Source} object has been disposed.
     */
    __publicField(this, "isDestroyed", false);
    /**
     * Allocates the native {@link Source} instance and its resources natively.
     */
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        const sourceMetadata = this.config?.analyticsSourceMetadata;
        if (this.config?.drmConfig) {
          this.drm = new Drm(this.config.drmConfig);
          this.drm.initialize();
        }
        if (sourceMetadata) {
          SourceModule.initWithAnalyticsConfig(
            this.nativeId,
            this.drm?.nativeId,
            this.config,
            this.remoteControl,
            sourceMetadata
          );
        } else {
          SourceModule.initWithConfig(
            this.nativeId,
            this.drm?.nativeId,
            this.config,
            this.remoteControl
          );
        }
        this.isInitialized = true;
      }
    });
    /**
     * Destroys the native {@link Source} and releases all of its allocated resources.
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
     *
     * @param metadata metadata to be set.
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
    /**
     * @returns a `Thumbnail` for the specified playback time if available.
     * Supported thumbnail formats are:
     * - `WebVtt` configured via {@link SourceConfig.thumbnailTrack}, on all supported platforms
     * - HLS `Image Media Playlist` in the multivariant playlist, Android-only
     * - DASH `Image Adaptation Set` as specified in DASH-IF IOP, Android-only
     * If a `WebVtt` thumbnail track is provided, any potential in-manifest thumbnails are ignored on Android.
     *
     * @param time - The time in seconds for which to retrieve the thumbnail.
     */
    __publicField(this, "getThumbnail", async (time) => {
      return SourceModule.getThumbnail(this.nativeId, time);
    });
  }
};

// src/bufferApi.ts
import { NativeModules as NativeModules8 } from "react-native";
var BufferModule = NativeModules8.BufferModule;
var MediaType = /* @__PURE__ */ ((MediaType2) => {
  MediaType2["AUDIO"] = "audio";
  MediaType2["VIDEO"] = "video";
  return MediaType2;
})(MediaType || {});
var BufferType = /* @__PURE__ */ ((BufferType2) => {
  BufferType2["FORWARD_DURATION"] = "forwardDuration";
  BufferType2["BACKWARD_DURATION"] = "backwardDuration";
  return BufferType2;
})(BufferType || {});
var BufferApi = class {
  constructor(playerId) {
    /**
     * The native player id that this buffer api is attached to.
     */
    __publicField(this, "nativeId");
    /**
     * Gets the {@link BufferLevel|buffer level} from the Player
     * @param type The {@link BufferType} to return the level for.
     * @returns a {@link BufferLevels} that contains {@link BufferLevel} values for audio and video.
     */
    __publicField(this, "getLevel", async (type) => {
      return BufferModule.getLevel(this.nativeId, type);
    });
    /**
     * Sets the target buffer level for the chosen buffer {@link BufferType} across all {@link MediaType} options.
     *
     * @param type The {@link BufferType} to set the target level for. On iOS and tvOS, only {@link BufferType.FORWARD_DURATION} is supported.
     * @param value The value to set. On iOS and tvOS when passing `0`, the player will choose an appropriate forward buffer duration suitable for most use-cases. On Android setting to `0` will have no effect.
     */
    __publicField(this, "setTargetLevel", async (type, value) => {
      return BufferModule.setTargetLevel(this.nativeId, type, value);
    });
    this.nativeId = playerId;
  }
};

// src/network/index.ts
import { NativeModules as NativeModules9 } from "react-native";
import BatchedBridge4 from "react-native/Libraries/BatchedBridge/BatchedBridge";

// src/network/networkConfig.ts
var HttpRequestType = /* @__PURE__ */ ((HttpRequestType2) => {
  HttpRequestType2["ManifestDash"] = "manifest/dash";
  HttpRequestType2["ManifestHlsMaster"] = "manifest/hls/master";
  HttpRequestType2["ManifestHlsVariant"] = "manifest/hls/variant";
  HttpRequestType2["ManifestSmooth"] = "manifest/smooth";
  HttpRequestType2["MediaProgressive"] = "media/progressive";
  HttpRequestType2["MediaAudio"] = "media/audio";
  HttpRequestType2["MediaVideo"] = "media/video";
  HttpRequestType2["MediaSubtitles"] = "media/subtitles";
  HttpRequestType2["MediaThumbnails"] = "media/thumbnails";
  HttpRequestType2["DrmLicenseFairplay"] = "drm/license/fairplay";
  HttpRequestType2["DrmCertificateFairplay"] = "drm/certificate/fairplay";
  HttpRequestType2["DrmLicenseWidevine"] = "drm/license/widevine";
  HttpRequestType2["KeyHlsAes"] = "key/hls/aes";
  HttpRequestType2["Unknown"] = "unknown";
  return HttpRequestType2;
})(HttpRequestType || {});

// src/network/index.ts
var NetworkModule = NativeModules9.NetworkModule;
var Network = class extends NativeInstance {
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
     * Allocates the Network config instance and its resources natively.
     */
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        BatchedBridge4.registerCallableModule(`Network-${this.nativeId}`, this);
        NetworkModule.initWithConfig(this.nativeId, this.config);
        this.isInitialized = true;
      }
    });
    /**
     * Destroys the native Network config and releases all of its allocated resources.
     */
    __publicField(this, "destroy", () => {
      if (!this.isDestroyed) {
        NetworkModule.destroy(this.nativeId);
        this.isDestroyed = true;
      }
    });
    /**
     * Applies the user-defined `preprocessHttpRequest` function to native's `type` and `request` data and store
     * the result back in `NetworkModule`.
     *
     * Called from native code when `NetworkConfig.preprocessHttpRequest` is dispatched.
     *
     * @param requestId Passed through to identify the completion handler of the request on native.
     * @param type Type of the request to be made.
     * @param request The HTTP request to process.
     */
    __publicField(this, "onPreprocessHttpRequest", (requestId, type, request) => {
      this.config?.preprocessHttpRequest?.(type, request).then((resultRequest) => {
        NetworkModule.setPreprocessedHttpRequest(requestId, resultRequest);
      }).catch(() => {
        NetworkModule.setPreprocessedHttpRequest(requestId, request);
      });
    });
    /**
     * Applies the user-defined `preprocessHttpResponse` function to native's `type` and `response` data and store
     * the result back in `NetworkModule`.
     *
     * Called from native code when `NetworkConfig.preprocessHttpResponse` is dispatched.
     *
     * @param responseId Passed through to identify the completion handler of the response on native.
     * @param type Type of the request to be made.
     * @param response The HTTP response to process.
     */
    __publicField(this, "onPreprocessHttpResponse", (responseId, type, response) => {
      this.config?.preprocessHttpResponse?.(type, response).then((resultResponse) => {
        NetworkModule.setPreprocessedHttpResponse(responseId, resultResponse);
      }).catch(() => {
        NetworkModule.setPreprocessedHttpResponse(responseId, response);
      });
    });
  }
};

// src/player.ts
var PlayerModule = NativeModules10.PlayerModule;
var Player = class extends NativeInstance {
  constructor() {
    super(...arguments);
    __publicField(this, "network");
    /**
     * Currently active source, or `null` if none is active.
     */
    __publicField(this, "source");
    /**
     * Whether the native `Player` object has been created.
     */
    __publicField(this, "isInitialized", false);
    /**
     * Whether the native `Player` object has been disposed.
     */
    __publicField(this, "isDestroyed", false);
    /**
     * The `AnalyticsApi` for interactions regarding the `Player`'s analytics.
     *
     * `undefined` if the player was created without analytics support.
     */
    __publicField(this, "analytics");
    /**
     * The {@link BufferApi} for interactions regarding the buffer.
     */
    __publicField(this, "buffer", new BufferApi(this.nativeId));
    /**
     * Allocates the native `Player` instance and its resources natively.
     */
    __publicField(this, "initialize", () => {
      if (!this.isInitialized) {
        if (this.config?.networkConfig) {
          this.network = new Network(this.config.networkConfig);
          this.network.initialize();
        }
        const analyticsConfig = this.config?.analyticsConfig;
        if (analyticsConfig) {
          PlayerModule.initWithAnalyticsConfig(
            this.nativeId,
            this.config,
            this.network?.nativeId,
            analyticsConfig
          );
          this.analytics = new AnalyticsApi(this.nativeId);
        } else {
          PlayerModule.initWithConfig(
            this.nativeId,
            this.config,
            this.network?.nativeId
          );
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
        this.network?.destroy();
        this.isDestroyed = true;
      }
    });
    /**
     * Loads a new {@link Source} from `sourceConfig` into the player.
     */
    __publicField(this, "load", (sourceConfig) => {
      this.loadSource(new Source(sourceConfig));
    });
    /**
     * Loads the downloaded content from {@link OfflineContentManager} into the player.
     */
    __publicField(this, "loadOfflineContent", (offlineContentManager, options) => {
      PlayerModule.loadOfflineContent(
        this.nativeId,
        offlineContentManager.nativeId,
        options
      );
    });
    /**
     * Loads the given {@link Source} into the player.
     */
    __publicField(this, "loadSource", (source) => {
      source.initialize();
      this.source = source;
      PlayerModule.loadSource(this.nativeId, source.nativeId);
    });
    /**
     * Unloads all {@link Source}s from the player.
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
     *
     * @param offset - Target offset from the live edge in seconds.
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
     * @returns The current playback time in seconds.
     *
     * For VoD streams the returned time ranges between 0 and the duration of the asset.
     *
     * For live streams it can be specified if an absolute UNIX timestamp or a value
     * relative to the playback start should be returned.
     *
     * @param mode - The time mode to specify: an absolute UNIX timestamp ('absolute') or relative time ('relative').
     */
    __publicField(this, "getCurrentTime", async (mode = "absolute") => {
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
      if (Platform3.OS === "android") {
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
      if (Platform3.OS === "android") {
        console.warn(
          `[Player ${this.nativeId}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
        );
        return false;
      }
      return PlayerModule.isAirPlayAvailable(this.nativeId);
    });
    /**
     * @returns The currently selected audio track or `null`.
     */
    __publicField(this, "getAudioTrack", async () => {
      return PlayerModule.getAudioTrack(this.nativeId);
    });
    /**
     * @returns An array containing {@link AudioTrack} objects for all available audio tracks.
     */
    __publicField(this, "getAvailableAudioTracks", async () => {
      return PlayerModule.getAvailableAudioTracks(this.nativeId);
    });
    /**
     * Sets the audio track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableAudioTracks.
     *
     * @param trackIdentifier - The {@link AudioTrack.identifier} to be set.
     */
    __publicField(this, "setAudioTrack", async (trackIdentifier) => {
      return PlayerModule.setAudioTrack(this.nativeId, trackIdentifier);
    });
    /**
     * @returns The currently selected {@link SubtitleTrack} or `null`.
     */
    __publicField(this, "getSubtitleTrack", async () => {
      return PlayerModule.getSubtitleTrack(this.nativeId);
    });
    /**
     * @returns An array containing SubtitleTrack objects for all available subtitle tracks.
     */
    __publicField(this, "getAvailableSubtitles", async () => {
      return PlayerModule.getAvailableSubtitles(this.nativeId);
    });
    /**
     * Sets the subtitle track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableSubtitles.
     *
     * @param trackIdentifier - The {@link SubtitleTrack.identifier} to be set.
     */
    __publicField(this, "setSubtitleTrack", async (trackIdentifier) => {
      return PlayerModule.setSubtitleTrack(this.nativeId, trackIdentifier);
    });
    /**
     * Dynamically schedules the {@link AdItem} for playback.
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
    __publicField(this, "skipAd", () => {
      PlayerModule.skipAd(this.nativeId);
    });
    /**
     * @returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
     * @platform iOS, Android
     */
    __publicField(this, "isAd", async () => {
      return PlayerModule.isAd(this.nativeId);
    });
    /**
     * The current time shift of the live stream in seconds. This value is always 0 if the active {@link Source} is not a
     * live stream or no sources are loaded.
     */
    __publicField(this, "getTimeShift", async () => {
      return PlayerModule.getTimeShift(this.nativeId);
    });
    /**
     * The limit in seconds for time shifting. This value is either negative or 0 and it is always 0 if the active
     * {@link Source} is not a live stream or no sources are loaded.
     */
    __publicField(this, "getMaxTimeShift", async () => {
      return PlayerModule.getMaxTimeShift(this.nativeId);
    });
    /**
     * Sets the upper bitrate boundary for video qualities. All qualities with a bitrate
     * that is higher than this threshold will not be eligible for automatic quality selection.
     *
     * Can be set to `null` for no limitation.
     */
    __publicField(this, "setMaxSelectableBitrate", (bitrate) => {
      PlayerModule.setMaxSelectableBitrate(this.nativeId, bitrate || -1);
    });
    /**
     * @returns a {@link Thumbnail} for the specified playback time for the currently active source if available.
     * Supported thumbnail formats are:
     * - `WebVtt` configured via {@link SourceConfig.thumbnailTrack}, on all supported platforms
     * - HLS `Image Media Playlist` in the multivariant playlist, Android-only
     * - DASH `Image Adaptation Set` as specified in DASH-IF IOP, Android-only
     * If a `WebVtt` thumbnail track is provided, any potential in-manifest thumbnails are ignored on Android.
     *
     * @param time - The time in seconds for which to retrieve the thumbnail.
     */
    __publicField(this, "getThumbnail", async (time) => {
      return PlayerModule.getThumbnail(this.nativeId, time);
    });
    /**
     * Whether casting to a cast-compatible remote device is available. {@link CastAvailableEvent} signals when
     * casting becomes available.
     *
     * @platform iOS, Android
     */
    __publicField(this, "isCastAvailable", async () => {
      return PlayerModule.isCastAvailable(this.nativeId);
    });
    /**
     * Whether video is currently being casted to a remote device and not played locally.
     *
     * @platform iOS, Android
     */
    __publicField(this, "isCasting", async () => {
      return PlayerModule.isCasting(this.nativeId);
    });
    /**
     * Initiates casting the current video to a cast-compatible remote device. The user has to choose to which device it
     * should be sent.
     *
     * @platform iOS, Android
     */
    __publicField(this, "castVideo", () => {
      PlayerModule.castVideo(this.nativeId);
    });
    /**
     * Stops casting the current video. Has no effect if {@link Player.isCasting} is `false`.
     *
     * @platform iOS, Android
     */
    __publicField(this, "castStop", () => {
      PlayerModule.castStop(this.nativeId);
    });
    /**
     * Returns the currently selected video quality.
     * @returns The currently selected video quality.
     */
    __publicField(this, "getVideoQuality", async () => {
      return PlayerModule.getVideoQuality(this.nativeId);
    });
    /**
     * Returns an array containing all available video qualities the player can adapt between.
     * @returns An array containing all available video qualities the player can adapt between.
     */
    __publicField(this, "getAvailableVideoQualities", async () => {
      return PlayerModule.getAvailableVideoQualities(this.nativeId);
    });
    /**
     * Sets the video quality.
     * @remarks Only available on Android.
     * @platform Android
     *
     * @param qualityId value obtained from {@link VideoQuality}'s `id` property, which can be obtained via `Player.getAvailableVideoQualities()` to select a specific quality. To use automatic quality selection, 'auto' can be passed here.
     */
    __publicField(this, "setVideoQuality", (qualityId) => {
      if (Platform3.OS !== "android") {
        console.warn(
          `[Player ${this.nativeId}] Method setVideoQuality is not available for iOS and tvOS devices. Only Android devices.`
        );
        return;
      }
      PlayerModule.setVideoQuality(this.nativeId, qualityId);
    });
    /**
     * Sets the playback speed of the player. Fast forward, slow motion and reverse playback are supported.
     * @note
     * - Slow motion is indicated by values between `0` and `1`.
     * - Fast forward by values greater than `1`.
     * - Slow reverse is used by values between `0` and `-1`, and fast reverse is used by values less than `-1`. iOS and tvOS only.
     * @note
     * Negative values are ignored during Casting and on Android.
     * @note
     * During reverse playback the playback will continue until the beginning of the active source is
     * reached. When reaching the beginning of the source, playback will be paused and the playback
     * speed will be reset to its default value of `1`. No {@link PlaybackFinishedEvent} will be
     * emitted in this case.
     *
     * @param playbackSpeed - The playback speed to set.
     */
    __publicField(this, "setPlaybackSpeed", (playbackSpeed) => {
      PlayerModule.setPlaybackSpeed(this.nativeId, playbackSpeed);
    });
    /**
     * @see {@link setPlaybackSpeed} for details on which values playback speed can assume.
     * @returns The player's current playback speed.
     */
    __publicField(this, "getPlaybackSpeed", async () => {
      return PlayerModule.getPlaybackSpeed(this.nativeId);
    });
    /**
     * Checks the possibility to play the media at specified playback speed.
     * @param playbackSpeed - The playback speed to check.
     * @returns `true` if it's possible to play the media at the specified playback speed, otherwise `false`. On Android it always returns `undefined`.
     * @platform iOS, tvOS
     */
    __publicField(this, "canPlayAtPlaybackSpeed", async (playbackSpeed) => {
      if (Platform3.OS === "android") {
        console.warn(
          `[Player ${this.nativeId}] Method canPlayAtPlaybackSpeed is not available for Android. Only iOS and tvOS devices.`
        );
        return void 0;
      }
      return PlayerModule.canPlayAtPlaybackSpeed(this.nativeId, playbackSpeed);
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
  SubtitleFormat2["SRT"] = "srt";
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
   * @param options - Configuration options for the `CustomMessageHandler` instance.
   */
  constructor({
    onReceivedSynchronousMessage,
    onReceivedAsynchronousMessage
  }) {
    __publicField(this, "onReceivedSynchronousMessage");
    __publicField(this, "onReceivedAsynchronousMessage");
    /** @internal */
    __publicField(this, "customMessageSender");
    this.onReceivedSynchronousMessage = onReceivedSynchronousMessage;
    this.onReceivedAsynchronousMessage = onReceivedAsynchronousMessage;
  }
  /**
   * Gets called when a synchronous message was received from the Bitmovin Web UI.
   *
   * @param message Identifier of the message.
   * @param data Optional data of the message as string (can be a serialized object).
   * @returns Optional return value as string which will be propagates back to the JS counterpart.
   */
  receivedSynchronousMessage(message, data) {
    return this.onReceivedSynchronousMessage(message, data);
  }
  /**
   * Gets called when an asynchronous message was received from the Bitmovin Web UI.
   *
   * @param message Identifier of the message.
   * @param data Optional data of the message as string (can be a serialized object).
   */
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

// src/offline/offlineState.ts
var OfflineState = /* @__PURE__ */ ((OfflineState2) => {
  OfflineState2["Downloaded"] = "Downloaded";
  OfflineState2["Downloading"] = "Downloading";
  OfflineState2["Suspended"] = "Suspended";
  OfflineState2["NotDownloaded"] = "NotDownloaded";
  return OfflineState2;
})(OfflineState || {});

// src/offline/offlineContentManager.ts
import {
  NativeEventEmitter,
  NativeModules as NativeModules11
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

// src/offline/offlineContentManager.ts
var OfflineModule = NativeModules11.BitmovinOfflineModule;
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
var OfflineContentManager = class extends NativeInstance {
  constructor(config) {
    super(config);
    __publicField(this, "isInitialized", false);
    __publicField(this, "isDestroyed", false);
    __publicField(this, "eventSubscription");
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "drm");
    /**
     * Allocates the native `OfflineManager` instance and its resources natively.
     * Registers the `DeviceEventEmitter` listener to receive data from the native `OfflineContentManagerListener` callbacks
     */
    __publicField(this, "initialize", async () => {
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
        if (this.config.sourceConfig.drmConfig) {
          this.drm = new Drm(this.config.sourceConfig.drmConfig);
          this.drm.initialize();
        }
        initPromise = OfflineModule.initWithConfig(
          this.nativeId,
          {
            identifier: this.config.identifier,
            sourceConfig: this.config.sourceConfig
          },
          this.drm?.nativeId
        );
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
    __publicField(this, "destroy", async () => {
      if (!this.isDestroyed) {
        this.isDestroyed = true;
        this.eventSubscription?.remove?.();
        this.listeners.clear();
        this.drm?.destroy();
        return OfflineModule.release(this.nativeId);
      }
      return Promise.resolve();
    });
    /**
     * Gets the current state of the `OfflineContentManager`
     */
    __publicField(this, "state", async () => {
      return OfflineModule.getState(this.nativeId);
    });
    /**
     * Loads the current `OfflineContentOptions`.
     * When the options are loaded the data will be passed to the `OfflineContentManagerListener.onOptionsAvailable`.
     */
    __publicField(this, "getOptions", async () => {
      return OfflineModule.getOptions(this.nativeId);
    });
    /**
     * Enqueues downloads according to the `OfflineDownloadRequest`.
     * The promise will reject in the event of null or invalid request parameters.
     * The promise will reject when calling this method when download has already started or is completed.
     * The promise will resolve when the download has been queued. The download will is not finished when the promise resolves.
     */
    __publicField(this, "download", async (request) => {
      return OfflineModule.download(this.nativeId, request);
    });
    /**
     * Resumes all suspended actions.
     */
    __publicField(this, "resume", async () => {
      return OfflineModule.resume(this.nativeId);
    });
    /**
     * Suspends all active actions.
     */
    __publicField(this, "suspend", async () => {
      return OfflineModule.suspend(this.nativeId);
    });
    /**
     * Cancels and deletes the active download.
     */
    __publicField(this, "cancelDownload", async () => {
      return OfflineModule.cancelDownload(this.nativeId);
    });
    /**
     * Resolves how many bytes of storage are used by the offline content.
     */
    __publicField(this, "usedStorage", async () => {
      return OfflineModule.usedStorage(this.nativeId);
    });
    /**
     * Deletes everything related to the related content ID.
     */
    __publicField(this, "deleteAll", async () => {
      return OfflineModule.deleteAll(this.nativeId);
    });
    /**
     * Downloads the offline license.
     * When finished successfully, data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
     * Errors are transmitted to the `OfflineContentManagerListener.onError`.
     */
    __publicField(this, "downloadLicense", async () => {
      return OfflineModule.downloadLicense(this.nativeId);
    });
    /**
     * Releases the currently held offline license.
     * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
     * Errors are transmitted to the `OfflineContentManagerListener.onError`.
     *
     * @platform Android
     */
    __publicField(this, "releaseLicense", async () => {
      return OfflineModule.releaseLicense(this.nativeId);
    });
    /**
     * Renews the already downloaded DRM license.
     * When finished successfully data will be passed to the `OfflineContentManagerListener.onDrmLicenseUpdated`.
     * Errors are transmitted to the `OfflineContentManagerListener.onError`.
     */
    __publicField(this, "renewOfflineLicense", async () => {
      return OfflineModule.renewOfflineLicense(this.nativeId);
    });
  }
};
__publicField(OfflineContentManager, "disposeAll", async () => {
  return OfflineModule.disposeAll();
});

// src/bitmovinCastManager.ts
import { NativeModules as NativeModules12, Platform as Platform4 } from "react-native";
var BitmovinCastManagerModule = NativeModules12.BitmovinCastManagerModule;
var BitmovinCastManager = {
  /**
   * Returns whether the `BitmovinCastManager` is initialized.
   * @returns A promise that resolves with a boolean indicating whether the `BitmovinCastManager` is initialized
   */
  isInitialized: async () => {
    if (Platform4.OS === "ios" && Platform4.isTV) {
      return false;
    }
    return BitmovinCastManagerModule.isInitialized();
  },
  /**
   * Initialize `BitmovinCastManager` based on the provided `BitmovinCastManagerOptions`.
   * This method needs to be called before `Player` creation to enable casting features.
   * If no options are provided, the default options will be used.
   *
   * IMPORTANT: This should only be called when the Google Cast SDK is available in the application.
   *
   * @param options The options to be used for initializing `BitmovinCastManager`
   * @returns A promise that resolves when the `BitmovinCastManager` was initialized successfully
   */
  initialize: async (options = null) => {
    if (Platform4.OS === "ios" && Platform4.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.initializeCastManager(options);
  },
  /**
   * Must be called in every Android Activity to update the context to the current one.
   * Make sure to call this method on every Android Activity switch.
   *
   * @returns A promise that resolves when the context was updated successfully
   * @platform Android
   */
  updateContext: async () => {
    if (Platform4.OS === "ios") {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.updateContext();
  },
  /**
   * Sends the given message to the cast receiver.
   *
   * @param message The message to be sent
   * @param messageNamespace The message namespace to be used, in case of null the default message namespace will be used
   * @returns A promise that resolves when the message was sent successfully
   */
  sendMessage: (message, messageNamespace = null) => {
    if (Platform4.OS === "ios" && Platform4.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.sendMessage(message, messageNamespace);
  },
  /**
   * Opens the cast dialog, for selecting and starting a cast session.
   *
   * @returns A promise that resolves when the dialog has requested to be opened
   */
  showDialog: async () => {
    if (Platform4.OS === "ios" && Platform4.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.showDialog();
  },
  /**
   * Disconnects from the current cast session.
   *
   * @returns A promise that resolves when the call to disconnect has finished
   */
  disconnect: async () => {
    if (Platform4.OS === "ios" && Platform4.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.disconnect();
  }
};
export {
  AdQuartile,
  AdSourceType,
  AnalyticsApi,
  AudioSession,
  BitmovinCastManager,
  BufferApi,
  BufferType,
  CustomMessageHandler,
  CustomUi,
  Drm,
  HttpRequestType,
  LoadingState,
  MediaType,
  Network,
  OfflineContentManager,
  OfflineEventType,
  OfflineState,
  Player,
  PlayerView,
  ScalingMode,
  SmallScreenUi,
  Source,
  SourceType,
  SubtitleFormat,
  TimelineReferencePoint,
  TvUi,
  UserInterfaceType,
  Variant,
  usePlayer
};
