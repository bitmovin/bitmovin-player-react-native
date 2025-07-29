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
        // Only initialize CastContext if GoogleCast is configured via Expo plugin
        if (!isCastConfigured(context)) {
            return
        }

        try {
            val castContextClass = Class.forName("com.google.android.gms.cast.framework.CastContext")
            val getSharedInstanceMethod = castContextClass.getMethod(
                "getSharedInstance",
                Context::class.java,
                java.util.concurrent.Executor::class.java,
            )
            val executor = Executors.newSingleThreadExecutor()
            
            // The method returns a Task<CastContext>, but we don't need to wait for it
            // The initialization will happen asynchronously
            getSharedInstanceMethod.invoke(null, context, executor)
        } catch (e: ClassNotFoundException) {
            // GoogleCast SDK not included in build - this is expected when not configured
        } catch (e: NoSuchMethodException) {
            Log.w("ActivityLifecycleListener", "GoogleCast SDK version incompatible: ${e.message}")
        } catch (e: Exception) {
            Log.w("ActivityLifecycleListener", "Failed to initialize GoogleCast: ${e.message}")
        }
    }

    private fun isCastConfigured(context: Context): Boolean {
        return try {
            val packageManager = context.packageManager
            val appInfo = packageManager.getApplicationInfo(context.packageName, 128)
            appInfo.metaData?.getString("com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME") != null
        } catch (e: Exception) {
            false
        }
    }
}
