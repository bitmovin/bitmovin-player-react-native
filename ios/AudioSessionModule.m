#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(AudioSessionModule, AudioSessionModule, NSObject)

RCT_EXTERN_METHOD(
    setCategory:(NSString *)category
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

@end
