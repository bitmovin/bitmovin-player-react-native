package com.bitmovin.player.reactnative

import android.app.Activity
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ActivityLifecycleListener : ReactActivityLifecycleListener {
    override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        maybeInitializeCastContext()
    }

    private fun maybeInitializeCastContext() {
        // Only execute Google Cast code if the CastContext class is available
        try {
            val castContextClass = Class.forName("com.google.android.gms.cast.framework.CastContext")
            val getSharedInstanceMethod = castContextClass.getMethod("getSharedInstance", Any::class.java, Runnable::class.java)
            getSharedInstanceMethod.invoke(null, this, Runnable { })
        } catch (_: Exception) { }
    }
}
