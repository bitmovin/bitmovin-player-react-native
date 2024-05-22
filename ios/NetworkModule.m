#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(NetworkModule, NetworkModule, NSObject)

RCT_EXTERN_METHOD(initWithConfig:(NSString *)nativeId config:(nullable id)config)
RCT_EXTERN_METHOD(destroy:(NSString *)nativeId)
RCT_EXTERN_METHOD(setPreprocessedHttpResponse:(NSString *)nativeId response:(NSDictionary *)response)

@end
