package com.bitmovin.player.reactnative.extensions

import com.bitmovin.analytics.api.CustomData

operator fun CustomData.get(index: Int): String? = when (index) {
    1 -> customData1
    2 -> customData2
    3 -> customData3
    4 -> customData4
    5 -> customData5
    6 -> customData6
    7 -> customData7
    8 -> customData8
    9 -> customData9
    10 -> customData10
    11 -> customData11
    12 -> customData12
    13 -> customData13
    14 -> customData14
    15 -> customData15
    16 -> customData16
    17 -> customData17
    18 -> customData18
    19 -> customData19
    20 -> customData20
    21 -> customData21
    22 -> customData22
    23 -> customData23
    24 -> customData24
    25 -> customData25
    26 -> customData26
    27 -> customData27
    28 -> customData28
    29 -> customData29
    30 -> customData30
    else -> throw IndexOutOfBoundsException()
}

operator fun CustomData.Builder.set(index: Int, value: String?) = when (index) {
    1 -> setCustomData1(value)
    2 -> setCustomData2(value)
    3 -> setCustomData3(value)
    4 -> setCustomData4(value)
    5 -> setCustomData5(value)
    6 -> setCustomData6(value)
    7 -> setCustomData7(value)
    8 -> setCustomData8(value)
    9 -> setCustomData9(value)
    10 -> setCustomData10(value)
    11 -> setCustomData11(value)
    12 -> setCustomData12(value)
    13 -> setCustomData13(value)
    14 -> setCustomData14(value)
    15 -> setCustomData15(value)
    16 -> setCustomData16(value)
    17 -> setCustomData17(value)
    18 -> setCustomData18(value)
    19 -> setCustomData19(value)
    20 -> setCustomData20(value)
    21 -> setCustomData21(value)
    22 -> setCustomData22(value)
    23 -> setCustomData23(value)
    24 -> setCustomData24(value)
    25 -> setCustomData25(value)
    26 -> setCustomData26(value)
    27 -> setCustomData27(value)
    28 -> setCustomData28(value)
    29 -> setCustomData29(value)
    30 -> setCustomData30(value)
    else -> throw IndexOutOfBoundsException()
}
