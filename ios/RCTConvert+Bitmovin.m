#import "RCTConvert+Bitmovin.h"

@implementation RCTConvert(Bitmovin)

RCT_ENUM_CONVERTER(
    BMPTimeMode,
    (@{
        @"absolute": @(BMPTimeModeAbsoluteTime),
        @"relative": @(BMPTimeModeRelativeTime),
    }),
    BMPTimeModeAbsoluteTime,
    unsignedIntegerValue)

RCT_ENUM_CONVERTER(
    BMPSourceType,
    (@{
        @"none": @(BMPSourceTypeNone),
        @"hls": @(BMPSourceTypeHls),
        @"dash": @(BMPSourceTypeDash),
        @"movpkg": @(BMPSourceTypeMovpkg),
        @"progressive": @(BMPSourceTypeProgressive),
    }),
    BMPSourceTypeNone,
    integerValue)

+ (BMPPlayerConfig *)BMPPlayerConfig:(id)json
{
    BMPPlayerConfig *config = [BMPPlayerConfig new];
    [config setKey:[RCTConvert NSString:json[@"licenseKey"]]];
    return config;
}

+ (BMPSourceConfig *)BMPSourceConfig:(id)json
{
    NSURL *url = [RCTConvert NSURL:json[@"url"]];
    BMPSourceType type = [RCTConvert BMPSourceType:json[@"type"]];
    BMPSourceConfig *config = [[BMPSourceConfig alloc] initWithUrl:url type:type];
    if (json[@"poster"]) {
        [config setPosterSource:[RCTConvert NSURL:json[@"poster"]]];
    }
    return config;
}

@end
