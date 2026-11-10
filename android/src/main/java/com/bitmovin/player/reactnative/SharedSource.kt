package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedRef

/** Shared handle used by source APIs while SourceModule still controls creation and release. */
class SharedSource(appContext: AppContext, source: Source) : SharedRef<Source>(source, appContext) {
    val source: Source
        get() = ref
}
