package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedRef

class SharedSource(
    appContext: AppContext,
    source: Source,
    val legacyInstanceId: Int,
    private val callbacks: CallbackScope,
) : SharedRef<Source>(source, appContext) {
    val source: Source
        get() = ref

    override fun sharedObjectDidRelease() { callbacks.close() }
}
