package com.bitmovin.player.reactnative

import com.bitmovin.player.SubtitleView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class RNSubtitleViewManager(private val context: ReactApplicationContext) : SimpleViewManager<SubtitleView>() {

    /**
     * Exported module name to JS.
     */
    override fun getName() = "BitmovinSubtitleView"

    /**
     * The component's native view factory. RN calls this method multiple times
     * for each component instance.
     */
    override fun createViewInstance(reactContext: ThemedReactContext) = SubtitleView(context)

    @ReactProp(name = "playerId" )
    fun setPlayerId(view: SubtitleView, playerId: String?) {
        val player = context.getNativeModule(PlayerModule::class.java)?.getPlayer(playerId)
        if (player != null) {
            view.setPlayer(player)
        }
    }
}
