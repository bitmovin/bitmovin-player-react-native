package com.bitmovin.player.reactnative.example;

import android.os.Bundle;
import androidx.annotation.Nullable;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.google.android.gms.cast.framework.CastContext;

import static android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON;

public class MainActivity extends ReactActivity {
  @Override
  public void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(null);
    try {
      // Load Google Cast context eagerly in order to ensure that
      // the cast state is updated correctly.
      CastContext.getSharedInstance(this, Runnable::run);
    } catch (Exception e) {
      // cast framework not supported
    }

    // Prevent going into ambient mode on Android TV devices / screen timeout on mobile devices during playback.
    // If your app uses multiple activities make sure to add this flag to the activity that hosts the player.
    // Reference: https://developer.android.com/training/scheduling/wakelock#screen
    getWindow().addFlags(FLAG_KEEP_SCREEN_ON);
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "BitmovinPlayerReactNativeExample";
  }

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            // If you opted-in for the New Architecture, we enable the Fabric Renderer.
            DefaultNewArchitectureEntryPoint.getFabricEnabled());
  }
}
