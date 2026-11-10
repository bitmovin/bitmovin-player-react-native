package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest

fun Map<String, Any?>.toOfflineDownloadRequest(): OfflineDownloadRequest {
    // JS numbers arrive as Double; Android's offline rendition selection uses Int bitrates.
    val minimumBitrate = (get("minimumBitrate") as? Number)?.toInt()
    return OfflineDownloadRequest(
        minimumBitrate,
        (get("audioOptionIds") as? List<*>)?.filterIsInstance<String>(),
        (get("textOptionIds") as? List<*>)?.filterIsInstance<String>(),
    )
}
