package com.bitmovin.player.reactnative

import android.app.Activity
import android.os.Bundle
import android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
      // TODO: Roland use config for this
      try {
          // Load Google Cast context eagerly in order to ensure that
          // the cast state is updated correctly.
          CastContext.getSharedInstance(this, Runnable::run)
      } catch (e: Exception) {
          // cast framework not supported
      }

      // TODO: Roland use config for this

      // Prevent going into ambient mode on Android TV devices / screen timeout on mobile devices during playback.
      // If your app uses multiple activities make sure to add this flag to the activity that hosts the player.
      // Reference: https://developer.android.com/training/scheduling/wakelock#screen
      getWindow().addFlags(FLAG_KEEP_SCREEN_ON)
  }
}