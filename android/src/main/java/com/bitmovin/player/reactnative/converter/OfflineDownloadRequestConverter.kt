package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.reactnative.OfflineException
import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest

fun Map<String, Any?>.toOfflineDownloadRequest(): OfflineDownloadRequest {
    // JS numbers arrive as Double; the SDK request expects Int.
    val minimumBitrate = (get("minimumBitrate") as? Number)?.toInt()
    if (minimumBitrate != null && minimumBitrate < 0) throw OfflineException.InvalidRequest()
    return OfflineDownloadRequest(
        minimumBitrate,
        (get("audioOptionIds") as? List<*>)?.filterIsInstance<String>(),
        (get("textOptionIds") as? List<*>)?.filterIsInstance<String>(),
    )
}
