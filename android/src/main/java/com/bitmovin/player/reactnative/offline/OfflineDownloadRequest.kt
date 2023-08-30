package com.bitmovin.player.reactnative.offline

data class OfflineDownloadRequest(
    val minimumBitrate: Int?,
    val audioOptionIds: List<String>?,
    val textOptionIds: List<String>?
)
