package com.bitmovin.player.reactnative

import android.graphics.Color
import android.graphics.Typeface
import android.util.TypedValue
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.google.android.exoplayer2.ui.CaptionStyleCompat

private const val MODULE_NAME = "BitmovinSubtitleView"

@ReactModule(name = MODULE_NAME)
class RNSubtitleViewManager(private val context: ReactApplicationContext) :
    SimpleViewManager<SubtitleView>() {

    /**
     * Exported module name to JS.
     */
    override fun getName() = MODULE_NAME

    /**
     * The component's native view factory. RN calls this method multiple times
     * for each component instance.
     */
    override fun createViewInstance(reactContext: ThemedReactContext) = SubtitleView(reactContext)

    @ReactProp(name = "playerId")
    fun setPlayerId(view: SubtitleView, playerId: String?) {
        val player = context.getNativeModule(PlayerModule::class.java)?.getPlayer(playerId)
        if (player != null) {
            view.setPlayer(player)
        }
    }

    /**
     * Sets whether font sizes embedded within the cues should be applied.
     * Enabled by default.
     * Only takes effect if setApplyEmbeddedStyles is set to true.
     */
    @ReactProp(name = "applyEmbeddedFontSizes", defaultBoolean = true)
    fun setApplyEmbeddedFontSizes(view: SubtitleView, applyEmbeddedFontSizes: Boolean) {
        view.setApplyEmbeddedFontSizes(applyEmbeddedFontSizes)
    }

    /**
     * Sets whether styling embedded within the cues should be applied.
     * Enabled by default.
     * Overrides any setting made with setApplyEmbeddedFontSizes.
     */
    @ReactProp(name = "applyEmbeddedStyles", defaultBoolean = true)
    fun setApplyEmbeddedStyles(view: SubtitleView, applyEmbeddedStyles: Boolean) {
        view.setApplyEmbeddedStyles(applyEmbeddedStyles)
    }

    /**
     * Sets the caption style to be equivalent to the one returned by getUserStyle, or to a default style before API level 19.
     */
    @ReactProp(name = "userDefaultStyle", defaultBoolean = false)
    fun setUserDefaultStyle(view: SubtitleView, userDefaultStyle: Boolean) {
        if (userDefaultStyle) {
            view.setUserDefaultStyle()
        }
    }

    /**
     * Sets the text size to one derived from getFontScale, or to a default size before API level 19.
     */
    @ReactProp(name = "userDefaultTextSize", defaultBoolean = false)
    fun setUserDefaultTextSize(view: SubtitleView, userDefaultTextSize: Boolean) {
        if (userDefaultTextSize) {
            view.setUserDefaultTextSize()
        }
    }

    /**
     * Sets the bottom padding fraction to apply when getLine is DIMEN_UNSET, as a fraction of the view's remaining height after its top and bottom padding have been subtracted.
     */
    @ReactProp(name = "bottomPaddingFraction", defaultFloat = -1.0f)
    fun setBottomPaddingFraction(view: SubtitleView, bottomPaddingFraction: Float) {
        if (bottomPaddingFraction > 0) {
            view.setBottomPaddingFraction(bottomPaddingFraction)
        }
    }

    /**
     * Set the text size to a given unit and value.
     */
    @ReactProp(name = "fixedTextSize")
    fun setFixedTextSize(view: SubtitleView, fixedTextSize: ReadableMap?) {
        if (fixedTextSize != null && fixedTextSize.hasKey("size")) {
            val size = fixedTextSize.getDouble("size")
            val unit = fixedSizeUnit(fixedTextSize)
            if (size > 0) {
                view.setFixedTextSize(unit, size.toFloat())
            }

        }
    }

    /**
     * Sets the caption style of the subtitle view.
     */
    @ReactProp(name = "captionStyle")
    fun setCaptionStyle(view: SubtitleView, captionStyle: ReadableMap?) {
        if (captionStyle != null) {
            view.setStyle(
                CaptionStyleCompat(
                    color(captionStyle, "foregroundColor", -1),
                    color(captionStyle, "backgroundColor", android.R.color.black),
                    color(captionStyle, "windowColor", 0),
                    edgeType(captionStyle),
                    color(captionStyle, "edgeColor", -1),
                    typeFace(captionStyle)
                )
            )
        }
    }

    private fun edgeType(captionStyle: ReadableMap): Int {
        if (!captionStyle.hasKey("edgeType")) {
            return CaptionStyleCompat.EDGE_TYPE_NONE
        }

        return when (captionStyle.getString("edgeType")) {
            "EDGE_TYPE_OUTLINE" -> CaptionStyleCompat.EDGE_TYPE_OUTLINE
            "EDGE_TYPE_DROP_SHADOW" -> CaptionStyleCompat.EDGE_TYPE_DROP_SHADOW
            "EDGE_TYPE_RAISED" -> CaptionStyleCompat.EDGE_TYPE_RAISED
            "EDGE_TYPE_DEPRESSED" -> CaptionStyleCompat.EDGE_TYPE_DEPRESSED
            else -> CaptionStyleCompat.EDGE_TYPE_NONE
        }
    }

    private fun color(captionStyle: ReadableMap, colorKey: String, defaultColor: Int): Int {
        if(!captionStyle.hasKey(colorKey)) {
            return defaultColor
        }

        return Color.parseColor(captionStyle.getString(colorKey))
    }

    private fun typeFace(captionStyle: ReadableMap): Typeface {
        if (!captionStyle.hasKey("typeFace")) {
            return Typeface.DEFAULT
        }

        return JsonConverter.toTypeface(captionStyle.getMap("typeFace"))
    }

    /**
     * Sets the text size to be a fraction of the height of this view.
     * When `ignorePadding` is true, sets the text size to be a fraction of the views remaining height after its top and bottom padding have been subtracted.
     */
    @ReactProp(name = "fractionalTextSize")
    fun setFractionalTextSize(view: SubtitleView, fractionalTextSize: ReadableMap?) {
        if (fractionalTextSize != null && fractionalTextSize.hasKey("fractionOfHeight")) {
            val fractionOfHeight = fractionalTextSize.getDouble("fractionOfHeight")
            if (fractionOfHeight > -1) {
                if (fractionalTextSize.hasKey("ignorePadding")) {
                    val ignorePadding = fractionalTextSize.getBoolean("ignorePadding")
                    view.setFractionalTextSize(fractionOfHeight.toFloat(), ignorePadding)
                } else {
                    view.setFractionalTextSize(fractionOfHeight.toFloat())
                }
            }
        }
    }

    private fun fixedSizeUnit(fixedTextSize: ReadableMap): Int {
        if (!fixedTextSize.hasKey("unit") || fixedTextSize.getString("unit").isNullOrEmpty()) {
            return TypedValue.COMPLEX_UNIT_SP
        }

        return when (fixedTextSize.getString("unit")) {
            "COMPLEX_UNIT_PX" -> TypedValue.COMPLEX_UNIT_PX
            "COMPLEX_UNIT_DIP" -> TypedValue.COMPLEX_UNIT_DIP
            "COMPLEX_UNIT_SP" -> TypedValue.COMPLEX_UNIT_SP
            "COMPLEX_UNIT_PT" -> TypedValue.COMPLEX_UNIT_PT
            "COMPLEX_UNIT_IN" -> TypedValue.COMPLEX_UNIT_IN
            "COMPLEX_UNIT_MM" -> TypedValue.COMPLEX_UNIT_MM
            else -> TypedValue.COMPLEX_UNIT_SP
        }
    }

}
