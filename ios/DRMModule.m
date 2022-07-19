#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(DRMModule, DRMModule, NSObject)

RCT_EXTERN_METHOD(initWithConfig:(NSString *)nativeId config:(nullable id)config)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setPreparedCertificate:(NSString *)nativeId certificate:(NSString *)certificate)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setPreparedMessage:(NSString *)nativeId message:(NSString *)message)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setPreparedSyncMessage:(NSString *)nativeId syncMessage:(NSString *)syncMessage)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setPreparedLicense:(NSString *)nativeId license:(NSString *)license)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setPreparedLicenseServerUrl:(NSString *)nativeId url:(NSString *)url)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setPreparedContentId:(NSString *)nativeId contentId:(NSString *)contentId)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(setProvidedLicenseData:(NSString *)nativeId licenseData:(nullable NSString *)licenseData)

@end
