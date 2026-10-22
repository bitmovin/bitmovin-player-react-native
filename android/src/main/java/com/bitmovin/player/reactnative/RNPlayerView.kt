package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.bitmovin.player.PlayerView
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toUserInterfaceType
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.facebook.react.ReactRootView
import com.facebook.react.views.view.ReactViewGroup
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class RNPlayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    var playerView: PlayerView? = null
        private set
    private var pictureInPictureHandler: RNPictureInPictureHandler? = null

    private var pictureInPictureActions: List<PictureInPictureAction>? = null
    private var subtitleView: SubtitleView? = null
    private var playerContainer: FrameLayout? = null
    var enableBackgroundPlayback: Boolean = false
    private var scalingMode: ScalingMode? = null
    private var requestedFullscreenValue: Boolean? = null
    private var requestedPictureInPictureValue: Boolean? = null
    private var fullscreenBridgeId: NativeId? = null

    private val onBmpPlayerViewReady by EventDispatcher()
    private val onBmpFullscreenEnabled by EventDispatcher()
    private val onBmpFullscreenDisabled by EventDispatcher()
    private val onBmpFullscreenEnter by EventDispatcher()
    private val onBmpFullscreenExit by EventDispatcher()
    private val onBmpPictureInPictureAvailabilityChanged by EventDispatcher()
    private val onBmpPictureInPictureEnter by EventDispatcher()
    private val onBmpPictureInPictureEntered by EventDispatcher()
    private val onBmpPictureInPictureExit by EventDispatcher()
    private val onBmpPictureInPictureExited by EventDispatcher()

    private var pictureInPictureConfig: PictureInPictureConfig = PictureInPictureConfig()

    private var playerInMediaSessionService: Player? = null

    // Setting this flag to `true` in order for React Native to re-render our view when [requestLayout] is triggered
    override val shouldUseAndroidLayout: Boolean = true

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

            // When the player is in PiP mode and this window is closed, we want the player to stop
            // So we ignore the `isBackgroundPlaybackEnabled` flag
            if (isInPictureInPictureMode()) {
                return
            }
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

    private val reparentHelper = RNPlayerViewReparentHelper()

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
            view.setPictureInPictureHandler(null)
            // keep the player alive (before calling PlayerView.onDestroy,
            // as this would internally destroy the player)
            // this is important, as react native has a different lifecycle handling and is able to
            // share the player via the PlayerModule
            view.player = null
            view.onDestroy()
        }
        playerView = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            pictureInPictureHandler?.dispose()
            pictureInPictureHandler = null
        }
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
        reparentHelper.dispose()
        pictureInPictureActions = null

        // cleanup all children views explicitly,
        // so that in case react native does some view caching we are 100% the child views of this view
        // are cleaned up from the view hierarchy
        removeAllViews()
    }

    private fun setPlayerView(playerView: PlayerView) {
        // Remove existing playerView if it exists
        this.playerView?.let { oldPlayerView ->
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
        // PlayerView renders this native view only after player.initialize() resolves,
        // so the player is already registered on the normal attachment path.
        val player = playerModule?.getPlayerOrNull(playerId) ?: return

        if (playerView?.player == player) {
            // Player is already attached to the PlayerView
            return
        }

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

            this.pictureInPictureConfig = playerViewConfigWrapper?.pictureInPictureConfig ?: PictureInPictureConfig()
            val isPictureInPictureEnabled = isPictureInPictureEnabledOnPlayer || pictureInPictureConfig.isEnabled
            pictureInPictureHandler = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPictureInPictureEnabled) {
                RNPictureInPictureHandler(
                    activity = currentActivity,
                    player = player,
                    pictureInPictureConfig = pictureInPictureConfig,
                    onPictureInPictureExited = {
                        // It is safe to call this function with `newConfig = null`
                        playerView?.onPictureInPictureModeChanged(
                            isInPictureInPictureMode = false,
                            newConfig = null,
                        )
                    },
                )
            } else {
                null
            }
            newPlayerView.setPictureInPictureHandler(pictureInPictureHandler)
            applyPictureInPictureActions()
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
        onBmpPlayerViewReady(mapOf("playerId" to playerId))
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
        if (pictureInPictureHandler?.playerIsPlaying != true) return false
        playerView.enterPictureInPicture()
        return true
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

        if (isInPictureInPictureMode) {
            if (!playerView.isPictureInPicture) {
                playerView.enterPictureInPicture()
            }

            if (!reparentHelper.isActive) {
                reparentHelper.reparent()
            }

            // We must "delay" the onPictureInPictureModeChanged callback via posting a runnable.
            // This will force the callback to be called at the end of the current pending UI transactions.
            // This is necessary as the `PlayerView.onPictureInPictureModeChanged` call will immediately send a
            // PiP-transition ended event.
            post {
                playerView.onPictureInPictureModeChanged(true, newConfig)
            }
        } else {
            if (playerView.isPictureInPicture) {
                playerView.exitPictureInPicture()
            }

            reparentHelper.tryRestore()

            // No need to call playerView.onPictureInPictureModeChanged,
            // as this is done via the RNPictureInPictureHandler callback.
            // The PiP-exit handling is different compared to PiP-enter, due to the nature of PiP handling:
            // Enter via `activity.enterPictureInPictureMode`, Exit via `activity.startActivity(restoreIntent)`.
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
        playerView.on(PlayerEvent.PictureInPictureEntered::class) {
            onBmpPictureInPictureEntered(it.toJson())
        }
        playerView.on(PlayerEvent.PictureInPictureExit::class) {
            onBmpPictureInPictureExit(it.toJson())
        }
        playerView.on(PlayerEvent.PictureInPictureExited::class) {
            onBmpPictureInPictureExited(it.toJson())
        }
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
        if (isPictureInPicture && !pictureInPictureConfig.isEnabled) {
            return
        }
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

    fun updatePictureInPictureActions(pictureInPictureActions: List<PictureInPictureAction>) {
        this.pictureInPictureActions = pictureInPictureActions
        applyPictureInPictureActions()
    }

    private fun applyPictureInPictureActions() {
        val actions = pictureInPictureActions ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            pictureInPictureHandler?.updateActions(actions)
        }
    }

    fun setIsPictureInPictureEnabled(isEnabled: Boolean) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        pictureInPictureConfig = pictureInPictureConfig.copy(isEnabled = isEnabled)
        if (isEnabled && pictureInPictureHandler == null) {
            val currentActivity = appContext.activityProvider?.currentActivity ?: return
            val player = playerView?.player ?: return
            pictureInPictureHandler = RNPictureInPictureHandler(
                activity = currentActivity,
                player = player,
                pictureInPictureConfig = pictureInPictureConfig,
                onPictureInPictureExited = {
                    // It is safe to call this function with `newConfig = null`
                    playerView?.onPictureInPictureModeChanged(
                        isInPictureInPictureMode = false,
                        newConfig = null,
                    )
                },
            )
            playerView?.setPictureInPictureHandler(pictureInPictureHandler)
            applyPictureInPictureActions()
        } else if (!isEnabled && pictureInPictureHandler != null) {
            pictureInPictureHandler?.dispose()
            pictureInPictureHandler = null
            playerView?.setPictureInPictureHandler(null)
        }
    }

    // React Native doesn't properly handle PiP layout transitions.
    // During PiP mode, we temporarily move the view higher up the hierarchy to the ReactRoot.
    // This prevents fragmented rendering when the user resizes the PiP window.
    // On PiP close, we re-arrange the view hierarchy to its original state
    private inner class RNPlayerViewReparentHelper {
        private inner class ViewHolder(
            val reactRoot: ReactRootView,
            val playerParentParent: ViewGroup,
            val playerParent: ReactViewGroup,
            val playerParentIndex: Int,
        )

        private inline fun <reified T : View> View.findParentOfType(): T? {
            var view = this
            do {
                view = view.parent as? View ?: return null
            } while (view !is T)
            return view
        }

        private var viewHolder: ViewHolder? = null

        val isActive: Boolean
            get() = viewHolder != null

        private val globalLayoutListener = ViewTreeObserver.OnGlobalLayoutListener {
            val reactRoot = viewHolder?.reactRoot ?: return@OnGlobalLayoutListener
            val view = this@RNPlayerView
            view.measure(
                MeasureSpec.makeMeasureSpec(reactRoot.width, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(reactRoot.height, MeasureSpec.EXACTLY),
            )
            view.layout(0, 0, view.measuredWidth, view.measuredHeight)
        }

        fun reparent() {
            val playerParent = this@RNPlayerView.findParentOfType<ReactViewGroup>() ?: return
            val playerParentParent = playerParent.parent as? ViewGroup ?: return
            val reactRoot = playerParent.findParentOfType<ReactRootView>() ?: return

            viewHolder = ViewHolder(
                reactRoot = reactRoot,
                playerParentParent = playerParentParent,
                playerParent = playerParent,
                playerParentIndex = playerParentParent.indexOfChild(playerParent),
            )

            playerParentParent.removeView(playerParent)
            reactRoot.addView(playerParent)

            // We attach the global layout listener to a playerParent,
            // but inside the callback we are measuring each root.
            // This is because the root is the first view layer that gets transformed in PiP mode.
            // Measuring and layouting this should cascade down the viewHierarchy.
            playerParent.viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
        }

        fun tryRestore() {
            val viewHolder = viewHolder ?: return
            viewHolder.reactRoot.removeView(viewHolder.playerParent)
            try {
                viewHolder.playerParentParent.addView(viewHolder.playerParent, viewHolder.playerParentIndex)
            } catch (_: Exception) {
                // In case the view hierarchy layout has changed an exception will be thrown while adding the view
                // This should never happen, but we can not be sure what react-native does under the hood.
                // As a fallback add the view without index (will be added as last view)
                viewHolder.playerParentParent.addView(viewHolder.playerParent)
            }

            dispose()
        }

        fun dispose() {
            viewHolder?.playerParent?.viewTreeObserver?.removeOnGlobalLayoutListener(globalLayoutListener)
            this.viewHolder = null
        }
    }
}
