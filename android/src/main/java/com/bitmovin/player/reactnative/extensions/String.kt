package com.bitmovin.player.reactnative.extensions

/**
 * Returns a copy of this string with its first letter capitalized.
 */
fun String.capitalized(): String = this.replaceFirstChar {
    it.uppercase()
}
