package com.bitmovin.player.reactnative

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OfflineModuleTest {
    @Test
    fun `minimumBitrate returns int value`() {
        val request = mapOf("minimumBitrate" to 800000)

        assertEquals(800000, request.minimumBitrate())
    }

    @Test
    fun `minimumBitrate converts floating point values from react native`() {
        val request = mapOf("minimumBitrate" to 800000.0)

        assertEquals(800000, request.minimumBitrate())
    }

    @Test
    fun `minimumBitrate returns null when not provided`() {
        val request = emptyMap<String, Any?>()

        assertNull(request.minimumBitrate())
    }

    @Test
    fun `minimumBitrate returns null when value is not numeric`() {
        val request = mapOf("minimumBitrate" to "800000")

        assertNull(request.minimumBitrate())
    }
}
