package com.bitmovin.player.reactnative.example

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.android.gms.cast.framework.CastContext
import android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        try {
            // Load Google Cast context eagerly in order to ensure that
            // the cast state is updated correctly.
            CastContext.getSharedInstance(this, Runnable::run)
        } catch (e: Exception) {
            // cast framework not supported
        }

        // Prevent going into ambient mode on Android TV devices / screen timeout on mobile devices during playback.
        // If your app uses multiple activities make sure to add this flag to the activity that hosts the player.
        // Reference: https://developer.android.com/training/scheduling/wakelock#screen
        getWindow().addFlags(FLAG_KEEP_SCREEN_ON)
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "BitmovinPlayerReactNativeExample"

    /**
     * Returns the instance of the [ReactActivityDelegate]. Here we use a util class [ ] which allows you to easily enable Fabric and Concurrent React
     * (aka React 18) with two boolean flags.
     */
    override fun createReactActivityDelegate() = DefaultReactActivityDelegate(
        this,
        mainComponentName,  // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        fabricEnabled,
    )
}
