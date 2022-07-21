#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(SourceModule, SourceModule, NSObject)

RCT_EXTERN_METHOD(initWithConfig:(NSString *)nativeId config:(nullable id)config)
RCT_EXTERN_METHOD(initWithDRMConfig:(NSString *)nativeId drmNativeId:(NSString *)drmNativeId config:(nullable id)config)
RCT_EXTERN_METHOD(destroy:(NSString *)nativeId)
RCT_EXTERN_METHOD(
    isAttachedToPlayer:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    isActive:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    duration:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    loadingState:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    getMetadata:(NSString *)nativeId
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setMetadata:(NSString *)nativeId metadata:(nullable id)metadata)

@end
