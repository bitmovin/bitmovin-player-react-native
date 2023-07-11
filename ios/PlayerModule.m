#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(PlayerModule, PlayerModule, NSObject)

RCT_EXTERN_METHOD(initWithConfig:(NSString *)nativeId config:(nullable id)config)
RCT_EXTERN_METHOD(loadSource:(NSString *)nativeId sourceNativeId:(NSString *)sourceNativeId)
RCT_EXTERN_METHOD(loadOfflineSource:(NSString *)nativeId offlineContentManagerHolderNativeId:(NSString *)offlineContentManagerHolderNativeId options:(nullable id)options)
RCT_EXTERN_METHOD(unload:(NSString *)nativeId)
RCT_EXTERN_METHOD(play:(NSString *)nativeId)
RCT_EXTERN_METHOD(pause:(NSString *)nativeId)
RCT_EXTERN_METHOD(seek:(NSString *)nativeId time:(nonnull NSNumber *)time)
RCT_EXTERN_METHOD(timeShift:(NSString *)nativeId offset:(nonnull NSNumber *)time)
RCT_EXTERN_METHOD(mute:(NSString *)nativeId)
RCT_EXTERN_METHOD(unmute:(NSString *)nativeId)
RCT_EXTERN_METHOD(destroy:(NSString *)nativeId)
RCT_EXTERN_METHOD(setVolume:(NSString *)nativeId volume:(nonnull NSNumber *)volume)
RCT_EXTERN_METHOD(
    getVolume:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    currentTime:(NSString *)nativeId
    mode:(NSString *)mode
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    duration:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isMuted:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isPlaying:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isPaused:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isLive:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isAirPlayActive:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isAirPlayAvailable:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    getAvailableAudioTracks:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    setAudioTrack:(NSString *)nativeId
    trackIdentifier:(NSString *)trackIdentifier
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    getAvailableSubtitles:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    setSubtitleTrack:(NSString *)nativeId
    trackIdentifier:(NSString *)trackIdentifier
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(scheduleAd:(NSString *)nativeId adItemJson:(nullable id)adItemJson)
RCT_EXTERN_METHOD(skipAd:(NSString *)nativeId)
RCT_EXTERN_METHOD(
    isAd:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    getTimeShift:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    getMaxTimeShift:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

@end
