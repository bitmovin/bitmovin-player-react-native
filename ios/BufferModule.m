#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(BufferModule, BufferModule, NSObject)

RCT_EXTERN_METHOD(getLevel:(NSString *)nativeId type:(nonnull NSString *)type resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setTargetLevel:(NSString *)nativeId type:(nonnull NSString *)type value:(nonnull NSNumber *)value)

@end
