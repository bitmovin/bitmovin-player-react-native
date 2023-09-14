#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(PlayerAnalyticsModule, PlayerAnalyticsModule, NSObject)

RCT_EXTERN_METHOD(sendCustomDataEvent:(NSString *)nativeId json:(nullable id)json)
RCT_EXTERN_METHOD(getUserId:(NSString *)nativeId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
