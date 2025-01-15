import {
    withInfoPlist,
    withAndroidManifest,
    AndroidConfig,
    ConfigPlugin,
  } from 'expo/config-plugins';

  const withBitmovinConfig: ConfigPlugin<{ playerLicenseKey: string }> = (config, { playerLicenseKey }) => {
    config = withInfoPlist(config, config => {
        // TODO: Add support for AirPlay and Picture-in-Picture capabilities
      config.modResults['BitmovinPlayerLicenseKey'] = playerLicenseKey;
      return config;
    });

    config = withAndroidManifest(config, config => {
        /*
        TODO: add support for user-permissions

        <!--Only needed if the offline feature is used-->
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<!--END-->
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

        */
      const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

      AndroidConfig.Manifest.addMetaDataItemToMainApplication(
        mainApplication,
        'BITMOVIN_PLAYER_LICENSE_KEY',
        playerLicenseKey
      );

      /*
      TODO: add support for casting

          <!-- Following lines are needed for the usage of cast -->
    <activity
      android:name="com.bitmovin.player.casting.ExpandedControllerActivity"
      android:exported="true"
      android:label="@string/app_name"
      android:launchMode="singleTask"
      android:screenOrientation="portrait">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
      </intent-filter>
      <meta-data
        android:name="android.support.PARENT_ACTIVITY"
        android:value="com.bitmovin.player.reactnative.example.MainActivity" />
    </activity>

    <meta-data
      android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
      android:value="com.bitmovin.player.casting.BitmovinCastOptionsProvider" />

      ??? is this still casting?
    <service
      android:name="com.bitmovin.player.reactnative.services.MediaSessionPlaybackService"
      android:foregroundServiceType="mediaPlayback"
      android:exported="true">
      <intent-filter>
        <action android:name="androidx.media3.session.MediaSessionService"/>
      </intent-filter>
    </service>

      */

      return config;
    });

    return config;
  };

  export default withBitmovinConfig;
