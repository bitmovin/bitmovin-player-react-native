#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(PlayerModule, PlayerModule, NSObject)

// UUID generation is sync and runs on the JS thread so it should be as
// fast as possible to avoid perf issues.
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(generateUUIDv4)

RCT_EXTERN_METHOD(initWithConfig:(NSString *)playerId config:(nullable id)config)
RCT_EXTERN_METHOD(loadSource:(NSString *)playerId config:(id)config)
RCT_EXTERN_METHOD(unload:(NSString *)playerId)
RCT_EXTERN_METHOD(play:(NSString *)playerId)
RCT_EXTERN_METHOD(pause:(NSString *)playerId)
RCT_EXTERN_METHOD(seek:(NSString *)playerId time:(nonnull NSNumber *)time)
RCT_EXTERN_METHOD(mute:(NSString *)playerId)
RCT_EXTERN_METHOD(unmute:(NSString *)playerId)
RCT_EXTERN_METHOD(destroy:(NSString *)playerId)
RCT_EXTERN_METHOD(setVolume:(NSString *)playerId volume:(nonnull NSNumber *)volume)
RCT_EXTERN_METHOD(
    source:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    getVolume:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    currentTime:(NSString *)playerId
    mode:(NSString *)mode
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    duration:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isMuted:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isPlaying:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isPaused:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isLive:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isAirPlayActive:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isAirPlayAvailable:(NSString *)playerId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

@end
