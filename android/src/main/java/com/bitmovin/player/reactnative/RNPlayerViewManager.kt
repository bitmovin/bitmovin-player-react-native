package com.bitmovin.player.reactnative

import android.os.Build
import com.bitmovin.player.reactnative.converter.toPictureInPictureActions
import com.bitmovin.player.reactnative.converter.toRNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.getString
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections
import java.util.WeakHashMap

class RNPlayerViewManager : Module() {
    // Weak Set
    private val autoPictureInPictureViews = Collections.newSetFromMap(WeakHashMap<RNPlayerView, Boolean>())
    // RNPlayerView -> active playerId (weak keys, same semantics as autoPictureInPictureViews)
    private val activePlayerIdByView = WeakHashMap<RNPlayerView, NativeId>()

    override fun definition() = ModuleDefinition {
        Name("RNPlayerViewManager")

        OnDestroy {
            autoPictureInPictureViews.clear()
            activePlayerIdByView.clear()
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            // On version S or above this is handled with the PiP Parameters in the `PictureInPictureHandler`
            OnUserLeavesActivity {
                requestAutoPictureInPicture()
            }
        }

        View(RNPlayerView::class) {
            OnViewDestroys { view: RNPlayerView ->
                autoPictureInPictureViews.remove(view)
                unregisterView(view)
                view.dispose()
            }

            Prop("config") { view: RNPlayerView, playerInfo: Map<String, Any>? ->
                val playerId = playerInfo?.get("playerId") as? String
                    ?: throw IllegalArgumentException("Player info must contain 'playerId' field")
                val customMessageHandlerBridgeId = playerInfo.getString("customMessageHandlerBridgeId")
                val enableBackgroundPlayback = playerInfo.getBooleanOrNull("enableBackgroundPlayback") ?: false
                val isPictureInPictureEnabledOnPlayer =
                    playerInfo.getBooleanOrNull("isPictureInPictureEnabledOnPlayer") ?: false
                val userInterfaceTypeName = playerInfo.getString("userInterfaceTypeName")
                val playerViewConfigWrapper = playerInfo.getMap("playerViewConfig")?.toRNPlayerViewConfigWrapper()

                // If another RNPlayerView currently owns the same playerId, dispose it first.
                // This guarantees old-view teardown happens before attaching the new view,
                // preventing fullscreen/modal attach-detach races.
                val previousView = activePlayerIdByView.entries
                    .firstOrNull { it.value == playerId }
                    ?.key
                if (previousView != null && previousView !== view) {
                    autoPictureInPictureViews.remove(previousView)
                    unregisterView(previousView)
                    previousView.dispose()
                }

                view.attachPlayer(
                    playerId,
                    playerViewConfigWrapper,
                    customMessageHandlerBridgeId,
                    enableBackgroundPlayback,
                    isPictureInPictureEnabledOnPlayer,
                    userInterfaceTypeName,
                )
                registerViewForPlayer(view, playerId)
                updateAutoPictureInPictureRegistration(view)
            }

            Prop("scalingMode") { view: RNPlayerView, scalingMode: String? ->
                view.setScalingMode(scalingMode)
            }

            Prop("isFullscreenRequested") { view: RNPlayerView, isFullscreen: Boolean ->
                view.setFullscreen(isFullscreen)
            }

            Prop("isPictureInPictureRequested") { view: RNPlayerView, isPictureInPicture: Boolean ->
                view.setPictureInPicture(isPictureInPicture)
            }

            Prop("fullscreenBridgeId") { view: RNPlayerView, fullscreenBridgeId: String ->
                view.attachFullscreenBridge(fullscreenBridgeId)
            }

            AsyncFunction("updatePictureInPictureActions") { view: RNPlayerView, pictureInPictureActions: List<String> ->
                view.updatePictureInPictureActions(pictureInPictureActions.toPictureInPictureActions())
            }

            Events(
                "onBmpEvent",
                "onBmpPlayerError",
                "onBmpPlayerWarning",
                "onBmpDestroy",
                "onBmpMuted",
                "onBmpUnmuted",
                "onBmpReady",
                "onBmpPaused",
                "onBmpPlay",
                "onBmpPlaying",
                "onBmpPlaybackFinished",
                "onBmpSeek",
                "onBmpSeeked",
                "onBmpTimeShift",
                "onBmpTimeShifted",
                "onBmpStallStarted",
                "onBmpStallEnded",
                "onBmpTimeChanged",
                "onBmpSourceLoad",
                "onBmpSourceLoaded",
                "onBmpSourceUnloaded",
                "onBmpSourceError",
                "onBmpSourceWarning",
                "onBmpAudioAdded",
                "onBmpAudioChanged",
                "onBmpAudioRemoved",
                "onBmpSubtitleAdded",
                "onBmpSubtitleChanged",
                "onBmpSubtitleRemoved",
                "onBmpDownloadFinished",
                "onBmpVideoDownloadQualityChanged",
                "onBmpPictureInPictureAvailabilityChanged",
                "onBmpPictureInPictureEnter",
                "onBmpPictureInPictureExit",
                "onBmpAdBreakFinished",
                "onBmpAdBreakStarted",
                "onBmpAdClicked",
                "onBmpAdError",
                "onBmpAdFinished",
                "onBmpAdManifestLoad",
                "onBmpAdManifestLoaded",
                "onBmpAdQuartile",
                "onBmpAdScheduled",
                "onBmpAdSkipped",
                "onBmpAdStarted",
                "onBmpVideoPlaybackQualityChanged",
                "onBmpFullscreenEnabled",
                "onBmpFullscreenDisabled",
                "onBmpFullscreenEnter",
                "onBmpFullscreenExit",
                "onBmpCastStart",
                "onBmpCastPlaybackFinished",
                "onBmpCastPaused",
                "onBmpCastPlaying",
                "onBmpCastStarted",
                "onBmpCastAvailable",
                "onBmpCastStopped",
                "onBmpCastWaitingForDevice",
                "onBmpCastTimeUpdated",
                "onBmpCueEnter",
                "onBmpCueExit",
                "onBmpMetadata",
                "onBmpMetadataParsed",
            )
        }
    }

    private fun registerViewForPlayer(view: RNPlayerView, playerId: NativeId) {
        // Keep a single ownership mapping by removing entries for this view and for this playerId.
        val iterator = activePlayerIdByView.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (entry.key === view || entry.value == playerId) {
                iterator.remove()
            }
        }
        activePlayerIdByView[view] = playerId
    }

    private fun unregisterView(view: RNPlayerView) {
        activePlayerIdByView.remove(view)
    }

    private fun updateAutoPictureInPictureRegistration(view: RNPlayerView) {
        if (view.shouldEnterPictureInPictureOnBackground()) {
            autoPictureInPictureViews.add(view)
        } else {
            autoPictureInPictureViews.remove(view)
        }
    }

    private fun requestAutoPictureInPicture() = autoPictureInPictureViews
        .firstOrNull { it.requestPictureInPictureOnBackgroundTransition() }
}
