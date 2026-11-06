package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import androidx.core.os.bundleOf
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.getMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.lang.ref.WeakReference
import java.util.concurrent.atomic.AtomicBoolean

/** Owns a single SDK player. Expo owns the JavaScript/native association. */
class SharedPlayer(
    appContext: AppContext,
    val nativeId: NativeId,
    val mediaSessionPlaybackManager: MediaSessionPlaybackManager,
) : SharedObject(appContext) {
    private var resource: Player? = null
    val player: Player?
        get() = if (closed.get()) null else resource
    private val closed = AtomicBoolean(false)
    private val mainHandler = Handler(Looper.getMainLooper())
    val shouldLoadAdItemWaiter = ResultWaiter<Boolean>()
    val shouldPlayAdBreakWaiter = ResultWaiter<Boolean>()
    val imaSettingsWaiter = ResultWaiter<Map<String, Any?>>()
    private var currentView = WeakReference<RNPlayerView>(null)
    val attachedView: RNPlayerView?
        get() = currentView.get()
    var pendingPictureInPictureActions: List<PictureInPictureAction>? = null
    var pendingIsPictureInPictureEnabled: Boolean? = null

    fun attachView(view: RNPlayerView) {
        if (closed.get()) return
        currentView.get()?.takeIf { it !== view }?.dispose()
        currentView = WeakReference(view)
    }

    fun detachView(view: RNPlayerView) {
        if (currentView.get() === view) currentView.clear()
    }

    fun destroy() {
        if (!closed.compareAndSet(false, true)) return
        shouldLoadAdItemWaiter.clear()
        shouldPlayAdBreakWaiter.clear()
        imaSettingsWaiter.clear()
        val cleanup = Runnable {
            val releasedPlayer = resource
            resource = null
            try {
                releasedPlayer?.let {
                    try {
                        mediaSessionPlaybackManager.destroy(it)
                    } finally {
                        // Keep view listeners attached until the SDK emits its public Destroy event.
                        it.destroy()
                    }
                }
            } finally {
                currentView.get()?.dispose()
                currentView.clear()
            }
        }
        if (Looper.myLooper() == Looper.getMainLooper()) cleanup.run() else mainHandler.post(cleanup)
    }

    override fun sharedObjectDidRelease() = destroy()

    fun initialize(
        config: Map<String, Any>?,
        networkNativeId: NativeId?,
        decoderNativeId: NativeId?,
        analyticsConfigJson: Map<String, Any>?,
    ) {
        if (closed.get() || player != null) {
            return
        }

        val appContext = requireNotNull(appContext)
        val playerConfig = config?.toPlayerConfig() ?: PlayerConfig()

        @Suppress("UNCHECKED_CAST")
        val configJson = config as? Map<String, Any?>
        setupShouldLoadAdItem(configJson, playerConfig)
        setupShouldPlayAdBreak(configJson, playerConfig)
        ImaBeforeInitializationConfigurator.configure(
            configJson = configJson,
            playerConfig = playerConfig,
            imaSettingsWaiter = imaSettingsWaiter,
        ) { id, payload ->
            emit(
                "onImaBeforeInitialization",
                bundleOf(
                    "id" to id,
                    "settings" to payload,
                ),
            )
        }
        val enableMediaSession = config?.getMap("mediaControlConfig")
            ?.toMediaControlConfig()?.isEnabled ?: true

        val networkConfig = networkNativeId?.let { id ->
            appContext.registry.getModule<NetworkModule>()?.getConfig(id)
        }
        networkConfig?.let {
            playerConfig.networkConfig = it
        }

        val decoderConfig = decoderNativeId?.let {
            appContext.registry.getModule<DecoderConfigModule>()?.getDecoderConfig(it)
        }
        if (decoderConfig != null) {
            playerConfig.playbackConfig = playerConfig.playbackConfig.copy(decoderConfig = decoderConfig)
        }

        val applicationContext = appContext.reactContext?.applicationContext
            ?: throw IllegalStateException("Application context is not available")
        val analyticsConfig = analyticsConfigJson?.toAnalyticsConfig()
        val defaultMetadata = analyticsConfigJson?.getMap("defaultMetadata")?.toAnalyticsDefaultMetadata()

        val player = if (analyticsConfig != null) {
            Player.create(
                context = applicationContext,
                playerConfig = playerConfig,
                analyticsConfig = analyticsConfig,
                defaultMetadata = defaultMetadata ?: DefaultMetadata(),
            )
        } else {
            Player.create(applicationContext, playerConfig)
        }
        if (closed.get()) {
            player.destroy()
            return
        }
        resource = player

        if (enableMediaSession) {
            mediaSessionPlaybackManager.setupMediaSessionPlayback(player)
        }
    }

    private fun setupShouldLoadAdItem(
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
    ) {
        val advertisingConfigJson = configJson?.getMap("advertisingConfig") ?: return
        if (!advertisingConfigJson.containsKey("shouldLoadAdItem")) {
            return
        }
        val advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
        playerConfig.advertisingConfig = advertisingConfig.copy(
            shouldLoadAdItem = { adItem ->
                val (id, wait) = shouldLoadAdItemWaiter.make(250)
                emit(
                    "onShouldLoadAdItem",
                    bundleOf(
                        "id" to id,
                        "adItem" to adItem.toJson(),
                    ),
                )
                wait() ?: true
            },
        )
    }

    private fun setupShouldPlayAdBreak(
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
    ) {
        val advertisingConfigJson = configJson?.getMap("advertisingConfig") ?: return
        if (!advertisingConfigJson.containsKey("shouldPlayAdBreak")) {
            return
        }
        val advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
        playerConfig.advertisingConfig = advertisingConfig.copy(
            shouldPlayAdBreak = { adBreak ->
                val (id, wait) = shouldPlayAdBreakWaiter.make(250)
                emit(
                    "onShouldPlayAdBreak",
                    bundleOf(
                        "id" to id,
                        "adBreak" to adBreak.toJson(),
                    ),
                )
                wait() ?: true
            },
        )
    }
}
