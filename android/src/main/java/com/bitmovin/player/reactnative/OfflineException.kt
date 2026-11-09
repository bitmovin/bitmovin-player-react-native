package com.bitmovin.player.reactnative

import expo.modules.kotlin.exception.CodedException

sealed class OfflineException(message: String) : CodedException(message) {
    class InvalidIdentifier : OfflineException("Invalid identifier")
    class InvalidSourceConfig : OfflineException("Invalid source config")
}
