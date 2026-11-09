package com.bitmovin.player.reactnative

import expo.modules.kotlin.exception.CodedException

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
}
