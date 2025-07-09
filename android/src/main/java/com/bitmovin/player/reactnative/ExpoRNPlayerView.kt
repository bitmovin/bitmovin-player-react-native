package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.view.ViewGroup.LayoutParams
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.converter.toRNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.converter.toRNStyleConfigWrapperFromPlayerConfig
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.security.InvalidParameterException

@SuppressLint("ViewConstructor")
class ExpoRNPlayerView(context: android.content.Context, appContext: AppContext) : ExpoView(context, appContext) {
    var playerView: PlayerView? = null
        private set
    var config: RNPlayerViewConfigWrapper? = null
    var enableBackgroundPlayback: Boolean = false

    fun dispose() {
        playerView?.onStop()
        playerView?.onPause()
        playerView?.onDestroy()
        playerView = null
    }

    fun setPlayerView(playerView: PlayerView) {
        this.playerView = playerView
        addView(
            this.playerView,
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT,
        )
    }

    fun attachPlayer(playerId: NativeId, playerConfig: Map<String, Any>?) {
        val player = appContext.legacyModule<PlayerExpoModule>()?.getPlayerOrNull(playerId)
            ?: throw InvalidParameterException("Cannot create a PlayerView, invalid playerId was passed: $playerId")
        val playbackConfig = playerConfig?.get("playbackConfig") as? Map<String, Any>
        val isPictureInPictureEnabled = config?.pictureInPictureConfig?.isEnabled == true ||
            playbackConfig?.get("isPictureInPictureEnabled") as? Boolean == true
        enableBackgroundPlayback = playbackConfig?.get("isBackgroundPlaybackEnabled") as? Boolean == true

        val rnStyleConfigWrapper = playerConfig?.toRNStyleConfigWrapperFromPlayerConfig()
        val configuredPlayerViewConfig = config?.playerViewConfig ?: PlayerViewConfig()

        if (playerView != null) {
            playerView?.player = player
        } else {
            val currentActivity = appContext.activityProvider?.currentActivity
                ?: throw IllegalStateException("Cannot create a PlayerView, because no activity is attached.")
            val userInterfaceType = rnStyleConfigWrapper?.userInterfaceType ?: UserInterfaceType.Bitmovin
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
            if (isPictureInPictureEnabled) {
                newPlayerView.setPictureInPictureHandler(RNPictureInPictureHandler(currentActivity, player))
            }
            setPlayerView(newPlayerView)
        }
    }

    fun setFullscreen(isFullscreen: Boolean) {
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
        playerView?.let {
            if (it.isPictureInPicture == isPictureInPicture) return
            if (isPictureInPicture) {
                it.enterPictureInPicture()
            } else {
                it.exitPictureInPicture()
            }
        }
    }

    fun setScalingMode(scalingMode: String) {
        playerView?.scalingMode = ScalingMode.valueOf(scalingMode)
    }
}
