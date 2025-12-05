package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.util.DisplayMetrics
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.bitmovin.player.PlayerView
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventListener
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.on
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toUserInterfaceType
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.bitmovin.player.reactnative.util.NonFiniteSanitizer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.viewevent.ViewEventCallback
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class RNPlayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    var playerView: PlayerView? = null
        private set
    private var subtitleView: SubtitleView? = null
    private var playerContainer: FrameLayout? = null
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

        override fun onDestroy(owner: LifecycleOwner) {
            dispose()
        }

        // When background playback is enabled,
        // remove player from view so it does not get paused when entering background
        private fun removePlayerForBackgroundPlayback() {
            playerInMediaSessionService = null
            val player = playerView?.player ?: return

            if (!enableBackgroundPlayback) {
                return
            }
            if (appContext.registry.getModule<PlayerModule>()?.mediaSessionPlaybackManager?.player != player) {
                return
            }

            playerInMediaSessionService = player
            playerView?.player = null
        }
    }

    private val activityLifecycle: Lifecycle? =
        (appContext.currentActivity as? LifecycleOwner)?.lifecycle

    private val globalLayoutListener: ViewTreeObserver.OnGlobalLayoutListener =
        ViewTreeObserver.OnGlobalLayoutListener {
            requestLayout()
        }

    init {
        // React Native has a bug that dynamically added views sometimes aren't laid out again properly.
        // Since we dynamically add and remove SurfaceView under the hood this caused the player
        // to suddenly not show the video anymore because SurfaceView was not laid out properly.
        // Bitmovin player issue: https://github.com/bitmovin/bitmovin-player-react-native/issues/180
        // React Native layout issue: https://github.com/facebook/react-native/issues/17968
        viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)

        activityLifecycle?.addObserver(activityLifecycleObserver)
    }

    fun dispose() {
        playerView?.let { view ->
            view.player?.let {
                detachPlayerListeners(it)
            }
            view.setPictureInPictureHandler(null)
            // keep the player alive (before calling PlayerView.onDestroy,
            // as this would internally destroy the player)
            // this is important, as react native has a different lifecycle handling and is able to
            // share the player via the PlayerModule
            view.player = null
            view.onDestroy()
        }
        playerView = null
        subtitleView?.let { view ->
            view.setPlayer(null)
            (view.parent as? ViewGroup)?.removeView(view)
        }
        subtitleView = null

        playerContainer?.let { container ->
            (container.parent as? ViewGroup)?.removeView(container)
        }
        playerContainer = null

        activityLifecycle?.removeObserver(activityLifecycleObserver)
        viewTreeObserver.takeIf { it.isAlive }?.removeOnGlobalLayoutListener(globalLayoutListener)

        // cleanup all children
        removeAllViews()
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

        // Remove existing container if it exists
        playerContainer?.let { oldContainer ->
            (oldContainer.parent as? ViewGroup)?.removeView(oldContainer)
        }

        // Create new container for the PlayerView
        val newContainer = FrameLayout(context).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            )
        }

        // Add PlayerView to the container
        (playerView.parent as ViewGroup?)?.removeView(playerView)
        newContainer.addView(
            playerView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )

        // Add container to the ExpoView with correct layout parameters
        val containerLayoutParams = generateDefaultLayoutParams()
        containerLayoutParams.width = LayoutParams.MATCH_PARENT
        containerLayoutParams.height = LayoutParams.MATCH_PARENT
        addView(newContainer, 0, containerLayoutParams)

        this.playerView = playerView
        this.playerContainer = newContainer

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
        val playerModule = appContext.registry.getModule<PlayerModule>()
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

            val currentActivity = appContext.currentActivity
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

            val isPictureInPictureEnabled = isPictureInPictureEnabledOnPlayer ||
                playerViewConfigWrapper?.pictureInPictureConfig?.isEnabled == true
            if (isPictureInPictureEnabled) {
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
            appContext.registry.getModule<CustomMessageHandlerModule>()?.getInstance(it)
                ?.let { customMessageHandlerBridge ->
                    playerView?.setCustomMessageHandler(customMessageHandlerBridge.customMessageHandler)
                }
        }
    }

    private fun setSubtitleView(subtitleView: SubtitleView) {
        this.subtitleView?.let { currentSubtitleView ->
            currentSubtitleView.setPlayer(null)
            (currentSubtitleView.parent as? ViewGroup)?.removeView(currentSubtitleView)
        }
        this.subtitleView = subtitleView

        // Add SubtitleView to the playerContainer instead of the ExpoView
        // This ensures it's on top of the PlayerView
        playerContainer?.let { container ->
            val layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            )
            container.addView(subtitleView, layoutParams)
            subtitleView.bringToFront() // Ensure proper z-ordering
        }
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

        val wasInPiP = isCurrentActivityInPictureInPictureMode
        val nowInPiP = isInPictureInPictureMode()

        if (wasInPiP != nowInPiP) {
            isCurrentActivityInPictureInPictureMode = nowInPiP
            onPictureInPictureModeChanged(nowInPiP, newConfig)
        }
    }

    private fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration,
    ) {
        val playerView = playerView ?: return

        playerView.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

        if (isInPictureInPictureMode) {
            if (!playerView.isPictureInPicture) {
                playerView.enterPictureInPicture()
            }

            // Force layout update for PiP mode and ensure proper sizing
            playerView.requestLayout()
            requestLayout()

            // Additional PiP-specific layout handling
            post {
                val activity = appContext.activityProvider?.currentActivity
                if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    activity.isInPictureInPictureMode
                ) {
                    // Get the actual PiP window dimensions from WindowManager
                    val windowManager = activity.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                    val pipWidth: Int
                    val pipHeight: Int

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        // Use WindowMetrics for API 30+
                        val windowMetrics = windowManager.currentWindowMetrics
                        val windowBounds = windowMetrics.bounds
                        pipWidth = windowBounds.width()
                        pipHeight = windowBounds.height()
                    } else {
                        // Use deprecated Display.getSize() for older APIs
                        val displayMetrics = DisplayMetrics()
                        @Suppress("DEPRECATION")
                        windowManager.defaultDisplay.getMetrics(displayMetrics)
                        pipWidth = displayMetrics.widthPixels
                        pipHeight = displayMetrics.heightPixels
                    }

                    // Force the ExpoView to be resized to PiP dimensions
                    // Preserve the original layout params type to avoid ClassCastException
                    layoutParams?.let { currentParams ->
                        currentParams.width = pipWidth
                        currentParams.height = pipHeight
                        // Re-assign to trigger layout update
                        layoutParams = currentParams
                    }

                    // Ensure the ExpoView container is properly sized for PiP
                    measure(
                        MeasureSpec.makeMeasureSpec(pipWidth, MeasureSpec.EXACTLY),
                        MeasureSpec.makeMeasureSpec(pipHeight, MeasureSpec.EXACTLY),
                    )
                    layout(left, top, left + pipWidth, top + pipHeight)

                    // Ensure the intermediate container is properly sized for PiP
                    playerContainer?.let { container ->
                        // Preserve the original layout params type for the container
                        container.layoutParams?.let { containerParams ->
                            containerParams.width = pipWidth
                            containerParams.height = pipHeight
                            container.layoutParams = containerParams
                        }
                        container.measure(
                            MeasureSpec.makeMeasureSpec(pipWidth, MeasureSpec.EXACTLY),
                            MeasureSpec.makeMeasureSpec(pipHeight, MeasureSpec.EXACTLY),
                        )
                        container.layout(0, 0, pipWidth, pipHeight)
                    }

                    // Ensure the PlayerView is properly sized for PiP
                    playerView.layoutParams = FrameLayout.LayoutParams(pipWidth, pipHeight)
                    playerView.measure(
                        MeasureSpec.makeMeasureSpec(pipWidth, MeasureSpec.EXACTLY),
                        MeasureSpec.makeMeasureSpec(pipHeight, MeasureSpec.EXACTLY),
                    )
                    playerView.layout(0, 0, pipWidth, pipHeight)

                    // Ensure the SubtitleView is properly sized for PiP
                    subtitleView?.let { subtitleView ->
                        subtitleView.layoutParams = FrameLayout.LayoutParams(pipWidth, pipHeight)
                        subtitleView.measure(
                            MeasureSpec.makeMeasureSpec(pipWidth, MeasureSpec.EXACTLY),
                            MeasureSpec.makeMeasureSpec(pipHeight, MeasureSpec.EXACTLY),
                        )
                        subtitleView.layout(0, 0, pipWidth, pipHeight)
                        subtitleView.invalidate()
                    }

                    // Try to force a redraw
                    playerView.invalidate()
                    playerContainer?.invalidate()
                    invalidate()
                }
            }
        } else {
            if (playerView.isPictureInPicture) {
                playerView.exitPictureInPicture()
            }

            // Restore full size layout when exiting PiP
            post {
                // Reset ExpoView to full size
                layoutParams?.let { currentParams ->
                    currentParams.width = LayoutParams.MATCH_PARENT
                    currentParams.height = LayoutParams.MATCH_PARENT
                    layoutParams = currentParams
                }

                // Reset intermediate container to full size
                playerContainer?.let { container ->
                    container.layoutParams?.let { containerParams ->
                        containerParams.width = LayoutParams.MATCH_PARENT
                        containerParams.height = LayoutParams.MATCH_PARENT
                        container.layoutParams = containerParams
                    }
                }

                // Reset PlayerView to full size
                playerView.layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT,
                )

                // Reset SubtitleView to full size
                subtitleView?.let { subtitleView ->
                    subtitleView.layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT,
                    )
                }

                // Force layout updates
                measure(
                    MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
                )
                layout(left, top, right, bottom)

                playerContainer?.let { container ->
                    container.measure(
                        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
                    )
                    container.layout(0, 0, width, height)
                }

                playerView.measure(
                    MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
                )
                playerView.layout(0, 0, width, height)

                // Ensure SubtitleView is properly measured and laid out when exiting PiP
                subtitleView?.let { subtitleView ->
                    subtitleView.measure(
                        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
                    )
                    subtitleView.layout(0, 0, width, height)
                    subtitleView.invalidate()
                }
            }
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

    @Suppress("UNCHECKED_CAST")
    private val playerEventSubscriptions: List<EventSubscription<Event>> = listOf(
        EventSubscription<PlayerEvent.Active> { onEvent(onBmpPlayerActive, it.toJson()) },
        EventSubscription<PlayerEvent.Inactive> { onEvent(onBmpPlayerInactive, it.toJson()) },
        EventSubscription<PlayerEvent.Error> { onEvent(onBmpPlayerError, it.toJson()) },
        EventSubscription<PlayerEvent.Warning> { onEvent(onBmpPlayerWarning, it.toJson()) },
        EventSubscription<PlayerEvent.Destroy> { onEvent(onBmpDestroy, it.toJson()) },
        EventSubscription<PlayerEvent.Muted> { onEvent(onBmpMuted, it.toJson()) },
        EventSubscription<PlayerEvent.Unmuted> { onEvent(onBmpUnmuted, it.toJson()) },
        EventSubscription<PlayerEvent.Ready> { onEvent(onBmpReady, it.toJson()) },
        EventSubscription<PlayerEvent.Paused> { onEvent(onBmpPaused, it.toJson()) },
        EventSubscription<PlayerEvent.Play> { onEvent(onBmpPlay, it.toJson()) },
        EventSubscription<PlayerEvent.Playing> { onEvent(onBmpPlaying, it.toJson()) },
        EventSubscription<PlayerEvent.PlaybackFinished> { onEvent(onBmpPlaybackFinished, it.toJson()) },
        EventSubscription<PlayerEvent.Seek> { onEvent(onBmpSeek, it.toJson()) },
        EventSubscription<PlayerEvent.Seeked> { onEvent(onBmpSeeked, it.toJson()) },
        EventSubscription<PlayerEvent.TimeShift> { onEvent(onBmpTimeShift, it.toJson()) },
        EventSubscription<PlayerEvent.TimeShifted> { onEvent(onBmpTimeShifted, it.toJson()) },
        EventSubscription<PlayerEvent.StallStarted> { onEvent(onBmpStallStarted, it.toJson()) },
        EventSubscription<PlayerEvent.StallEnded> { onEvent(onBmpStallEnded, it.toJson()) },
        EventSubscription<PlayerEvent.TimeChanged> { onEvent(onBmpTimeChanged, it.toJson()) },
        EventSubscription<SourceEvent.Load> { onEvent(onBmpSourceLoad, it.toJson()) },
        EventSubscription<SourceEvent.Loaded> { onEvent(onBmpSourceLoaded, it.toJson()) },
        EventSubscription<SourceEvent.Unloaded> { onEvent(onBmpSourceUnloaded, it.toJson()) },
        EventSubscription<SourceEvent.Error> { onEvent(onBmpSourceError, it.toJson()) },
        EventSubscription<SourceEvent.Warning> { onEvent(onBmpSourceWarning, it.toJson()) },
        EventSubscription<SourceEvent.AudioTrackAdded> { onEvent(onBmpAudioAdded, it.toJson()) },
        EventSubscription<SourceEvent.AudioTrackChanged> { onEvent(onBmpAudioChanged, it.toJson()) },
        EventSubscription<SourceEvent.AudioTrackRemoved> { onEvent(onBmpAudioRemoved, it.toJson()) },
        EventSubscription<SourceEvent.SubtitleTrackAdded> { onEvent(onBmpSubtitleAdded, it.toJson()) },
        EventSubscription<SourceEvent.SubtitleTrackChanged> { onEvent(onBmpSubtitleChanged, it.toJson()) },
        EventSubscription<SourceEvent.SubtitleTrackRemoved> { onEvent(onBmpSubtitleRemoved, it.toJson()) },
        EventSubscription<SourceEvent.DownloadFinished> { onEvent(onBmpDownloadFinished, it.toJson()) },
        EventSubscription<PlayerEvent.AdBreakFinished> { onEvent(onBmpAdBreakFinished, it.toJson()) },
        EventSubscription<PlayerEvent.AdBreakStarted> { onEvent(onBmpAdBreakStarted, it.toJson()) },
        EventSubscription<PlayerEvent.AdClicked> { onEvent(onBmpAdClicked, it.toJson()) },
        EventSubscription<PlayerEvent.AdError> { onEvent(onBmpAdError, it.toJson()) },
        EventSubscription<PlayerEvent.AdFinished> { onEvent(onBmpAdFinished, it.toJson()) },
        EventSubscription<PlayerEvent.AdManifestLoad> { onEvent(onBmpAdManifestLoad, it.toJson()) },
        EventSubscription<PlayerEvent.AdManifestLoaded> { onEvent(onBmpAdManifestLoaded, it.toJson()) },
        EventSubscription<PlayerEvent.AdQuartile> { onEvent(onBmpAdQuartile, it.toJson()) },
        EventSubscription<PlayerEvent.AdScheduled> { onEvent(onBmpAdScheduled, it.toJson()) },
        EventSubscription<PlayerEvent.AdSkipped> { onEvent(onBmpAdSkipped, it.toJson()) },
        EventSubscription<PlayerEvent.AdStarted> { onEvent(onBmpAdStarted, it.toJson()) },
        EventSubscription<SourceEvent.VideoDownloadQualityChanged> {
            onEvent(
                onBmpVideoDownloadQualityChanged,
                it.toJson(),
            )
        },
        EventSubscription<PlayerEvent.VideoPlaybackQualityChanged> {
            onEvent(
                onBmpVideoPlaybackQualityChanged,
                it.toJson(),
            )
        },
        EventSubscription<PlayerEvent.CastAvailable> { onEvent(onBmpCastAvailable, it.toJson()) },
        EventSubscription<PlayerEvent.CastPaused> { onEvent(onBmpCastPaused, it.toJson()) },
        EventSubscription<PlayerEvent.CastPlaybackFinished> { onEvent(onBmpCastPlaybackFinished, it.toJson()) },
        EventSubscription<PlayerEvent.CastPlaying> { onEvent(onBmpCastPlaying, it.toJson()) },
        EventSubscription<PlayerEvent.CastStarted> { onEvent(onBmpCastStarted, it.toJson()) },
        EventSubscription<PlayerEvent.CastStart> { onEvent(onBmpCastStart, it.toJson()) },
        EventSubscription<PlayerEvent.CastStopped> { onEvent(onBmpCastStopped, it.toJson()) },
        EventSubscription<PlayerEvent.CastTimeUpdated> { onEvent(onBmpCastTimeUpdated, it.toJson()) },
        EventSubscription<PlayerEvent.CastWaitingForDevice> { onEvent(onBmpCastWaitingForDevice, it.toJson()) },
        EventSubscription<PlayerEvent.CueEnter> { onEvent(onBmpCueEnter, it.toJson()) },
        EventSubscription<PlayerEvent.CueExit> { onEvent(onBmpCueExit, it.toJson()) },
    ) as List<EventSubscription<Event>>

    private fun detachPlayerListeners(player: Player) {
        playerEventSubscriptions.forEach {
            player.off(it.eventClass, it.eventListener)
        }
    }

    private fun attachPlayerListeners(player: Player) {
        playerEventSubscriptions.forEach {
            player.on(it.eventClass, it.eventListener)
        }
    }

    private fun onEvent(dispatcher: ViewEventCallback<Map<String, Any>>, eventData: Map<String, Any>) {
        val sanitized = NonFiniteSanitizer.sanitizeEventData(eventData)
        dispatcher(sanitized)
        onBmpEvent(sanitized)
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
            if (it.isPictureInPicture == isPictureInPicture) {
                return
            }
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
        appContext.registry.getModule<FullscreenHandlerModule>()?.getInstance(fullscreenBridgeId)
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
