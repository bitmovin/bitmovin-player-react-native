package com.bitmovin.player.reactnative;

import android.content.Context;
import android.util.Log;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.OptIn;

import com.bitmovin.media3.common.util.UnstableApi;
import com.bitmovin.player.api.event.PlayerEvent;
import com.bitmovin.player.api.metadata.id3.TextInformationFrame;
import com.bitmovin.player.api.source.SourceConfig;
import com.google.ads.interactivemedia.v3.api.AdErrorEvent;
import com.google.ads.interactivemedia.v3.api.AdEvent;
import com.google.ads.interactivemedia.v3.api.AdsLoader;
import com.google.ads.interactivemedia.v3.api.AdsManagerLoadedEvent;
import com.google.ads.interactivemedia.v3.api.StreamDisplayContainer;
import com.google.ads.interactivemedia.v3.api.ImaSdkFactory;
import com.google.ads.interactivemedia.v3.api.ImaSdkSettings;
import com.google.ads.interactivemedia.v3.api.StreamManager;
import com.google.ads.interactivemedia.v3.api.StreamRequest;
import com.google.ads.interactivemedia.v3.api.player.VideoProgressUpdate;
import com.google.ads.interactivemedia.v3.api.player.VideoStreamPlayer;
import com.bitmovin.player.api.Player;
import com.bitmovin.player.api.metadata.Metadata;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class IMAAdsWrapper implements AdEvent.AdEventListener, AdErrorEvent.AdErrorListener, AdsLoader.AdsLoadedListener {

    private final String LOG_TAG = "Bitmovin IMAAdsWrapper";
    private final ImaSdkFactory sdkFactory;
    private AdsLoader adsLoader;
    private StreamDisplayContainer displayContainer;
    public StreamManager streamManager;
    public List<VideoStreamPlayer.VideoStreamPlayerCallback> playerCallbacks;

    private final Player videoPlayer;
    private final Context context;
    private final ViewGroup adUiContainer;

    private String fallbackUrl;

    public IMAAdsWrapper(Context context, Player videoPlayer,
                         ViewGroup adUiContainer) {
        this.videoPlayer = videoPlayer;
        this.context = context;
        this.adUiContainer = adUiContainer;
        sdkFactory = ImaSdkFactory.getInstance();
        playerCallbacks = new ArrayList<>();
        createAdsLoader();
        displayContainer = ImaSdkFactory.createStreamDisplayContainer(
                this.adUiContainer,
                createVideoStreamPlayer()
        );
    }

    @OptIn(markerClass = UnstableApi.class) private void createAdsLoader() {
        ImaSdkSettings settings = sdkFactory.createImaSdkSettings();
        VideoStreamPlayer videoStreamPlayer = createVideoStreamPlayer();
        displayContainer = ImaSdkFactory.createStreamDisplayContainer(adUiContainer, videoStreamPlayer);

        // Listen for ID3 metadata and use callbacks
        videoPlayer.on(PlayerEvent.Metadata.class, metadata -> {
            Metadata.Entry entry = metadata.getMetadata().get(0);
            if (entry instanceof TextInformationFrame textFrame) {
                if ("TXXX".equals(textFrame.id)) {
                    for (VideoStreamPlayer.VideoStreamPlayerCallback callback : playerCallbacks) {
                        callback.onUserTextReceived(textFrame.value);
                    }
                }
            }
        });
        adsLoader = sdkFactory.createAdsLoader(context, settings, displayContainer);
    }

    public void requestAndLoadStream(String assetId) {
        adsLoader.addAdErrorListener(this);
        adsLoader.addAdsLoadedListener(this);
        adsLoader.requestStream(buildStreamRequest(assetId));
    }

    private StreamRequest buildStreamRequest(String assetId) {
        // To support VOD through IMA, create different stream requests here
        // based on video type
        return sdkFactory.createLiveStreamRequest(assetId, null);
    }

    private VideoStreamPlayer createVideoStreamPlayer() {
        VideoStreamPlayer player = new VideoStreamPlayer() {
            @Override
            public void addCallback(@NonNull VideoStreamPlayerCallback videoStreamPlayerCallback) {
                playerCallbacks.add(videoStreamPlayerCallback);
            }

            @Override
            public void loadUrl(@NonNull String url, @NonNull List<HashMap<String, String>> list) {
                videoPlayer.load(SourceConfig.fromUrl(url));
                Log.i(LOG_TAG, "Loading IMA DAI URL");
            }

            @Override
            public void onAdBreakEnded() {
                
            }

            @Override
            public void onAdBreakStarted() {

            }

            @Override
            public void onAdPeriodEnded() {

            }

            @Override
            public void onAdPeriodStarted() {

            }

            @Override
            public void resume() {
                videoPlayer.play();
            }

            @Override
            public void seek(long l) {
                videoPlayer.seek(l);
            }

            @Override
            public void pause() {
                videoPlayer.pause();
            }

            @Override
            public void removeCallback(@NonNull VideoStreamPlayerCallback videoStreamPlayerCallback) {
                playerCallbacks.remove(videoStreamPlayerCallback);
            }

            @NonNull
            @Override
            public VideoProgressUpdate getContentProgress() {
                return new VideoProgressUpdate((long) videoPlayer.getCurrentTime(), (long) videoPlayer.getDuration());
            }

            @Override
            public int getVolume() {
                return videoPlayer.getVolume();
            }
        };
        return player;
    }

    @Override
    public void onAdError(@NonNull AdErrorEvent adErrorEvent) {
        videoPlayer.load(SourceConfig.fromUrl(fallbackUrl));
        videoPlayer.play();
    }

    @Override
    public void onAdEvent(@NonNull AdEvent adEvent) {
        switch (adEvent.getType()) {
            case AD_PROGRESS:
                // Do nothing or else log are filled by these messages.
                break;
            case AD_BREAK_STARTED, AD_BREAK_ENDED:
                Log.i(LOG_TAG, String.format("Event: %s\n", adEvent.getType()));
                break;
            default:
                break;
        }
    }

    @Override
    public void onAdsManagerLoaded(@NonNull AdsManagerLoadedEvent adsManagerLoadedEvent) {
        streamManager = adsManagerLoadedEvent.getStreamManager();
        streamManager.addAdErrorListener(this);
        streamManager.addAdEventListener(this);
        streamManager.init();
    }

    void setFallbackUrl(String url) {
        fallbackUrl = url;
    }
}
