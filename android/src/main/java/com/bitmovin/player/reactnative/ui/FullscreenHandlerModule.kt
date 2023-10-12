package com.bitmovin.player.reactnative.ui

import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.Registry
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private const val MODULE_NAME = "FullscreenHandlerModule"

@ReactModule(name = MODULE_NAME)
class FullscreenHandlerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = MODULE_NAME

    /**
     * In-memory mapping from `nativeId`s to `FullscreenHandler` instances.
     */
    private val fullscreenHandler: Registry<FullscreenHandlerBridge> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     *  Lock condition used to sync operations on the fullscreen handler.
     */
    private val fullscreenChangedCondition = lock.newCondition()

    fun getInstance(nativeId: NativeId?): FullscreenHandlerBridge? = fullscreenHandler[nativeId]

    fun requestEnterFullscreen(nativeId: NativeId) {
        context.catalystInstance.callFunction(
            "FullscreenBridge-$nativeId",
            "enterFullscreen",
            Arguments.createArray() as NativeArray,
        )
        lock.withLock {
            fullscreenChangedCondition.await()
        }
    }

    fun requestExitFullscreen(nativeId: NativeId) {
        context.catalystInstance.callFunction(
            "FullscreenBridge-$nativeId",
            "exitFullscreen",
            Arguments.createArray() as NativeArray,
        )
        lock.withLock {
            fullscreenChangedCondition.await()
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun onFullscreenChanged(nativeId: NativeId, isFullscreenEnabled: Boolean) {
        fullscreenHandler[nativeId]?.isFullscreen = isFullscreenEnabled
        lock.withLock {
            fullscreenChangedCondition.signal()
        }
    }

    @ReactMethod
    fun registerHandler(nativeId: NativeId) {
        val fullscreenHandler = fullscreenHandler[nativeId] ?: FullscreenHandlerBridge(context, nativeId)
        this.fullscreenHandler[nativeId] = fullscreenHandler
    }

    @ReactMethod
    fun setIsFullscreenActive(nativeId: NativeId, isFullscreenActive: Boolean) {
        fullscreenHandler[nativeId]?.isFullscreen = isFullscreenActive
    }

    @ReactMethod
    fun destroy(nativeId: NativeId) {
        fullscreenHandler.remove(nativeId)
    }
}
