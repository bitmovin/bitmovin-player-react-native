#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(PlayerModule, PlayerModule, NSObject)

RCT_EXTERN_METHOD(initWithConfig:(id)config)
RCT_EXTERN_METHOD(load:(NSString *)playerId config:(id)config)
RCT_EXTERN_METHOD(play:(NSString *)playerId)
RCT_EXTERN_METHOD(destroy:(NSString *)playerId)
RCT_EXTERN_METHOD(
  getSource:(NSString *)playerId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject)

@end
