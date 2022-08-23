package com.bitmovin.player.reactnative

/**
 * Represents the `UUID` string used as index for a certain registry object.
 */
typealias NativeId = String

/**
 * Represents an in memory storage facility that associates an object of type `T` with a certain `NativeId`.
 */
typealias Registry<T> = MutableMap<NativeId, T>
