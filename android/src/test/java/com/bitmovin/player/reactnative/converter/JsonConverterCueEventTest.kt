package com.bitmovin.player.reactnative.converter

import android.graphics.Color
import android.text.Layout
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.media.subtitle.Cue
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class JsonConverterCueEventTest {
    @Test
    fun `cue enter omits layout when geometry is unset`() {
        val json = PlayerEvent.CueEnter(createCue()).toJson()

        assertEquals("<b>plain</b>", json["html"])
        assertFalse(json.containsKey("layout"))
    }

    @Test
    fun `cue enter preserves bottom centered android sample geometry`() {
        val json = PlayerEvent.CueEnter(
            createCue(
                line = -1.0f,
                lineType = Cue.LineType.LineTypeNumber,
                position = 0.5f,
                positionAnchor = Cue.AnchorType.AnchorTypeMiddle,
                size = 1.0f
            )
        ).toJson()
        val layout = json["layout"] as Map<*, *>
        val line = layout["line"] as Map<*, *>

        assertFalse(layout.containsKey("textAlign"))
        assertEquals("start", layout["lineAlign"])
        assertEquals("center", layout["positionAlign"])
        assertEquals(50.0, layout["position"])
        assertEquals(-1.0, line["value"])
        assertEquals("line", line["unit"])
        assertEquals(100.0, layout["size"])
        assertEquals("horizontal", layout["writingMode"])
    }

    @Test
    fun `cue exit exposes explicit layout geometry`() {
        val json = PlayerEvent.CueExit(
            createCue(
                line = 3.0f,
                lineType = Cue.LineType.LineTypeNumber,
                lineAnchor = Cue.AnchorType.AnchorTypeEnd,
                position = 0.25f,
                positionAnchor = Cue.AnchorType.AnchorTypeMiddle,
                size = 0.5f,
                textAlignment = Layout.Alignment.ALIGN_OPPOSITE,
                verticalType = Cue.VerticalType.VerticalTypeRightToLeft
            )
        ).toJson()
        val layout = json["layout"] as Map<*, *>
        val line = layout["line"] as Map<*, *>

        assertEquals(3.0, line["value"])
        assertEquals("line", line["unit"])
        assertEquals("end", layout["lineAlign"])
        assertEquals(25.0, layout["position"])
        assertEquals("center", layout["positionAlign"])
        assertEquals(50.0, layout["size"])
        assertEquals("end", layout["textAlign"])
        assertEquals("vertical-rl", layout["writingMode"])
    }

    @Test
    fun `cue enter exposes fractional line alignment`() {
        val json = PlayerEvent.CueEnter(
            createCue(
                line = 0.1f,
                lineType = Cue.LineType.LineTypeFraction,
                lineAnchor = Cue.AnchorType.AnchorTypeEnd
            )
        ).toJson()
        val layout = json["layout"] as Map<*, *>
        val line = layout["line"] as Map<*, *>

        assertEquals(10.0, line["value"])
        assertEquals("percent", line["unit"])
        assertEquals("end", layout["lineAlign"])
    }

    @Test
    fun `cue enter emits position auto with explicit position anchor`() {
        val json = PlayerEvent.CueEnter(
            createCue(positionAnchor = Cue.AnchorType.AnchorTypeMiddle)
        ).toJson()
        val layout = json["layout"] as Map<*, *>

        assertEquals("auto", layout["position"])
        assertEquals("center", layout["positionAlign"])
        assertEquals("horizontal", layout["writingMode"])
    }
}

@Suppress("DEPRECATION")
private fun createCue(
    line: Float = Cue.DIMEN_UNSET,
    lineType: Cue.LineType = Cue.LineType.TypeUnset,
    lineAnchor: Cue.AnchorType = Cue.AnchorType.TypeUnset,
    position: Float = Cue.DIMEN_UNSET,
    positionAnchor: Cue.AnchorType = Cue.AnchorType.TypeUnset,
    size: Float = Cue.DIMEN_UNSET,
    textAlignment: Layout.Alignment? = null,
    verticalType: Cue.VerticalType = Cue.VerticalType.TypeUnset
) = Cue(
    1.0,
    2.0,
    "plain",
    "plain",
    "<b>plain</b>",
    null,
    textAlignment,
    line,
    lineType,
    lineAnchor,
    position,
    positionAnchor,
    size,
    Cue.DIMEN_UNSET,
    false,
    Color.BLACK,
    verticalType
)
