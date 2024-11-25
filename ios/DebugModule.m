#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(DebugModule, DebugModule, NSObject)

RCT_EXTERN_METHOD(setDebugLoggingEnabled:(nonnull BOOL)enabled)

@end
