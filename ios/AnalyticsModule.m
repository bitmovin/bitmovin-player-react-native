#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(AnalyticsModule, AnalyticsModule, NSObject)

RCT_EXTERN_METHOD(initWithConfig:(NSString *)nativeId config:(nullable id)config)
RCT_EXTERN_METHOD(destroy:(NSString *)nativeId)
RCT_EXTERN_METHOD(attach:(NSString *)nativeId playerId:(NSString *)playerId)
RCT_EXTERN_METHOD(detach:(NSString *)nativeId)
RCT_EXTERN_METHOD(setCustomDataOnce:(NSString *)nativeId json:(nullable id)json)
RCT_EXTERN_METHOD(setCustomData:(NSString *)nativeId playerId:(nullable NSString *)playerId json:(nullable id)json)
RCT_EXTERN_METHOD(getCustomData:(NSString *)nativeId playerId:(nullable NSString *)playerId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getUserId:(NSString *)nativeId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
