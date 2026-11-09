package com.bitmovin.player.reactnative

import expo.modules.kotlin.exception.CodedException

sealed class OfflineException(message: String) : CodedException(message) {
    class InvalidIdentifier : OfflineException("Invalid identifier")
    class InvalidSourceConfig : OfflineException("Invalid source config")
    class InvalidRequest : OfflineException("Invalid download request")
    class DownloadAlreadyCompleted : OfflineException("Download already completed")
    class DownloadInProgress : OfflineException("Download already in progress")
    class DownloadSuspended : OfflineException("Download is suspended")
}
