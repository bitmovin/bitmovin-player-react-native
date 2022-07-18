#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(UUIDModule, UUIDModule, NSObject)

// UUID generation is sync and runs on the JS thread so in order to avoid performance
// issues, it should be as fast as possible.
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(generate)

@end
