package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.bitmovin.player.PlayerView
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.ui.PictureInPictureHandler
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

    private var pictureInPictureHandler: RNPictureInPictureHandler? = null
    private var pictureInPictureConfig: PictureInPictureConfig = PictureInPictureConfig()

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
            if (appContext.registry.getModule<PlayerModule>()?.mediaSessionPlaybackManager?.player != player) {
                return
            }

            playerInMediaSessionService = player
            playerView?.player = null
        }
    }

    private val activityLifecycle: Lifecycle? =
        (appContext.activityProvider?.currentActivity as? LifecycleOwner)?.lifecycle

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
        appContext.activityProvider?.currentActivity
            ?.setPictureInPictureParams(
                PictureInPictureParams.Builder()
                    .setAutoEnterEnabled(false)
                    .build(),
            )
        playerView?.onDestroy()
        playerView = null
        playerContainer?.let { container ->
            (container.parent as? ViewGroup)?.removeView(container)
        }
        playerContainer = null
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
        containerLayoutParams.width = ViewGroup.LayoutParams.MATCH_PARENT
        containerLayoutParams.height = ViewGroup.LayoutParams.MATCH_PARENT
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

            this.pictureInPictureConfig = playerViewConfigWrapper?.pictureInPictureConfig ?: PictureInPictureConfig()
            val isPictureInPictureEnabled = isPictureInPictureEnabledOnPlayer || pictureInPictureConfig.isEnabled
            pictureInPictureHandler = if (isPictureInPictureEnabled) {
                RNPictureInPictureHandler(
                    currentActivity,
                    player,
                    pictureInPictureConfig,
                )
            } else {
                null
            }
            newPlayerView.setPictureInPictureHandler(pictureInPictureHandler)
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

    internal fun shouldEnterPictureInPictureOnBackground() = pictureInPictureConfig.let {
        it.isEnabled && it.shouldEnterOnBackground
    }

    internal fun requestPictureInPictureOnBackgroundTransition(): Boolean {
        if (!shouldEnterPictureInPictureOnBackground()) {
            return false
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return false
        }
        val activity = appContext.activityProvider?.currentActivity ?: return false
        if (activity.isFinishing || activity.isChangingConfigurations) {
            return false
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && activity.isInPictureInPictureMode) {
            return false
        }
        val playerView = playerView ?: return false
        if (!playerView.isPictureInPictureAvailable || playerView.isPictureInPicture) {
            return false
        }
        if (pictureInPictureHandler?.autoEnterEnabledOverride != true) return false
        playerView.enterPictureInPicture()
        return true
    }

    private fun setSubtitleView(subtitleView: SubtitleView) {
        this.subtitleView?.let { currentSubtitleView ->
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
                        val displayMetrics = android.util.DisplayMetrics()
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
                    currentParams.width = ViewGroup.LayoutParams.MATCH_PARENT
                    currentParams.height = ViewGroup.LayoutParams.MATCH_PARENT
                    layoutParams = currentParams
                }

                // Reset intermediate container to full size
                playerContainer?.let { container ->
                    container.layoutParams?.let { containerParams ->
                        containerParams.width = ViewGroup.LayoutParams.MATCH_PARENT
                        containerParams.height = ViewGroup.LayoutParams.MATCH_PARENT
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

    private var playerEventSubscriptions = mutableListOf<EventSubscription<*>>()

    private fun detachPlayerListeners(player: Player) {
        playerEventSubscriptions.forEach { listener ->
            player.off(listener)
        }
        playerEventSubscriptions.clear()
    }

    private fun updateAutoPiPOverride(autoEnterEnabled: Boolean) {
        pictureInPictureHandler?.autoEnterEnabledOverride = autoEnterEnabled
    }

    private fun attachPlayerListeners(player: Player) {
        playerEventSubscriptions = mutableListOf(
            player.on<PlayerEvent.Active> { onEvent(onBmpPlayerActive, it.toJson()) },
            player.on<PlayerEvent.Inactive> {
                updateAutoPiPOverride(false)
                onEvent(onBmpPlayerInactive, it.toJson())
            },
            player.on<PlayerEvent.Error> {
                updateAutoPiPOverride(false)
                onEvent(onBmpPlayerError, it.toJson())
            },
            player.on<PlayerEvent.Warning> { onEvent(onBmpPlayerWarning, it.toJson()) },
            player.on<PlayerEvent.Destroy> {
                updateAutoPiPOverride(false)
                onEvent(onBmpDestroy, it.toJson())
            },
            player.on<PlayerEvent.Muted> { onEvent(onBmpMuted, it.toJson()) },
            player.on<PlayerEvent.Unmuted> { onEvent(onBmpUnmuted, it.toJson()) },
            player.on<PlayerEvent.Ready> { onEvent(onBmpReady, it.toJson()) },
            player.on<PlayerEvent.Paused> {
                updateAutoPiPOverride(false)
                onEvent(onBmpPaused, it.toJson())
            },
            player.on<PlayerEvent.Play> {
                updateAutoPiPOverride(true)
                onEvent(onBmpPlay, it.toJson())
            },
            player.on<PlayerEvent.Playing> {
                updateAutoPiPOverride(true)
                onEvent(onBmpPlaying, it.toJson())
            },
            player.on<PlayerEvent.PlaybackFinished> {
                updateAutoPiPOverride(false)
                onEvent(onBmpPlaybackFinished, it.toJson())
            },
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
            player.on<PlayerEvent.AdBreakFinished> {
                updateAutoPiPOverride(false)
                onEvent(onBmpAdBreakFinished, it.toJson())
            },
            player.on<PlayerEvent.AdBreakStarted> {
                updateAutoPiPOverride(true)
                onEvent(onBmpAdBreakStarted, it.toJson())
            },
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

private inline fun <reified E : Event> Player.on(noinline onEvent: (event: E) -> Unit): EventSubscription<E> {
    val eventSubscription = EventSubscription(E::class, onEvent)
    this.on(eventSubscription.eventClass, eventSubscription.action)
    return eventSubscription
}
