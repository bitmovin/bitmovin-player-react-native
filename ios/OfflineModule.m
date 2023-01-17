#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_REMAP_MODULE(BitmovinOfflineModule, OfflineModule, RCTEventEmitter)

RCT_EXTERN_METHOD(
                  initWithConfig:(NSString *)nativeId
                  config:(nullable id)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getOfflineSourceConfig:(NSString *)nativeId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getOptions:(NSString *)nativeId)
RCT_EXTERN_METHOD(
                  process:(NSString *)nativeId
                  request:(nullable id)request
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(resume:(NSString *)nativeId)
RCT_EXTERN_METHOD(suspend:(NSString *)nativeId)
RCT_EXTERN_METHOD(cancelDownload:(NSString *)nativeId)
RCT_EXTERN_METHOD(deleteAll:(NSString *)nativeId)
RCT_EXTERN_METHOD(downloadLicense:(NSString *)nativeId)
RCT_EXTERN_METHOD(renewOfflineLicense:(NSString *)nativeId)
RCT_EXTERN_METHOD(release:(NSString *)nativeId)

@end
