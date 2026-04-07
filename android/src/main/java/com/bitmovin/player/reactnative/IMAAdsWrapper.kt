package com.bitmovin.player.reactnative

import android.util.Log
import android.view.ViewGroup
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.metadata.id3.TextInformationFrame
import com.bitmovin.player.api.source.SourceConfig
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.google.ads.interactivemedia.v3.api.AdErrorEvent
import com.google.ads.interactivemedia.v3.api.AdErrorEvent.AdErrorListener
import com.google.ads.interactivemedia.v3.api.AdEvent
import com.google.ads.interactivemedia.v3.api.AdEvent.AdEventListener
import com.google.ads.interactivemedia.v3.api.AdEvent.AdEventType
import com.google.ads.interactivemedia.v3.api.AdsLoader
import com.google.ads.interactivemedia.v3.api.AdsLoader.AdsLoadedListener
import com.google.ads.interactivemedia.v3.api.AdsManagerLoadedEvent
import com.google.ads.interactivemedia.v3.api.ImaSdkFactory
import com.google.ads.interactivemedia.v3.api.StreamManager
import com.google.ads.interactivemedia.v3.api.StreamRequest
import com.google.ads.interactivemedia.v3.api.player.VideoProgressUpdate
import com.google.ads.interactivemedia.v3.api.player.VideoStreamPlayer
import com.google.ads.interactivemedia.v3.api.player.VideoStreamPlayer.VideoStreamPlayerCallback

class IMAAdsWrapper(
    private val context: ReactContext,
    private val videoPlayer: Player,
) : AdEventListener, AdErrorListener, AdsLoadedListener {
    private var pendingRequestedAssetId: String? = null
    private var adUiContainer: ViewGroup? = null

    private val LOG_TAG = "Bitmovin IMAAdsWrapper"
    private val sdkFactory = ImaSdkFactory.getInstance()
    private var adsLoader: AdsLoader? = null
    var streamManager: StreamManager? = null
    var playerCallbacks: MutableList<VideoStreamPlayerCallback> =
        ArrayList()

    private var fallbackUrl: String? = null
    private var adTagParams: ReadableMap? = null

    init {
        // Listen for ID3 metadata and use callbacks
        videoPlayer.on(
            PlayerEvent.Metadata::class,
            ::onMetadataEvent,
        )
        videoPlayer.on(
            PlayerEvent.PlaybackFinished::class,
            ::onPlaybackFinished,
        )
    }

    @Suppress("UNUSED_PARAMETER")
    private fun onPlaybackFinished(event: PlayerEvent.PlaybackFinished) {
        playerCallbacks.forEach {
            it.onContentComplete()
        }
    }

    internal fun setAdUiContainer(adUiContainer: ViewGroup?) {
        // Match iOS: only initialize once; repeated calls (e.g. from layout + attachPlayer) must not create a new AdsLoader.
        if (adsLoader != null) {
            return
        }
        this.adUiContainer = adUiContainer
        createAdsLoader()
    }

    private fun createAdsLoader() {
        if (adsLoader != null) {
            Log.w(LOG_TAG, "AdsLoader already created, skipping initialization")
            return
        }
        val settings = sdkFactory.createImaSdkSettings()
        val videoStreamPlayer = createVideoStreamPlayer()
        val adUiContainer = adUiContainer
            ?: run {
                Log.e(LOG_TAG, "Ad UI container is not available")
                return
            }
        val displayContainer =
            ImaSdkFactory.createStreamDisplayContainer(adUiContainer, videoStreamPlayer)

        val adsLoader = sdkFactory.createAdsLoader(context, settings, displayContainer)
        adsLoader.addAdErrorListener(this)
        adsLoader.addAdsLoadedListener(this)
        this.adsLoader = adsLoader

        pendingRequestedAssetId?.let { assetId ->
            pendingRequestedAssetId = null
            requestAndLoadStream(assetId)
        }
    }

    fun requestAndLoadStream(assetId: String) {
        createAdsLoader()
        val adsLoader = this.adsLoader ?: run {
            Log.e(LOG_TAG, "AdsLoader is not initialized")
            pendingRequestedAssetId = assetId
            return@requestAndLoadStream
        }
        pendingRequestedAssetId = null
        adsLoader.requestStream(buildStreamRequest(assetId))
    }

    fun onMetadataEvent(metadata: PlayerEvent.Metadata) {
        val metadataEntriesCount = metadata.metadata.length()
        if (metadataEntriesCount == 0) {
            Log.w(LOG_TAG, "No metadata entries found")
            return
        }
        for (i in 0 until metadataEntriesCount) {
            val entry = metadata.metadata[i]
            if (entry is TextInformationFrame) {
                if ("TXXX" == entry.id) {
                    playerCallbacks.forEach {
                        it.onUserTextReceived(entry.value)
                    }
                }
            }
        }
    }

    private fun buildStreamRequest(assetId: String): StreamRequest {
        // To support VOD through IMA, create different stream requests here
        // based on video type
        val request = sdkFactory.createLiveStreamRequest(assetId, null)
        request.setAdTagParameters(toMap(adTagParams))
        return request
    }

    private fun createVideoStreamPlayer(): VideoStreamPlayer {
        val player: VideoStreamPlayer = object : VideoStreamPlayer {
            override fun addCallback(videoStreamPlayerCallback: VideoStreamPlayerCallback) {
                playerCallbacks.add(videoStreamPlayerCallback)
            }

            @Suppress("UNUSED_PARAMETER")
            override fun loadUrl(url: String, headers: List<HashMap<String, String>>) {
                videoPlayer.load(SourceConfig.fromUrl(url))
                Log.i(LOG_TAG, "Loading IMA DAI URL")
            }

            override fun onAdBreakEnded() {
                // TODO: emit event?
            }

            override fun onAdBreakStarted() {
                // TODO: emit event?
            }

            override fun onAdPeriodEnded() {
                // TODO: emit event?
            }

            override fun onAdPeriodStarted() {
                // TODO: emit event?
            }

            override fun resume() {
                videoPlayer.play()
            }

            override fun seek(l: Long) {
                // IMA passes position in milliseconds; Bitmovin seek() expects seconds.
                videoPlayer.seek(l / 1000.0)
            }

            override fun pause() {
                videoPlayer.pause()
            }

            override fun removeCallback(videoStreamPlayerCallback: VideoStreamPlayerCallback) {
                playerCallbacks.remove(videoStreamPlayerCallback)
            }

            override fun getContentProgress(): VideoProgressUpdate {
                // Bitmovin currentTime/duration are in seconds; IMA VideoProgressUpdate expects milliseconds.
                return VideoProgressUpdate(
                    (videoPlayer.currentTime * 1000).toLong(),
                    (videoPlayer.duration * 1000).toLong(),
                )
            }

            override fun getVolume(): Int {
                return videoPlayer.volume
            }
        }
        return player
    }

    override fun onAdError(adErrorEvent: AdErrorEvent) {
        fallbackUrl?.let { videoPlayer.load(SourceConfig.fromUrl(it)) } ?: run {
            Log.e(LOG_TAG, "IMA Ad Error: ${adErrorEvent.error.message}")
            return@onAdError
        }
        videoPlayer.play()
    }

    override fun onAdEvent(adEvent: AdEvent) {
        when (adEvent.type) {
            AdEventType.AD_PROGRESS -> {}
            AdEventType.AD_BREAK_STARTED, AdEventType.AD_BREAK_ENDED -> Log.i(
                LOG_TAG,
                String.format("Event: %s\n", adEvent.type),
            )
            AdEventType.TAPPED -> {
                // Tap on non-clickthrough portion of ad (e.g. video area) — toggle play/pause like iOS.
                if (videoPlayer.isPlaying) {
                    videoPlayer.pause()
                    playerCallbacks.forEach { it.onPause() }
                } else {
                    videoPlayer.play()
                    playerCallbacks.forEach { it.onResume() }
                }
            }
            else -> {}
        }
    }

    override fun onAdsManagerLoaded(adsManagerLoadedEvent: AdsManagerLoadedEvent) {
        val streamManager = adsManagerLoadedEvent.streamManager
        this.streamManager = streamManager
        streamManager.addAdErrorListener(this)
        streamManager.addAdEventListener(this)
        streamManager.init()
    }

    fun setFallbackUrl(url: String?) {
        fallbackUrl = url
    }

    fun setAdTagParams(params: ReadableMap?) {
        adTagParams = params
    }

    fun toMap(readableMap: ReadableMap?): Map<String, String> {
        val map = mutableMapOf<String, String>()
        if (readableMap != null) {
            val iterator = readableMap.keySetIterator()
            while (iterator.hasNextKey()) {
                val key = iterator.nextKey()
                map[key] = readableMap.getString(key) ?: "" // assumes all values are strings
            }
        }
        return map
    }
}
