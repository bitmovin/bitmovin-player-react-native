package com.bitmovin.player.reactnative

import android.app.Activity
import android.os.Bundle
import android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ActivityLifecycleListener : ReactActivityLifecycleListener {
    override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        maybeInitializeCastContext()

        // Prevent going into ambient mode on Android TV devices / screen timeout on mobile devices during playback.
        // If your app uses multiple activities make sure to add this flag to the activity that hosts the player.
        // Reference: https://developer.android.com/training/scheduling/wakelock#screen
        activity.window.addFlags(FLAG_KEEP_SCREEN_ON)
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
