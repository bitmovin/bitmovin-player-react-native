#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(CustomMessageHandlerModule, CustomMessageHandlerModule, NSObject)

RCT_EXTERN_METHOD(destroy:(NSString *)nativeId)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(onReceivedSynchronousMessageResult:(NSString *)nativeId result:(nullable NSString *)result)
RCT_EXTERN_METHOD(sendMessage:(NSString *)nativeId message:(NSString *)message data:(nullable NSString *)data)
RCT_EXTERN_METHOD(registerHandler:(NSString *)nativeId)
@end
