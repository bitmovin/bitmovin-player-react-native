#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(BitmovinCastManagerModule, BitmovinCastManagerModule, NSObject)

RCT_EXTERN_METHOD(
    isInitialized:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(
    initializeCasting:(nullable id)config
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(sendMessage:(NSString *)message messageNamespace:(nullable NSString *)messageNamespace)

@end
