package com.bitmovin.player.reactnative

import expo.modules.kotlin.exception.CodedException

internal class InvalidRnArgumentException(message: String) : CodedException("ERR_INVALID_ARGUMENT", message, null)
