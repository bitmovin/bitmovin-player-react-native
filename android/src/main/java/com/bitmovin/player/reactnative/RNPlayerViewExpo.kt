package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.os.Build
import android.view.View.MeasureSpec
import android.view.ViewGroup
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.bitmovin.player.PlayerView
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toUserInterfaceType
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class RNPlayerViewExpo(context: android.content.Context, appContext: AppContext) : ExpoView(context, appContext) {
    var playerView: PlayerView? = null
        private set
    private var subtitleView: SubtitleView? = null
    var enableBackgroundPlayback: Boolean = false
    private var scalingMode: ScalingMode? = null
    private var requestedFullscreenValue: Boolean? = null
    private var requestedPictureInPictureValue: Boolean? = null
    private var fullscreenBridgeId: NativeId? = null

    private val onBmpEvent by EventDispatcher()
    private val onBmpPlayerActive by EventDispatcher()
    private val onBmpPlayerInactive by EventDispatcher()
    private val onBmpPlayerError by EventDispatcher()
    private val onBmpPlayerWarning by EventDispatcher()
    private val onBmpDestroy by EventDispatcher()
    private val onBmpMuted by EventDispatcher()
    private val onBmpUnmuted by EventDispatcher()
    private val onBmpReady by EventDispatcher()
    private val onBmpPaused by EventDispatcher()
    private val onBmpPlay by EventDispatcher()
    private val onBmpPlaying by EventDispatcher()
    private val onBmpPlaybackFinished by EventDispatcher()
    private val onBmpSeek by EventDispatcher()
    private val onBmpSeeked by EventDispatcher()
    private val onBmpTimeShift by EventDispatcher()
    private val onBmpTimeShifted by EventDispatcher()
    private val onBmpStallStarted by EventDispatcher()
    private val onBmpStallEnded by EventDispatcher()
    private val onBmpTimeChanged by EventDispatcher()
    private val onBmpSourceLoad by EventDispatcher()
    private val onBmpSourceLoaded by EventDispatcher()
    private val onBmpSourceUnloaded by EventDispatcher()
    private val onBmpSourceError by EventDispatcher()
    private val onBmpSourceWarning by EventDispatcher()
    private val onBmpAudioAdded by EventDispatcher()
    private val onBmpAudioRemoved by EventDispatcher()
    private val onBmpAudioChanged by EventDispatcher()
    private val onBmpSubtitleAdded by EventDispatcher()
    private val onBmpSubtitleRemoved by EventDispatcher()
    private val onBmpSubtitleChanged by EventDispatcher()
    private val onBmpDownloadFinished by EventDispatcher()
    private val onBmpAdBreakFinished by EventDispatcher()
    private val onBmpAdBreakStarted by EventDispatcher()
    private val onBmpAdClicked by EventDispatcher()
    private val onBmpAdError by EventDispatcher()
    private val onBmpAdFinished by EventDispatcher()
    private val onBmpAdManifestLoad by EventDispatcher()
    private val onBmpAdManifestLoaded by EventDispatcher()
    private val onBmpAdQuartile by EventDispatcher()
    private val onBmpAdScheduled by EventDispatcher()
    private val onBmpAdSkipped by EventDispatcher()
    private val onBmpAdStarted by EventDispatcher()
    private val onBmpVideoDownloadQualityChanged by EventDispatcher()
    private val onBmpVideoPlaybackQualityChanged by EventDispatcher()
    private val onBmpCastAvailable by EventDispatcher()
    private val onBmpCastPaused by EventDispatcher()
    private val onBmpCastPlaybackFinished by EventDispatcher()
    private val onBmpCastPlaying by EventDispatcher()
    private val onBmpCastStarted by EventDispatcher()
    private val onBmpCastStart by EventDispatcher()
    private val onBmpCastStopped by EventDispatcher()
    private val onBmpCastTimeUpdated by EventDispatcher()
    private val onBmpCastWaitingForDevice by EventDispatcher()
    private val onBmpPlaybackSpeedChanged by EventDispatcher()
    private val onBmpCueEnter by EventDispatcher()
    private val onBmpCueExit by EventDispatcher()

    private val onBmpFullscreenEnabled by EventDispatcher()
    private val onBmpFullscreenDisabled by EventDispatcher()
    private val onBmpFullscreenEnter by EventDispatcher()
    private val onBmpFullscreenExit by EventDispatcher()
    private val onBmpPictureInPictureAvailabilityChanged by EventDispatcher()
    private val onBmpPictureInPictureEnter by EventDispatcher()
    private val onBmpPictureInPictureExit by EventDispatcher()

    private var playerInMediaSessionService: Player? = null

    private val activityLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onStart(owner: LifecycleOwner) {
            if (playerInMediaSessionService != null) {
                playerView?.player = playerInMediaSessionService
            }
            playerView?.onStart()
        }

        override fun onResume(owner: LifecycleOwner) {
            playerView?.onResume()
        }

        override fun onPause(owner: LifecycleOwner) {
            playerView?.onPause()
        }

        override fun onStop(owner: LifecycleOwner) {
            removePlayerForBackgroundPlayback()
            playerView?.onStop()
        }

        override fun onDestroy(owner: LifecycleOwner) = dispose()

        // When background playback is enabled,
        // remove player from view so it does not get paused when entering background
        private fun removePlayerForBackgroundPlayback() {
            playerInMediaSessionService = null
            val player = playerView?.player ?: return

            if (!enableBackgroundPlayback) {
                return
            }
            if (appContext.registry.getModule<PlayerExpoModule>()?.mediaSessionPlaybackManager?.player != player) {
                return
            }

            playerInMediaSessionService = player
            playerView?.player = null
        }
    }

    private val activityLifecycle: Lifecycle? =
        (appContext.activityProvider?.currentActivity as? LifecycleOwner)?.lifecycle
            ?: (context as? LifecycleOwner)?.lifecycle

    init {
        // React Native has a bug that dynamically added views sometimes aren't laid out again properly.
        // Since we dynamically add and remove SurfaceView under the hood this caused the player
        // to suddenly not show the video anymore because SurfaceView was not laid out properly.
        // Bitmovin player issue: https://github.com/bitmovin/bitmovin-player-react-native/issues/180
        // React Native layout issue: https://github.com/facebook/react-native/issues/17968
        viewTreeObserver.addOnGlobalLayoutListener { requestLayout() }

        activityLifecycle?.addObserver(activityLifecycleObserver)
    }

    fun dispose() {
        activityLifecycle?.removeObserver(activityLifecycleObserver)
        playerView?.onDestroy()
        playerView = null
    }

    private fun setPlayerView(playerView: PlayerView) {
        // Remove existing playerView if it exists
        this.playerView?.let { oldPlayerView ->
            oldPlayerView.player?.let {
                detachPlayerListeners(it)
            }
            (oldPlayerView.parent as? ViewGroup)?.removeView(oldPlayerView)
            oldPlayerView.player = null
        }
        this.playerView = playerView
        if (playerView.parent != this) {
            (playerView.parent as ViewGroup?)?.removeView(playerView)
            addView(playerView, 0)
        }
        scalingMode?.let {
            playerView.scalingMode = it
        }
        fullscreenBridgeId?.let {
            attachFullscreenBridge(it)
        }
        requestedFullscreenValue?.let {
            setFullscreen(it)
        }
        requestedPictureInPictureValue?.let {
            setPictureInPicture(it)
        }
    }

    fun attachPlayer(
        playerId: NativeId,
        playerViewConfigWrapper: RNPlayerViewConfigWrapper?,
        customMessageHandlerBridgeId: NativeId?,
        enableBackgroundPlayback: Boolean,
        isPictureInPictureEnabledOnPlayer: Boolean,
        userInterfaceTypeName: String?,
    ) {
        val playerModule = appContext.registry.getModule<PlayerExpoModule>()
        // Player might not be initialized yet, this is a timing issue
        // Return early without throwing to avoid crash
        val player = playerModule?.getPlayerOrNull(playerId) ?: return

        if (playerView?.player == player) {
            // Player is already attached to the PlayerView
            return
        }

        playerView?.player?.let {
            detachPlayerListeners(it)
        }
        attachPlayerListeners(player)
        if (playerView != null) {
            playerView?.player = player
        } else {
            this.enableBackgroundPlayback = enableBackgroundPlayback
            val userInterfaceType = userInterfaceTypeName?.toUserInterfaceType() ?: UserInterfaceType.Bitmovin
            val configuredPlayerViewConfig = playerViewConfigWrapper?.playerViewConfig ?: PlayerViewConfig()

            val currentActivity = appContext.activityProvider?.currentActivity
                ?: throw IllegalStateException("Cannot create a PlayerView, because no activity is attached.")
            val playerViewConfig: PlayerViewConfig = if (userInterfaceType != UserInterfaceType.Bitmovin) {
                configuredPlayerViewConfig.copy(uiConfig = UiConfig.Disabled)
            } else {
                configuredPlayerViewConfig
            }

            val newPlayerView = PlayerView(currentActivity, player, playerViewConfig)

            newPlayerView.layoutParams = LayoutParams(
                LayoutParams.MATCH_PARENT,
                LayoutParams.MATCH_PARENT,
            )

            if (isPictureInPictureEnabledOnPlayer || playerViewConfigWrapper?.pictureInPictureConfig?.isEnabled == true) {
                newPlayerView.setPictureInPictureHandler(RNPictureInPictureHandler(currentActivity, player))
            }
            setPlayerView(newPlayerView)
            attachPlayerViewListeners(newPlayerView)

            val playerConfig = player.config
            if (playerConfig.styleConfig.isUiEnabled && userInterfaceType == UserInterfaceType.Subtitle) {
                appContext.activityProvider?.currentActivity?.let { activity ->
                    val subtitleView = SubtitleView(activity)
                    subtitleView.setPlayer(player)
                    setSubtitleView(subtitleView)
                }
            }
        }
        customMessageHandlerBridgeId?.let {
            appContext.registry.getModule<CustomMessageHandlerExpoModule>()?.getInstance(it)
                ?.let { customMessageHandlerBridge ->
                    playerView?.setCustomMessageHandler(customMessageHandlerBridge.customMessageHandler)
                }
        }
    }

    private fun setSubtitleView(subtitleView: SubtitleView) {
        this.subtitleView?.let { currentSubtitleView ->
            (currentSubtitleView.parent as? ViewGroup)?.removeView(currentSubtitleView)
        }
        this.subtitleView = subtitleView
        addView(subtitleView)
    }

    private fun isInPictureInPictureMode(): Boolean {
        val activity = appContext.activityProvider?.currentActivity ?: return false
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activity.isInPictureInPictureMode
        } else {
            false
        }
    }

    private var isCurrentActivityInPictureInPictureMode: Boolean = isInPictureInPictureMode()

    /**
     * Called whenever this view's activity configuration changes.
     */
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        if (isCurrentActivityInPictureInPictureMode != isInPictureInPictureMode()) {
            isCurrentActivityInPictureInPictureMode = isInPictureInPictureMode()
            onPictureInPictureModeChanged(isCurrentActivityInPictureInPictureMode, newConfig)
        }
    }

    private fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration,
    ) {
        val playerView = playerView ?: return
        playerView.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        if (isInPictureInPictureMode) {
            playerView.enterPictureInPicture()
        } else {
            playerView.exitPictureInPicture()
        }
    }

    private fun attachPlayerViewListeners(playerView: PlayerView) {
        playerView.on(PlayerEvent.FullscreenEnabled::class) {
            onBmpFullscreenEnabled(it.toJson())
        }
        playerView.on(PlayerEvent.FullscreenDisabled::class) {
            onBmpFullscreenDisabled(it.toJson())
        }
        playerView.on(PlayerEvent.FullscreenEnter::class) {
            onBmpFullscreenEnter(it.toJson())
        }
        playerView.on(PlayerEvent.FullscreenExit::class) {
            onBmpFullscreenExit(it.toJson())
        }
        playerView.on(PlayerEvent.PictureInPictureAvailabilityChanged::class) {
            onBmpPictureInPictureAvailabilityChanged(it.toJson())
        }
        playerView.on(PlayerEvent.PictureInPictureEnter::class) {
            onBmpPictureInPictureEnter(it.toJson())
        }
        playerView.on(PlayerEvent.PictureInPictureExit::class) {
            onBmpPictureInPictureExit(it.toJson())
        }
    }

    private var playerEventSubscriptions = mutableListOf<EventSubscription<*>>()

    private fun detachPlayerListeners(player: Player) {
        playerEventSubscriptions.forEach { listener ->
            player.off(listener)
        }
        playerEventSubscriptions.clear()
    }

    private fun attachPlayerListeners(player: Player) {
        playerEventSubscriptions = mutableListOf(
            player.on<PlayerEvent.Active> { onEvent(onBmpPlayerActive, it.toJson()) },
            player.on<PlayerEvent.Inactive> { onEvent(onBmpPlayerInactive, it.toJson()) },
            player.on<PlayerEvent.Error> { onEvent(onBmpPlayerError, it.toJson()) },
            player.on<PlayerEvent.Warning> { onEvent(onBmpPlayerWarning, it.toJson()) },
            player.on<PlayerEvent.Destroy> { onEvent(onBmpDestroy, it.toJson()) },
            player.on<PlayerEvent.Muted> { onEvent(onBmpMuted, it.toJson()) },
            player.on<PlayerEvent.Unmuted> { onEvent(onBmpUnmuted, it.toJson()) },
            player.on<PlayerEvent.Ready> { onEvent(onBmpReady, it.toJson()) },
            player.on<PlayerEvent.Paused> { onEvent(onBmpPaused, it.toJson()) },
            player.on<PlayerEvent.Play> { onEvent(onBmpPlay, it.toJson()) },
            player.on<PlayerEvent.Playing> { onEvent(onBmpPlaying, it.toJson()) },
            player.on<PlayerEvent.PlaybackFinished> { onEvent(onBmpPlaybackFinished, it.toJson()) },
            player.on<PlayerEvent.Seek> { onEvent(onBmpSeek, it.toJson()) },
            player.on<PlayerEvent.Seeked> { onEvent(onBmpSeeked, it.toJson()) },
            player.on<PlayerEvent.TimeShift> { onEvent(onBmpTimeShift, it.toJson()) },
            player.on<PlayerEvent.TimeShifted> { onEvent(onBmpTimeShifted, it.toJson()) },
            player.on<PlayerEvent.StallStarted> { onEvent(onBmpStallStarted, it.toJson()) },
            player.on<PlayerEvent.StallEnded> { onEvent(onBmpStallEnded, it.toJson()) },
            player.on<PlayerEvent.TimeChanged> { onEvent(onBmpTimeChanged, it.toJson()) },
            player.on<SourceEvent.Load> { onEvent(onBmpSourceLoad, it.toJson()) },
            player.on<SourceEvent.Loaded> { onEvent(onBmpSourceLoaded, it.toJson()) },
            player.on<SourceEvent.Unloaded> { onEvent(onBmpSourceUnloaded, it.toJson()) },
            player.on<SourceEvent.Error> { onEvent(onBmpSourceError, it.toJson()) },
            player.on<SourceEvent.Warning> { onEvent(onBmpSourceWarning, it.toJson()) },
            player.on<SourceEvent.AudioTrackAdded> { onEvent(onBmpAudioAdded, it.toJson()) },
            player.on<SourceEvent.AudioTrackChanged> { onEvent(onBmpAudioChanged, it.toJson()) },
            player.on<SourceEvent.AudioTrackRemoved> { onEvent(onBmpAudioRemoved, it.toJson()) },
            player.on<SourceEvent.SubtitleTrackAdded> { onEvent(onBmpSubtitleAdded, it.toJson()) },
            player.on<SourceEvent.SubtitleTrackChanged> { onEvent(onBmpSubtitleChanged, it.toJson()) },
            player.on<SourceEvent.SubtitleTrackRemoved> { onEvent(onBmpSubtitleRemoved, it.toJson()) },
            player.on<SourceEvent.DownloadFinished> { onEvent(onBmpDownloadFinished, it.toJson()) },
            player.on<PlayerEvent.AdBreakFinished> { onEvent(onBmpAdBreakFinished, it.toJson()) },
            player.on<PlayerEvent.AdBreakStarted> { onEvent(onBmpAdBreakStarted, it.toJson()) },
            player.on<PlayerEvent.AdClicked> { onEvent(onBmpAdClicked, it.toJson()) },
            player.on<PlayerEvent.AdError> { onEvent(onBmpAdError, it.toJson()) },
            player.on<PlayerEvent.AdFinished> { onEvent(onBmpAdFinished, it.toJson()) },
            player.on<PlayerEvent.AdManifestLoad> { onEvent(onBmpAdManifestLoad, it.toJson()) },
            player.on<PlayerEvent.AdManifestLoaded> { onEvent(onBmpAdManifestLoaded, it.toJson()) },
            player.on<PlayerEvent.AdQuartile> { onEvent(onBmpAdQuartile, it.toJson()) },
            player.on<PlayerEvent.AdScheduled> { onEvent(onBmpAdScheduled, it.toJson()) },
            player.on<PlayerEvent.AdSkipped> { onEvent(onBmpAdSkipped, it.toJson()) },
            player.on<PlayerEvent.AdStarted> { onEvent(onBmpAdStarted, it.toJson()) },
            player.on<SourceEvent.VideoDownloadQualityChanged> {
                onEvent(
                    onBmpVideoDownloadQualityChanged,
                    it.toJson(),
                )
            },
            player.on<PlayerEvent.VideoPlaybackQualityChanged> {
                onEvent(
                    onBmpVideoPlaybackQualityChanged,
                    it.toJson(),
                )
            },
            player.on<PlayerEvent.CastAvailable> { onEvent(onBmpCastAvailable, it.toJson()) },
            player.on<PlayerEvent.CastPaused> { onEvent(onBmpCastPaused, it.toJson()) },
            player.on<PlayerEvent.CastPlaybackFinished> { onEvent(onBmpCastPlaybackFinished, it.toJson()) },
            player.on<PlayerEvent.CastPlaying> { onEvent(onBmpCastPlaying, it.toJson()) },
            player.on<PlayerEvent.CastStarted> { onEvent(onBmpCastStarted, it.toJson()) },
            player.on<PlayerEvent.CastStart> { onEvent(onBmpCastStart, it.toJson()) },
            player.on<PlayerEvent.CastStopped> { onEvent(onBmpCastStopped, it.toJson()) },
            player.on<PlayerEvent.CastTimeUpdated> { onEvent(onBmpCastTimeUpdated, it.toJson()) },
            player.on<PlayerEvent.CastWaitingForDevice> { onEvent(onBmpCastWaitingForDevice, it.toJson()) },
            player.on<PlayerEvent.CueEnter> { onEvent(onBmpCueEnter, it.toJson()) },
            player.on<PlayerEvent.CueExit> { onEvent(onBmpCueExit, it.toJson()) },
        )
    }

    private fun onEvent(dispatcher: ViewEventCallback<Map<String, Any>>, eventData: Map<String, Any>) {
        dispatcher(eventData)
        onBmpEvent(eventData)
    }

    fun setFullscreen(isFullscreen: Boolean) {
        requestedFullscreenValue = isFullscreen
        playerView?.let {
            if (it.isFullscreen == isFullscreen) return
            if (isFullscreen) {
                it.enterFullscreen()
            } else {
                it.exitFullscreen()
            }
        }
    }

    fun setPictureInPicture(isPictureInPicture: Boolean) {
        requestedPictureInPictureValue = isPictureInPicture
        playerView?.let {
            if (it.isPictureInPicture == isPictureInPicture) return
            if (isPictureInPicture) {
                it.enterPictureInPicture()
            } else {
                it.exitPictureInPicture()
            }
        }
    }

    fun setScalingMode(scalingMode: String?) {
        this.scalingMode = scalingMode?.let { ScalingMode.valueOf(it) } ?: ScalingMode.Fit
        playerView?.scalingMode = this.scalingMode ?: ScalingMode.Fit
    }

    fun attachFullscreenBridge(fullscreenBridgeId: NativeId) {
        this.fullscreenBridgeId = fullscreenBridgeId
        val playerView = playerView ?: return
        appContext.registry.getModule<FullscreenHandlerExpoModule>()?.getInstance(fullscreenBridgeId)
            ?.let { fullscreenBridge ->
                playerView.setFullscreenHandler(fullscreenBridge)
            } ?: throw IllegalArgumentException("Fullscreen bridge with ID $fullscreenBridgeId not found")
        requestedFullscreenValue?.let { isFullscreen ->
            playerView.let {
                if (isFullscreen) {
                    it.enterFullscreen()
                } else {
                    it.exitFullscreen()
                }
            }
        }
    }

    /**
     * Try to measure and update this view layout as much as possible to
     * avoid layout problems related to React or old layout values present
     * in `playerView` due to being previously attached to a different parent.
     */
    override fun requestLayout() {
        super.requestLayout()
        post {
            measure(
                MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
            )
            layout(left, top, right, bottom)
        }
    }
}

private inline fun <reified E : Event> Player.on(noinline onEvent: (event: E) -> Unit): EventSubscription<E> {
    val eventSubscription = EventSubscription(E::class, onEvent)
    this.on(eventSubscription.eventClass, eventSubscription.action)
    return eventSubscription
}
