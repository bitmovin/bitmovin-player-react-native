#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(FullscreenHandlerModule, FullscreenHandlerModule, NSObject)

RCT_EXTERN_METHOD(destroy:(NSString *)nativeId)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(onFullscreenChanged:(NSString *)nativeId isFullscreenEnabled:(BOOL)isFullscreenEnabled)
RCT_EXTERN_METHOD(registerHandler:(NSString *)nativeId)
@end
