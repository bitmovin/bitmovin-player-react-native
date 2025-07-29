package com.bitmovin.player.reactnative

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import java.util.concurrent.Executors

class ActivityLifecycleListener : ReactActivityLifecycleListener {
    override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        maybeInitializeCastContext(activity)
    }

    private fun maybeInitializeCastContext(context: Context) {
        // Only execute Google Cast code if the CastContext class is available
        try {
            val castContextClass = Class.forName("com.google.android.gms.cast.framework.CastContext")
            val getSharedInstanceMethod = castContextClass.getMethod(
                "getSharedInstance",
                Context::class.java,
                java.util.concurrent.Executor::class.java,
            )
            val executor = Executors.newSingleThreadExecutor()
            getSharedInstanceMethod.invoke(null, context, executor)
        } catch (_: Exception) {}
    }
}
