package com.bitmovin.player.reactnative

import com.bitmovin.player.api.buffer.BufferLevel
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

private const val MODULE_NAME = "BufferModule"

@ReactModule(name = MODULE_NAME)
class BufferModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    data class RNBufferLevels(val audio: BufferLevel, val video: BufferLevel)

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Gets the buffer level from the Player
     * @param nativeId Native Id of the collector instance.
     * @param type The type of buffer to return the level for.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getLevel(nativeId: NativeId, type: Int, promise: Promise) {
        uiManager()?.addUIBlock { _ ->
            val player = playerModule()?.getPlayer(nativeId) ?: return@addUIBlock
            val bufferType = JsonConverter.toBufferType(type)
            val bufferLevels = RNBufferLevels(
                player.buffer.getLevel(bufferType, MediaType.Audio),
                player.buffer.getLevel(bufferType, MediaType.Video),
            )
            JsonConverter.fromRNBufferLevels(bufferLevels)?.let {
                promise.resolve(it)
            }
        }
    }

    /**
     * Sets the target buffer level for the chosen buffer type across all media types.
     *
     * @param nativeId Target player id.
     * @param type The type of the buffer to set the target level for.
     * @param value The value to set.
     */
    @ReactMethod
    fun setTargetLevel(nativeId: NativeId, type: Int, value: Double) {
        uiManager()?.addUIBlock { _ ->
            val player = playerModule()?.getPlayer(nativeId) ?: return@addUIBlock
            val bufferType = JsonConverter.toBufferType(type)
            player.buffer.setTargetLevel(bufferType, value)
        }
    }

    /**
     * Helper function that gets the instantiated `UIManagerModule` from modules registry.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)

    /**
     * Helper function that gets the instantiated `PlayerModule` from modules registry.
     */
    private fun playerModule(): PlayerModule? =
        context.getNativeModule(PlayerModule::class.java)
}
